import { FastifyReply, FastifyRequest } from "fastify";
import { makeListCoursesUseCase } from "../../../utils/factories/make-list-courses-use-case";

export async function list(request: FastifyRequest, reply: FastifyReply) {
  try {
    const listCoursesUseCase = makeListCoursesUseCase();

    const { courses } = await listCoursesUseCase.execute();

    return reply.status(200).send({ courses });
  } catch (error) {
    return reply.status(500).send({ message: "Internal server error" });
  }
}
