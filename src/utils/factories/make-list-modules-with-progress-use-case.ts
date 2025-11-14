import { PrismaModuleRepository } from "../../repositories/prisma/prisma-module-repository";
import { PrismaUserCourseRepository } from "../../repositories/prisma/prisma-user-course-repository";
import { PrismaUserProgressRepository } from "../../repositories/prisma/prisma-user-progress-repository";
import { ListModulesWithProgressUseCase } from "../../use-cases/entities/Module/list-with-progress";

export function makeListModulesWithProgressUseCase() {
  const moduleRepository = new PrismaModuleRepository();
  const userCourseRepository = new PrismaUserCourseRepository();
  const userProgressRepository = new PrismaUserProgressRepository();

  const listModulesWithProgressUseCase = new ListModulesWithProgressUseCase(
    moduleRepository,
    userCourseRepository,
    userProgressRepository
  );

  return listModulesWithProgressUseCase;
}

