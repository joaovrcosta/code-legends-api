import { PrismaUserCourseRepository } from "../../repositories/prisma/prisma-user-course-repository";
import { PrismaModuleRepository } from "../../repositories/prisma/prisma-module-repository";
import { PrismaCourseRepository } from "../../repositories/prisma/prisma-course-repository";
import { UpdateCurrentModuleUseCase } from "../../use-cases/entities/Module/update-current";

export function makeUpdateCurrentModuleUseCase() {
  const userCourseRepository = new PrismaUserCourseRepository();
  const moduleRepository = new PrismaModuleRepository();
  const courseRepository = new PrismaCourseRepository();

  const updateCurrentModuleUseCase = new UpdateCurrentModuleUseCase(
    userCourseRepository,
    moduleRepository,
    courseRepository
  );

  return updateCurrentModuleUseCase;
}

