import { PrismaModuleRepository } from "../../repositories/prisma/prisma-module-repository";
import { PrismaUserCourseRepository } from "../../repositories/prisma/prisma-user-course-repository";
import { PrismaUserProgressRepository } from "../../repositories/prisma/prisma-user-progress-repository";
import { PrismaCourseRepository } from "../../repositories/prisma/prisma-course-repository";
import { ListModulesWithProgressUseCase } from "../../use-cases/entities/Module/list-with-progress";

export function makeListModulesWithProgressUseCase() {
  const moduleRepository = new PrismaModuleRepository();
  const userCourseRepository = new PrismaUserCourseRepository();
  const userProgressRepository = new PrismaUserProgressRepository();
  const courseRepository = new PrismaCourseRepository();

  const listModulesWithProgressUseCase = new ListModulesWithProgressUseCase(
    moduleRepository,
    userCourseRepository,
    userProgressRepository,
    courseRepository
  );

  return listModulesWithProgressUseCase;
}

