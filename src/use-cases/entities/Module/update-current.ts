import { IUserCourseRepository } from "../../../repositories/user-course-repository";
import { IModuleRepository } from "../../../repositories/module-repository";
import { ICourseRepository } from "../../../repositories/course-repository";
import { prisma } from "../../../lib/prisma";
import { CourseNotFoundError } from "../../errors/course-not-found";
import { ModuleNotFoundError } from "../../errors/module-not-found";

interface UpdateCurrentModuleRequest {
  userId: string;
  courseId: string;
  moduleId: string;
}

interface UpdateCurrentModuleResponse {
  userCourse: {
    id: string;
    currentModuleId: string | null;
    currentTaskId: number | null;
  };
}

export class UpdateCurrentModuleUseCase {
  constructor(
    private userCourseRepository: IUserCourseRepository,
    private moduleRepository: IModuleRepository,
    private courseRepository: ICourseRepository
  ) {}

  async execute({
    userId,
    courseId,
    moduleId,
  }: UpdateCurrentModuleRequest): Promise<UpdateCurrentModuleResponse> {
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

    // Verificar se o módulo existe e pertence ao curso
    const module = await this.moduleRepository.findById(moduleId);
    if (!module) {
      throw new ModuleNotFoundError();
    }

    if (module.courseId !== courseId) {
      throw new Error("Module does not belong to this course");
    }

    // Buscar a primeira lesson do módulo para atualizar o currentTaskId
    const moduleWithLessons = await prisma.module.findUnique({
      where: { id: moduleId },
      include: {
        groups: {
          orderBy: {
            id: "asc",
          },
          include: {
            lessons: {
              orderBy: {
                order: "asc",
              },
              take: 1,
            },
          },
        },
      },
    });

    // Se o módulo já é o atual e o usuário já tem uma task, manter a task atual
    // Caso contrário, definir para a primeira lesson do módulo
    let currentTaskId: number | null = null;

    if (userCourse.currentModuleId === moduleId && userCourse.currentTaskId) {
      // Verificar se a task atual ainda pertence ao módulo
      const currentTask = await prisma.lesson.findUnique({
        where: { id: userCourse.currentTaskId },
        include: {
          submodule: {
            include: {
              module: true,
            },
          },
        },
      });

      if (currentTask?.submodule.module.id === moduleId) {
        // Manter a task atual se ainda pertence ao módulo
        currentTaskId = userCourse.currentTaskId;
      } else {
        // Se não pertence mais, usar a primeira lesson do módulo
        const firstGroup = moduleWithLessons?.groups[0];
        const firstLesson = firstGroup?.lessons[0];
        currentTaskId = firstLesson?.id ?? null;
      }
    } else {
      // Se está mudando de módulo, usar a primeira lesson do novo módulo
      const firstGroup = moduleWithLessons?.groups[0];
      const firstLesson = firstGroup?.lessons[0];
      currentTaskId = firstLesson?.id ?? null;
    }

    // Atualizar o UserCourse
    const updatedUserCourse = await this.userCourseRepository.update(
      userCourse.id,
      {
        currentModuleId: moduleId,
        currentTaskId,
        lastAccessedAt: new Date(),
      }
    );

    return {
      userCourse: {
        id: updatedUserCourse.id,
        currentModuleId: updatedUserCourse.currentModuleId,
        currentTaskId: updatedUserCourse.currentTaskId,
      },
    };
  }
}

