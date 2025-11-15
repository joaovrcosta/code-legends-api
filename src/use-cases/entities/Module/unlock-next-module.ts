import { IUserCourseRepository } from "../../../repositories/user-course-repository";
import { ICourseRepository } from "../../../repositories/course-repository";
import { IUserProgressRepository } from "../../../repositories/user-progress-repository";
import { prisma } from "../../../lib/prisma";
import { CourseNotFoundError } from "../../errors/course-not-found";

interface UnlockNextModuleRequest {
  userId: string;
  courseId: string;
}

interface UnlockNextModuleResponse {
  userCourse: {
    id: string;
    currentModuleId: string | null;
    currentTaskId: number | null;
  };
  nextModuleId: string | null;
}

export class UnlockNextModuleUseCase {
  constructor(
    private userCourseRepository: IUserCourseRepository,
    private courseRepository: ICourseRepository,
    private userProgressRepository: IUserProgressRepository
  ) {}

  async execute({
    userId,
    courseId,
  }: UnlockNextModuleRequest): Promise<UnlockNextModuleResponse> {
    // Verificar se o curso existe
    const course = await this.courseRepository.findById(courseId);
    if (!course) {
      throw new CourseNotFoundError();
    }

    // Verificar se o usuário está inscrito no curso
    const userCourse = await this.userCourseRepository.findByUserAndCourse(
      userId,
      courseId
    );

    if (!userCourse) {
      throw new Error("User is not enrolled in this course");
    }

    // Buscar todos os módulos do curso em ordem
    const allModules = await prisma.module.findMany({
      where: { courseId },
      include: {
        groups: {
          include: {
            lessons: {
              select: {
                id: true,
              },
            },
          },
        },
      },
      orderBy: {
        id: "asc",
      },
    });

    if (allModules.length === 0) {
      throw new Error("Course has no modules");
    }

    // Encontrar o índice do módulo atual
    const currentModuleIndex = userCourse.currentModuleId
      ? allModules.findIndex((m) => m.id === userCourse.currentModuleId)
      : -1;

    // Se não há módulo atual, definir o primeiro como atual
    if (currentModuleIndex === -1) {
      const firstModule = allModules[0];
      const firstGroup = firstModule.groups[0];
      const firstLesson = firstGroup?.lessons[0];

      const updatedUserCourse = await this.userCourseRepository.update(
        userCourse.id,
        {
          currentModuleId: firstModule.id,
          currentTaskId: firstLesson?.id ?? null,
          lastAccessedAt: new Date(),
        }
      );

      return {
        userCourse: {
          id: updatedUserCourse.id,
          currentModuleId: updatedUserCourse.currentModuleId,
          currentTaskId: updatedUserCourse.currentTaskId,
        },
        nextModuleId: null,
      };
    }

    const currentModule = allModules[currentModuleIndex];

    // Verificar se o módulo atual está 100% completo
    const totalLessons = currentModule.groups.reduce(
      (acc, group) => acc + group.lessons.length,
      0
    );

    const completedLessons =
      await this.userProgressRepository.countCompletedInModule(
        userId,
        currentModule.id
      );

    const isCurrentModuleCompleted = completedLessons === totalLessons && totalLessons > 0;

    if (!isCurrentModuleCompleted) {
      throw new Error(
        "Current module is not completed. Complete all lessons before unlocking the next module."
      );
    }

    // Verificar se há próximo módulo
    if (currentModuleIndex >= allModules.length - 1) {
      throw new Error("There is no next module to unlock. Course completed!");
    }

    // Avançar para o próximo módulo
    const nextModule = allModules[currentModuleIndex + 1];
    const nextModuleFirstGroup = nextModule.groups[0];
    const nextModuleFirstLesson = nextModuleFirstGroup?.lessons[0];

    const updatedUserCourse = await this.userCourseRepository.update(
      userCourse.id,
      {
        currentModuleId: nextModule.id,
        currentTaskId: nextModuleFirstLesson?.id ?? null,
        lastAccessedAt: new Date(),
      }
    );

    return {
      userCourse: {
        id: updatedUserCourse.id,
        currentModuleId: updatedUserCourse.currentModuleId,
        currentTaskId: updatedUserCourse.currentTaskId,
      },
      nextModuleId: nextModule.id,
    };
  }
}

