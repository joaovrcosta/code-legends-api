import { Course } from "@prisma/client";
import { ICourseRepository } from "../../../repositories/course-repository";

interface ListCoursesResponse {
  courses: Course[];
}

export class ListCoursesUseCase {
  constructor(private courseRepository: ICourseRepository) {}

  async execute(): Promise<ListCoursesResponse> {
    const courses = await this.courseRepository.findAll();

    return {
      courses,
    };
  }
}
