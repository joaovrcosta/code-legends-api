import { ICourseRepository } from "../../../repositories/course-repository";
import { IUserCourseRepository } from "../../../repositories/user-course-repository";
import { ILessonRepository } from "../../../repositories/lesson-repository";
import { IUsersRepository } from "../../../repositories/users-repository";
import { CourseNotFoundError } from "../../errors/course-not-found";
import { prisma } from "../../../lib/prisma";

interface ContinueCourseRequest {
  userId: string;
  courseId?: string; // Opcional: se não fornecido, busca o curso ativo
}

interface ContinueCourseResponse {
  lesson: {
    id: number;
    title: string;
    slug: string;
    description: string;
    type: string;
    video_url: string | null;
    video_duration: string | null;
    order: number;
  } | null;
  module: {
    id: string;
    title: string;
    slug: string;
  } | null;
  course: {
    id: string;
    title: string;
    slug: string;
    progress: number;
    isCompleted: boolean;
  };
}

export class ContinueCourseUseCase {
  constructor(
    private courseRepository: ICourseRepository,
    private userCourseRepository: IUserCourseRepository,
    private lessonRepository: ILessonRepository,
    private usersRepository: IUsersRepository
  ) {}

  async execute({
    userId,
    courseId,
  }: ContinueCourseRequest): Promise<ContinueCourseResponse> {
    // Se courseId não for fornecido, buscar o curso ativo do usuário
    let activeCourseId = courseId;

    if (!activeCourseId) {
      const user = await this.usersRepository.findById(userId);
      activeCourseId = user?.activeCourseId ?? null;

      if (!activeCourseId) {
        // Se não tem curso ativo e não foi fornecido courseId, retornar null
        return {
          lesson: null,
          module: null,
          course: {
            id: "",
            title: "",
            slug: "",
            progress: 0,
            isCompleted: false,
          },
        };
      }
    }

    // Verificar se o curso existe
    const course = await this.courseRepository.findById(activeCourseId);
    if (!course) {
      throw new CourseNotFoundError();
    }

    // Buscar inscrição do usuário
    const userCourse = await this.userCourseRepository.findByUserAndCourse(
      userId,
      activeCourseId
    );

    if (!userCourse) {
      // Se não está inscrito, retornar null para a aula
      return {
        lesson: null,
        module: null,
        course: {
          id: course.id,
          title: course.title,
          slug: course.slug,
          progress: 0,
          isCompleted: false,
        },
      };
    }

    // Se o curso está concluído, retornar null
    if (userCourse.isCompleted) {
      return {
        lesson: null,
        module: null,
        course: {
          id: course.id,
          title: course.title,
          slug: course.slug,
          progress: userCourse.progress,
          isCompleted: true,
        },
      };
    }

    // Buscar a aula atual
    let lesson = null;
    let module = null;

    if (userCourse.currentTaskId) {
      const foundLesson = await this.lessonRepository.findById(
        userCourse.currentTaskId
      );

      if (foundLesson) {
        lesson = {
          id: foundLesson.id,
          title: foundLesson.title,
          slug: foundLesson.slug,
          description: foundLesson.description,
          type: foundLesson.type,
          video_url: foundLesson.video_url,
          video_duration: foundLesson.video_duration,
          order: foundLesson.order,
        };

        // Buscar o módulo
        if (userCourse.currentModuleId) {
          const foundModule = await prisma.module.findUnique({
            where: { id: userCourse.currentModuleId },
            select: {
              id: true,
              title: true,
              slug: true,
            },
          });

          if (foundModule) {
            module = foundModule;
          }
        }
      }
    }

    return {
      lesson,
      module,
      course: {
        id: course.id,
        title: course.title,
        slug: course.slug,
        progress: userCourse.progress,
        isCompleted: userCourse.isCompleted,
      },
    };
  }
}
