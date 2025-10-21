import { PrismaCourseRepository } from "../../repositories/prisma/prisma-course-repository";
import { PrismaUsersRepository } from "../../repositories/prisma/prisma-users-reposity";
import { CreateCourseUseCase } from "../../use-cases/entities/Course/create";

export function makeCreateCourseUseCase() {
  const courseRepository = new PrismaCourseRepository();
  const usersRepository = new PrismaUsersRepository();
  const createCourseUseCase = new CreateCourseUseCase(
    courseRepository,
    usersRepository
  );

  return createCourseUseCase;
}
