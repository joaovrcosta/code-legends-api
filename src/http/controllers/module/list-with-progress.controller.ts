import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { makeListModulesWithProgressUseCase } from "../../../utils/factories/make-list-modules-with-progress-use-case";
import { CourseNotFoundError } from "../../../use-cases/errors/course-not-found";

export async function listWithProgress(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const listModulesParamsSchema = z.object({
    courseId: z.string(),
  });

  const { courseId } = listModulesParamsSchema.parse(request.params);

  try {
    const listModulesWithProgressUseCase = makeListModulesWithProgressUseCase();

    const { modules } = await listModulesWithProgressUseCase.execute({
      userId: request.user.id,
      courseId,
    });

    return reply.status(200).send({ modules });
  } catch (error) {
    if (error instanceof CourseNotFoundError) {
      return reply.status(404).send({ message: error.message });
    }

    if (error instanceof Error && error.message === "User is not enrolled in this course") {
      return reply.status(403).send({ message: error.message });
    }

    return reply.status(500).send({ message: "Internal server error" });
  }
}

