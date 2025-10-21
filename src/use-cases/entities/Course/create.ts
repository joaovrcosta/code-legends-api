import { Course } from "@prisma/client";
import { ICourseRepository } from "../../../repositories/course-repository";
import { IUsersRepository } from "../../../repositories/users-repository";
import { CourseAlreadyExistsError } from "../../errors/course-already-exists";
import { InstructorNotFoundError } from "../../errors/instructor-not-found";

interface CreateCourseRequest {
  title: string;
  slug: string;
  description: string;
  level: string;
  instructorId: string;
  thumbnail?: string | null;
  icon?: string | null;
  tags?: string[];
  isFree?: boolean;
  active?: boolean;
  releaseAt?: Date | null;
}

interface CreateCourseResponse {
  course: Course;
}

export class CreateCourseUseCase {
  constructor(
    private courseRepository: ICourseRepository,
    private usersRepository: IUsersRepository
  ) {}

  async execute(data: CreateCourseRequest): Promise<CreateCourseResponse> {
    // Verificar se o curso já existe
    const courseWithSameSlug = await this.courseRepository.findBySlug(
      data.slug
    );

    if (courseWithSameSlug) {
      throw new CourseAlreadyExistsError();
    }

    // Verificar se o instrutor existe
    const instructor = await this.usersRepository.findById(data.instructorId);

    if (!instructor) {
      throw new InstructorNotFoundError();
    }

    // Validar se o usuário tem role de INSTRUCTOR ou ADMIN
    if (instructor.role !== "INSTRUCTOR" && instructor.role !== "ADMIN") {
      throw new Error("User is not an instructor");
    }

    const course = await this.courseRepository.create(data);

    return {
      course,
    };
  }
}
