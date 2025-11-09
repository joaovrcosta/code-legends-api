import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { makeSearchCoursesByNameUseCase } from "../../../utils/factories/make-search-courses-by-name-use-case";

export async function search(request: FastifyRequest, reply: FastifyReply) {
  const searchCoursesQuerySchema = z.object({
    q: z.string().min(1, "O termo de busca é obrigatório"),
  });

  const { q } = searchCoursesQuerySchema.parse(request.query);

  try {
    const searchCoursesByNameUseCase = makeSearchCoursesByNameUseCase();

    // Incluir userId se o usuário estiver autenticado
    const userId = request.user?.id;

    const { courses } = await searchCoursesByNameUseCase.execute({
      name: q,
      userId,
    });

    return reply.status(200).send({ courses });
  } catch (error) {
    return reply.status(500).send({ message: "Internal server error" });
  }
}

