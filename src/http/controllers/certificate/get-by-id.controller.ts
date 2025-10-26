import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { makeGetCertificateByIdUseCase } from "../../../utils/factories/make-get-certificate-by-id-use-case";
import { CertificateNotFoundError } from "../../../use-cases/errors/certificate-not-found";

export async function getCertificateById(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const getCertificateParamsSchema = z.object({
    id: z.string(),
  });

  const { id } = getCertificateParamsSchema.parse(request.params);

  try {
    const getCertificateByIdUseCase = makeGetCertificateByIdUseCase();

    const { certificate } = await getCertificateByIdUseCase.execute({
      certificateId: id,
    });

    return reply.status(200).send({
      certificate,
    });
  } catch (error) {
    if (error instanceof CertificateNotFoundError) {
      return reply.status(404).send({ message: error.message });
    }

    return reply.status(500).send({ message: "Internal server error" });
  }
}
