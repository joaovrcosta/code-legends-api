import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { makeContinueCourseUseCase } from "../../../utils/factories/make-continue-course-use-case";
import { CourseNotFoundError } from "../../../use-cases/errors/course-not-found";

export async function continueCourse(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const continueCourseParamsSchema = z.object({
    id: z.string(),
  });

  const { id } = continueCourseParamsSchema.parse(request.params);

  try {
    const continueCourseUseCase = makeContinueCourseUseCase();

    const result = await continueCourseUseCase.execute({
      userId: request.user.id,
      courseId: id,
    });

    return reply.status(200).send(result);
  } catch (error) {
    if (error instanceof CourseNotFoundError) {
      return reply.status(404).send({ message: error.message });
    }

    return reply.status(500).send({ message: "Internal server error" });
  }
}
