import { PrismaUserCourseRepository } from "../../repositories/prisma/prisma-user-course-repository";
import { PrismaUsersRepository } from "../../repositories/prisma/prisma-users-reposity";
import { PrismaUserProgressRepository } from "../../repositories/prisma/prisma-user-progress-repository";
import { ListCompletedCoursesUseCase } from "../../use-cases/entities/Course/list-completed";

export function makeListCompletedCoursesUseCase() {
  const userCourseRepository = new PrismaUserCourseRepository();
  const usersRepository = new PrismaUsersRepository();
  const userProgressRepository = new PrismaUserProgressRepository();

  const listCompletedCoursesUseCase = new ListCompletedCoursesUseCase(
    userCourseRepository,
    usersRepository,
    userProgressRepository
  );

  return listCompletedCoursesUseCase;
}

