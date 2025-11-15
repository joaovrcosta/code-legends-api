import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { makeListModulesWithProgressUseCase } from "../../../utils/factories/make-list-modules-with-progress-use-case";
import { CourseNotFoundError } from "../../../use-cases/errors/course-not-found";

export async function listWithProgress(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const listModulesParamsSchema = z.object({
    courseIdentifier: z.string(),
  });

  const { courseIdentifier } = listModulesParamsSchema.parse(request.params);

  const isUUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      courseIdentifier
    );

  const courseId = isUUID ? courseIdentifier : undefined;
  const slug = isUUID ? undefined : courseIdentifier;

  try {
    const listModulesWithProgressUseCase = makeListModulesWithProgressUseCase();

    const { modules } = await listModulesWithProgressUseCase.execute({
      userId: request.user.id,
      courseId,
      slug,
    });

    return reply.status(200).send({ modules });
  } catch (error) {
    if (error instanceof CourseNotFoundError) {
      return reply.status(404).send({ message: error.message });
    }

    if (
      error instanceof Error &&
      error.message === "User is not enrolled in this course"
    ) {
      return reply.status(403).send({ message: error.message });
    }

    // Log do erro para debug
    console.error("Erro ao listar módulos com progresso:", error);
    
    return reply.status(500).send({ 
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
