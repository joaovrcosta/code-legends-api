import { PrismaCourseRepository } from "../../repositories/prisma/prisma-course-repository";
import { ListCoursesUseCase } from "../../use-cases/entities/Course/list";

export function makeListCoursesUseCase() {
  const courseRepository = new PrismaCourseRepository();
  const listCoursesUseCase = new ListCoursesUseCase(courseRepository);

  return listCoursesUseCase;
}
