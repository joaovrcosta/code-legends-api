import { PrismaCourseRepository } from "../../repositories/prisma/prisma-course-repository";
import { PrismaUserCourseRepository } from "../../repositories/prisma/prisma-user-course-repository";
import { PrismaLessonRepository } from "../../repositories/prisma/prisma-lesson-repository";
import { ContinueCourseUseCase } from "../../use-cases/entities/Course/continue";

export function makeContinueCourseUseCase() {
  const courseRepository = new PrismaCourseRepository();
  const userCourseRepository = new PrismaUserCourseRepository();
  const lessonRepository = new PrismaLessonRepository();
  const continueCourseUseCase = new ContinueCourseUseCase(
    courseRepository,
    userCourseRepository,
    lessonRepository
  );

  return continueCourseUseCase;
}
