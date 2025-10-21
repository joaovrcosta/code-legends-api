import { Course } from "@prisma/client";
import { ICourseRepository } from "../../../repositories/course-repository";

interface ListCoursesRequest {
  categoryId?: string;
  instructorId?: string;
  search?: string;
}

interface ListCoursesResponse {
  courses: Course[];
}

export class ListCoursesUseCase {
  constructor(private courseRepository: ICourseRepository) {}

  async execute(filters?: ListCoursesRequest): Promise<ListCoursesResponse> {
    const courses = await this.courseRepository.findAll(filters);

    return {
      courses,
    };
  }
}
