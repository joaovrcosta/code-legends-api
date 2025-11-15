import { IModuleRepository } from "../../../repositories/module-repository";
import { IUserCourseRepository } from "../../../repositories/user-course-repository";
import { IUserProgressRepository } from "../../../repositories/user-progress-repository";
import { ICourseRepository } from "../../../repositories/course-repository";
import { prisma } from "../../../lib/prisma";
import { CourseNotFoundError } from "../../errors/course-not-found";

interface ModuleWithProgress {
  id: string;
  title: string;
  slug: string;
  courseId: string;
  progress: number; // Porcentagem de completamento (0-100)
  isCurrent: boolean; // Se é o módulo atual do aluno
  totalLessons: number; // Quantidade total de lessons no módulo
  completedLessons: number; // Quantidade de lessons completadas pelo aluno
  locked: boolean; // Se o módulo está bloqueado
}

interface ListModulesWithProgressRequest {
  userId: string;
  courseId?: string;
  slug?: string;
}

interface ListModulesWithProgressResponse {
  modules: ModuleWithProgress[];
}

export class ListModulesWithProgressUseCase {
  constructor(
    private moduleRepository: IModuleRepository,
    private userCourseRepository: IUserCourseRepository,
    private userProgressRepository: IUserProgressRepository,
    private courseRepository: ICourseRepository
  ) {}

  async execute({
    userId,
    courseId,
    slug,
  }: ListModulesWithProgressRequest): Promise<ListModulesWithProgressResponse> {
    // Se slug foi fornecido, buscar o curso pelo slug
    let finalCourseId = courseId;
    
    if (slug && !courseId) {
      const course = await this.courseRepository.findBySlug(slug);
      
      if (!course) {
        throw new CourseNotFoundError();
      }
      
      finalCourseId = course.id;
    } else if (!courseId) {
      throw new CourseNotFoundError();
    } else {
      // Se courseId foi fornecido, verificar se o curso existe
      const course = await prisma.course.findUnique({
        where: { id: finalCourseId },
      });

      if (!course) {
        throw new CourseNotFoundError();
      }
    }

    // Verificar se o usuário está inscrito no curso
    const userCourse = await this.userCourseRepository.findByUserAndCourse(
      userId,
      finalCourseId
    );

    if (!userCourse) {
      throw new Error("User is not enrolled in this course");
    }

    // Buscar todos os módulos do curso com seus groups e lessons
    const modules = await prisma.module.findMany({
      where: { courseId: finalCourseId },
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

    // Verificar se há progresso no curso (alguma lesson completada)
    const totalCompletedLessonsInCourse = await prisma.userProgress.count({
      where: {
        userId,
        userCourseId: userCourse.id,
        isCompleted: true,
        task: {
          submodule: {
            module: {
              courseId: finalCourseId,
            },
          },
        },
      },
    });

    const hasProgress = totalCompletedLessonsInCourse > 0;

    // Encontrar o índice do módulo atual
    const currentModuleIndex = userCourse.currentModuleId
      ? modules.findIndex((m) => m.id === userCourse.currentModuleId)
      : -1;

    // Processar cada módulo e calcular progresso em tempo real
    const modulesWithProgress: ModuleWithProgress[] = await Promise.all(
      modules.map(async (module, index) => {
        // Contar total de lessons no módulo
        const totalLessons = module.groups.reduce(
          (acc, group) => acc + group.lessons.length,
          0
        );

        // Contar lessons completadas pelo aluno neste módulo
        const completedLessons =
          await this.userProgressRepository.countCompletedInModule(
            userId,
            module.id
          );

        // Calcular porcentagem de completamento
        const progress =
          totalLessons > 0
            ? Math.round((completedLessons / totalLessons) * 100)
            : 0;

        // Verificar se é o módulo atual
        const isCurrent = userCourse.currentModuleId === module.id;

        // Determinar se o módulo está bloqueado
        let locked = false;

        // Se não há progresso no curso, apenas o primeiro módulo está desbloqueado
        if (!hasProgress) {
          locked = index > 0;
        } else if (currentModuleIndex === -1) {
          // Se não há módulo atual definido, apenas o primeiro está desbloqueado
          locked = index > 0;
        } else if (index < currentModuleIndex) {
          // Módulos anteriores ao atual: desbloqueados se estiverem 100% completos (para revisão)
          const isCompleted = progress === 100;
          locked = !isCompleted;
        } else if (index === currentModuleIndex) {
          // O módulo atual nunca está bloqueado
          locked = false;
        } else {
          // Módulos depois do atual: sempre bloqueados até que sejam desbloqueados manualmente
          // O próximo módulo só fica desbloqueado quando o usuário usar o botão "Desbloquear próximo módulo"
          // que atualiza o currentModuleId para o próximo módulo
          locked = true;
        }

        return {
          id: module.id,
          title: module.title,
          slug: module.slug,
          courseId: module.courseId,
          progress,
          isCurrent,
          totalLessons,
          completedLessons,
          locked,
        };
      })
    );

    return {
      modules: modulesWithProgress,
    };
  }
}
