import { ICourseRepository } from "../../../repositories/course-repository";
import { IUserCourseRepository } from "../../../repositories/user-course-repository";
import { IUserProgressRepository } from "../../../repositories/user-progress-repository";
import { CourseNotFoundError } from "../../errors/course-not-found";
import { prisma } from "../../../lib/prisma";

interface RoadmapLesson {
  id: number;
  title: string;
  slug: string;
  description: string;
  type: string;
  video_url: string | null;
  video_duration: string | null;
  order: number;
  status: "locked" | "unlocked" | "completed";
  isCurrent: boolean;
  canReview: boolean; // Permite revisitar aulas concluídas
}

interface RoadmapGroup {
  id: number;
  title: string;
  lessons: RoadmapLesson[];
}

interface RoadmapModule {
  id: string;
  title: string;
  slug: string;
  groups: RoadmapGroup[];
  progress: number;
  isCompleted: boolean;
}

interface GetRoadmapRequest {
  userId: string;
  courseId: string;
}

interface GetRoadmapResponse {
  course: {
    id: string;
    title: string;
    slug: string;
    progress: number;
    isCompleted: boolean;
  };
  modules: RoadmapModule[];
}

export class GetRoadmapUseCase {
  constructor(
    private courseRepository: ICourseRepository,
    private userCourseRepository: IUserCourseRepository,
    private userProgressRepository: IUserProgressRepository
  ) {}

  async execute({
    userId,
    courseId,
  }: GetRoadmapRequest): Promise<GetRoadmapResponse> {
    // Verificar se o curso existe
    const course = await this.courseRepository.findById(courseId);
    if (!course) {
      throw new CourseNotFoundError();
    }

    // Verificar se o usuário está inscrito
    const userCourse = await this.userCourseRepository.findByUserAndCourse(
      userId,
      courseId
    );

    // Buscar todos os módulos com grupos e aulas
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

    // Buscar todos os progressos do usuário neste curso
    const userProgresses = userCourse?.id
      ? await this.userProgressRepository.findByUserCourse(userCourse.id)
      : [];

    const progressMap = new Map<number, boolean>();
    userProgresses.forEach((progress) => {
      progressMap.set(progress.taskId, progress.isCompleted);
    });

    // Construir todas as aulas em ordem para determinar desbloqueio
    // Incluir order, moduleIndex e groupIndex para ordenação correta
    const allLessons: Array<{
      id: number;
      order: number;
      moduleIndex: number;
      groupIndex: number;
    }> = [];
    modules.forEach((module, moduleIndex) => {
      module.groups.forEach((group, groupIndex) => {
        group.lessons.forEach((lesson) => {
          allLessons.push({
            id: lesson.id,
            order: lesson.order,
            moduleIndex,
            groupIndex,
          });
        });
      });
    });

    // Ordenar todas as lições por: módulo -> grupo -> order
    allLessons.sort((a, b) => {
      if (a.moduleIndex !== b.moduleIndex) {
        return a.moduleIndex - b.moduleIndex;
      }
      if (a.groupIndex !== b.groupIndex) {
        return a.groupIndex - b.groupIndex;
      }
      return a.order - b.order;
    });

    const currentTaskId = userCourse?.currentTaskId ?? null;

    // Verificar se há progresso (lições completadas)
    const hasProgress = userProgresses.some((p) => p.isCompleted);

    // Determinar qual será a lição atual
    // Se não houver progresso, ignorar currentTaskId e usar a primeira lição
    const validCurrentTaskId =
      hasProgress &&
      currentTaskId &&
      allLessons.some((l) => l.id === currentTaskId)
        ? currentTaskId
        : allLessons[0]?.id ?? null;

    // Construir o roadmap
    const roadmapModules: RoadmapModule[] = modules.map((module) => {
      // Calcular progresso do módulo em tempo real
      const moduleLessons: Array<{ id: number }> = [];
      module.groups.forEach((group) => {
        group.lessons.forEach((lesson) => {
          moduleLessons.push({ id: lesson.id });
        });
      });

      const totalModuleLessons = moduleLessons.length;
      const completedModuleLessons = userProgresses.filter((p) => {
        return p.isCompleted && moduleLessons.some((l) => l.id === p.taskId);
      }).length;

      const moduleProgressValue =
        totalModuleLessons > 0
          ? completedModuleLessons / totalModuleLessons
          : 0;
      const moduleCompleted = completedModuleLessons === totalModuleLessons;

      const roadmapGroups: RoadmapGroup[] = module.groups.map((group) => {
        const roadmapLessons: RoadmapLesson[] = group.lessons.map((lesson) => {
          const isCompleted = progressMap.get(lesson.id) ?? false;
          const lessonIndex = allLessons.findIndex((l) => l.id === lesson.id);

          // Determinar status
          let status: "locked" | "unlocked" | "completed";
          if (isCompleted) {
            status = "completed";
          } else if (lessonIndex === 0) {
            status = "unlocked"; // Primeira aula sempre desbloqueada
          } else {
            // Verificar se a aula anterior foi concluída
            const previousLesson = allLessons[lessonIndex - 1];
            const previousCompleted =
              progressMap.get(previousLesson.id) ?? false;
            status = previousCompleted ? "unlocked" : "locked";
          }

          const isCurrent = lesson.id === validCurrentTaskId;

          // Pode revisar se a aula foi concluída
          const canReview = isCompleted;

          return {
            id: lesson.id,
            title: lesson.title,
            slug: lesson.slug,
            description: lesson.description,
            type: lesson.type,
            video_url: lesson.video_url,
            video_duration: lesson.video_duration,
            order: lesson.order,
            status,
            isCurrent,
            canReview,
          };
        });

        return {
          id: group.id,
          title: group.title,
          lessons: roadmapLessons,
        };
      });

      return {
        id: module.id,
        title: module.title,
        slug: module.slug,
        groups: roadmapGroups,
        progress: moduleProgressValue,
        isCompleted: moduleCompleted,
      };
    });

    // Calcular progresso geral do curso
    const totalLessons = allLessons.length;
    const completedLessons = userProgresses.filter((p) => p.isCompleted).length;
    const courseProgress =
      totalLessons > 0 ? completedLessons / totalLessons : 0;

    return {
      course: {
        id: course.id,
        title: course.title,
        slug: course.slug,
        progress: courseProgress,
        isCompleted: userCourse?.isCompleted ?? false,
      },
      modules: roadmapModules,
    };
  }
}
