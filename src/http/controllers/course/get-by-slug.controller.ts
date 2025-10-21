import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { makeGetCourseBySlugUseCase } from "../../../utils/factories/make-get-course-by-slug-use-case";
import { CourseNotFoundError } from "../../../use-cases/errors/course-not-found";

export async function getBySlug(request: FastifyRequest, reply: FastifyReply) {
  const getCourseBySlugParamsSchema = z.object({
    slug: z.string(),
  });

  const { slug } = getCourseBySlugParamsSchema.parse(request.params);

  try {
    const getCourseBySlugUseCase = makeGetCourseBySlugUseCase();

    const { course } = await getCourseBySlugUseCase.execute({ slug });

    return reply.status(200).send({ course });
  } catch (error) {
    if (error instanceof CourseNotFoundError) {
      return reply.status(404).send({ message: error.message });
    }

    return reply.status(500).send({ message: "Internal server error" });
  }
}
