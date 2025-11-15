import { PrismaUserCourseRepository } from "../../repositories/prisma/prisma-user-course-repository";
import { PrismaCourseRepository } from "../../repositories/prisma/prisma-course-repository";
import { PrismaUserProgressRepository } from "../../repositories/prisma/prisma-user-progress-repository";
import { UnlockNextModuleUseCase } from "../../use-cases/entities/Module/unlock-next-module";

export function makeUnlockNextModuleUseCase() {
  const userCourseRepository = new PrismaUserCourseRepository();
  const courseRepository = new PrismaCourseRepository();
  const userProgressRepository = new PrismaUserProgressRepository();

  const unlockNextModuleUseCase = new UnlockNextModuleUseCase(
    userCourseRepository,
    courseRepository,
    userProgressRepository
  );

  return unlockNextModuleUseCase;
}

