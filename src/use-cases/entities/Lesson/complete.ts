import { IUserProgressRepository } from "../../../repositories/user-progress-repository";
import { IUserModuleProgressRepository } from "../../../repositories/user-module-progress-repository";
import { IUserCourseRepository } from "../../../repositories/user-course-repository";
import { ILessonRepository } from "../../../repositories/lesson-repository";
import { IModuleRepository } from "../../../repositories/module-repository";
import { ICourseRepository } from "../../../repositories/course-repository";
import { LessonNotFoundError } from "../../errors/lesson-not-found";
import { CourseNotFoundError } from "../../errors/course-not-found";
import { prisma } from "../../../lib/prisma";

interface CompleteLessonRequest {
  userId: string;
  lessonId: number;
  score?: number;
}

interface CompleteLessonResponse {
  nextLessonId: number | null;
  moduleCompleted: boolean;
  courseCompleted: boolean;
  courseProgress: number;
}

export class CompleteLessonUseCase {
  constructor(
    private userProgressRepository: IUserProgressRepository,
    private userModuleProgressRepository: IUserModuleProgressRepository,
    private userCourseRepository: IUserCourseRepository,
    private lessonRepository: ILessonRepository,
    private moduleRepository: IModuleRepository,
    private courseRepository: ICourseRepository
  ) {}

  async execute({
    userId,
    lessonId,
    score,
  }: CompleteLessonRequest): Promise<CompleteLessonResponse> {
    // Buscar a aula com todas as relações necessárias
    const lesson = await this.lessonRepository.findById(lessonId);
    if (!lesson) {
      throw new LessonNotFoundError();
    }

    // Buscar o grupo (submodule) para obter o moduleId
    const group = await prisma.group.findUnique({
      where: { id: lesson.submoduleId },
      include: {
        module: true,
      },
    });

    if (!group) {
      throw new Error("Group not found");
    }

    const courseId = group.module.courseId;

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

    // Marcar a aula como concluída
    await this.userProgressRepository.upsert({
      userId,
      taskId: lessonId,
      userCourseId: userCourse.id,
      isCompleted: true,
      score,
    });

    // Buscar todas as aulas do módulo para calcular o progresso
    const moduleWithLessons = await prisma.module.findUnique({
      where: { id: group.moduleId },
      include: {
        groups: {
          include: {
            lessons: {
              orderBy: {
                order: "asc",
              },
            },
          },
          orderBy: {
            id: "asc",
          },
        },
      },
    });

    if (!moduleWithLessons) {
      throw new Error("Module not found");
    }

    // Calcular total de aulas do módulo
    const totalTasksInModule = moduleWithLessons.groups.reduce(
      (acc, group) => acc + group.lessons.length,
      0
    );

    // Contar aulas concluídas no módulo
    const tasksCompleted =
      await this.userProgressRepository.countCompletedInModule(
        userId,
        group.moduleId
      );

    // Calcular progresso do módulo
    const moduleProgress =
      totalTasksInModule > 0 ? tasksCompleted / totalTasksInModule : 0;
    const moduleCompleted = tasksCompleted === totalTasksInModule;

    // Atualizar progresso do módulo
    await this.userModuleProgressRepository.upsert({
      userId,
      moduleId: group.moduleId,
      userCourseId: userCourse.id,
      totalTasks: totalTasksInModule,
      tasksCompleted,
      progress: moduleProgress,
      isCompleted: moduleCompleted,
    });

    // Buscar todas as aulas do curso em ordem
    const allLessons = await this.getAllLessonsInOrder(courseId);

    // Encontrar a próxima aula não concluída
    let nextLessonId: number | null = null;
    const currentLessonIndex = allLessons.findIndex((l) => l.id === lessonId);

    if (currentLessonIndex !== -1) {
      // Verificar se há próxima aula e se ela está desbloqueada
      for (let i = currentLessonIndex + 1; i < allLessons.length; i++) {
        const nextLesson = allLessons[i];
        const isUnlocked = await this.isLessonUnlocked(
          userId,
          nextLesson.id,
          allLessons
        );

        if (isUnlocked) {
          nextLessonId = nextLesson.id;
          break;
        }
      }
    }

    // Calcular progresso do curso
    const completedLessons = await prisma.userProgress.count({
      where: {
        userId,
        isCompleted: true,
        task: {
          submodule: {
            module: {
              courseId,
            },
          },
        },
      },
    });

    const courseProgress =
      allLessons.length > 0 ? completedLessons / allLessons.length : 0;
    const courseCompleted = completedLessons === allLessons.length;

    // Atualizar UserCourse
    const nextLesson = nextLessonId
      ? allLessons.find((l) => l.id === nextLessonId)
      : null;

    if (nextLesson && nextLessonId !== null) {
      const nextLessonGroup = await prisma.group.findFirst({
        where: {
          lessons: {
            some: {
              id: nextLessonId,
            },
          },
        },
        include: {
          module: true,
        },
      });

      await this.userCourseRepository.update(userCourse.id, {
        currentTaskId: nextLessonId ?? null,
        currentModuleId:
          nextLessonGroup?.moduleId ?? userCourse.currentModuleId ?? null,
        progress: courseProgress,
        isCompleted: courseCompleted,
        completedAt: courseCompleted ? new Date() : null,
      });
    } else {
      await this.userCourseRepository.update(userCourse.id, {
        currentTaskId: null,
        progress: courseProgress,
        isCompleted: true,
        completedAt: new Date(),
      });
    }

    return {
      nextLessonId,
      moduleCompleted,
      courseCompleted,
      courseProgress,
    };
  }

  private async getAllLessonsInOrder(courseId: string) {
    const modules = await prisma.module.findMany({
      where: { courseId },
      include: {
        groups: {
          include: {
            lessons: {
              orderBy: {
                order: "asc",
              },
            },
          },
          orderBy: {
            id: "asc",
          },
        },
      },
      orderBy: {
        id: "asc",
      },
    });

    const allLessons: Array<{ id: number; order: number }> = [];
    for (const module of modules) {
      for (const group of module.groups) {
        for (const lesson of group.lessons) {
          allLessons.push({
            id: lesson.id,
            order: lesson.order,
          });
        }
      }
    }

    return allLessons;
  }

  private async isLessonUnlocked(
    userId: string,
    lessonId: number,
    allLessons: Array<{ id: number }>
  ): Promise<boolean> {
    const lessonIndex = allLessons.findIndex((l) => l.id === lessonId);

    // Primeira aula sempre está desbloqueada
    if (lessonIndex === 0) {
      return true;
    }

    // Verificar se a aula anterior foi concluída
    const previousLesson = allLessons[lessonIndex - 1];
    const previousProgress =
      await this.userProgressRepository.findByUserAndTask(
        userId,
        previousLesson.id
      );

    return previousProgress?.isCompleted ?? false;
  }
}
