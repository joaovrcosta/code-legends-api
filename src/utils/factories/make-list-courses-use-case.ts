import { PrismaCourseRepository } from "../../repositories/prisma/prisma-course-repository";
import { PrismaUserCourseRepository } from "../../repositories/prisma/prisma-user-course-repository";
import { ListCoursesUseCase } from "../../use-cases/entities/Course/list";

export function makeListCoursesUseCase() {
  const courseRepository = new PrismaCourseRepository();
  const userCourseRepository = new PrismaUserCourseRepository();
  const listCoursesUseCase = new ListCoursesUseCase(
    courseRepository,
    userCourseRepository
  );

  return listCoursesUseCase;
}
