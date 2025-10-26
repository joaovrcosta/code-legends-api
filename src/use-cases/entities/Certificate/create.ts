import { Certificate } from "@prisma/client";
import { CertificateRepository } from "../../../repositories/certificate-repository";
import { IUsersRepository } from "../../../repositories/users-repository";
import { ICourseRepository } from "../../../repositories/course-repository";
import { CertificateAlreadyExistsError } from "../../errors/certificate-already-exists";
import { UserNotFoundError } from "../../errors/user-not-found";
import { CourseNotFoundError } from "../../errors/course-not-found";

interface CreateCertificateUseCaseRequest {
  userId: string;
  courseId: string;
  templateId?: string;
}

interface CreateCertificateUseCaseResponse {
  certificate: Certificate;
}

export class CreateCertificateUseCase {
  constructor(
    private certificateRepository: CertificateRepository,
    private usersRepository: IUsersRepository,
    private courseRepository: ICourseRepository
  ) {}

  async execute({
    userId,
    courseId,
    templateId,
  }: CreateCertificateUseCaseRequest): Promise<CreateCertificateUseCaseResponse> {
    // Verificar se o usuário existe
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError();
    }

    // Verificar se o curso existe
    const course = await this.courseRepository.findById(courseId);
    if (!course) {
      throw new CourseNotFoundError();
    }

    // Verificar se já existe um certificado para esse usuário e curso
    const existingCertificate =
      await this.certificateRepository.findByUserIdAndCourseId(
        userId,
        courseId
      );

    if (existingCertificate) {
      throw new CertificateAlreadyExistsError();
    }

    // Criar o certificado
    const certificate = await this.certificateRepository.create({
      user: {
        connect: { id: userId },
      },
      course: {
        connect: { id: courseId },
      },
      ...(templateId && {
        template: {
          connect: { id: templateId },
        },
      }),
    });

    return {
      certificate,
    };
  }
}
