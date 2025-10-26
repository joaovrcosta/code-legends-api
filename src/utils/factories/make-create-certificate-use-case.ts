import { PrismaCertificateRepository } from "../../repositories/prisma/prisma-certificate-repository";
import { PrismaUsersRepository } from "../../repositories/prisma/prisma-users-reposity";
import { PrismaCourseRepository } from "../../repositories/prisma/prisma-course-repository";
import { CreateCertificateUseCase } from "../../use-cases/entities/Certificate/create";

export function makeCreateCertificateUseCase() {
  const certificateRepository = new PrismaCertificateRepository();
  const usersRepository = new PrismaUsersRepository();
  const courseRepository = new PrismaCourseRepository();

  const createCertificateUseCase = new CreateCertificateUseCase(
    certificateRepository,
    usersRepository,
    courseRepository
  );

  return createCertificateUseCase;
}
