import { Course } from "@prisma/client";
import { ICourseRepository } from "../../../repositories/course-repository";
import { IUserCourseRepository } from "../../../repositories/user-course-repository";

interface ListCoursesRequest {
  categoryId?: string;
  instructorId?: string;
  search?: string;
  userId?: string; // Opcional: para verificar se está inscrito
}

interface CourseWithEnrollment extends Course {
  isEnrolled: boolean;
}

interface ListCoursesResponse {
  courses: CourseWithEnrollment[];
}

export class ListCoursesUseCase {
  constructor(
    private courseRepository: ICourseRepository,
    private userCourseRepository: IUserCourseRepository
  ) {}

  async execute(filters?: ListCoursesRequest): Promise<ListCoursesResponse> {
    // Buscar cursos (1 query)
    const courses = await this.courseRepository.findAll({
      categoryId: filters?.categoryId,
      instructorId: filters?.instructorId,
      search: filters?.search,
    });

    // Se houver userId, verificar inscrições de uma vez (1 query adicional)
    let enrolledCourseIds = new Set<string>();
    if (filters?.userId) {
      const userCourses = await this.userCourseRepository.findByUserId(
        filters.userId
      );
      enrolledCourseIds = new Set(userCourses.map((uc) => uc.courseId));
    }

    // Mapear isEnrolled (operação em memória - O(1) por curso)
    const coursesWithEnrollment: CourseWithEnrollment[] = courses.map(
      (course) => ({
        ...course,
        isEnrolled: enrolledCourseIds.has(course.id),
      })
    );

    return {
      courses: coursesWithEnrollment,
    };
  }
}
