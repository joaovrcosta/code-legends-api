import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { LessonNotFoundError } from "../../../use-cases/errors/lesson-not-found";
import { makeCompleteLessonUseCase } from "../../../utils/factories/make-complete-lesson-use-case";

export async function complete(request: FastifyRequest, reply: FastifyReply) {
  const completeLessonParamsSchema = z.object({
    id: z.string().transform(Number),
  });

  const completeLessonBodySchema = z.object({
    score: z.number().optional(),
  });

  const { id } = completeLessonParamsSchema.parse(request.params);
  const { score } = completeLessonBodySchema.parse(request.body || {});

  try {
    const completeLessonUseCase = makeCompleteLessonUseCase();

    const result = await completeLessonUseCase.execute({
      userId: request.user.id,
      lessonId: id,
      score,
    });

    return reply.status(200).send(result);
  } catch (error) {
    if (error instanceof LessonNotFoundError) {
      return reply.status(404).send({ message: error.message });
    }

    if (
      error instanceof Error &&
      error.message === "User is not enrolled in this course"
    ) {
      return reply.status(403).send({ message: error.message });
    }

    return reply.status(500).send({ message: "Internal server error" });
  }
}
