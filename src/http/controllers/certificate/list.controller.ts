import { FastifyReply, FastifyRequest } from "fastify";
import { makeListCertificatesUseCase } from "../../../utils/factories/make-list-certificates-use-case";

export async function listCertificates(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const listCertificatesUseCase = makeListCertificatesUseCase();

    const { certificates } = await listCertificatesUseCase.execute({
      userId: request.user.id,
    });

    return reply.status(200).send({
      certificates,
    });
  } catch (error) {
    return reply.status(500).send({ message: "Internal server error" });
  }
}
