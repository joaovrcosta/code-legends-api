import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { makeGetCertificateByIdUseCase } from "../../../utils/factories/make-get-certificate-by-id-use-case";
import { CertificateNotFoundError } from "../../../use-cases/errors/certificate-not-found";

export async function verifyCertificate(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const verifyCertificateParamsSchema = z.object({
    id: z.string(),
  });

  const { id } = verifyCertificateParamsSchema.parse(request.params);

  // Log de auditoria - registrar tentativa de verificação
  const clientIp =
    request.ip || request.headers["x-forwarded-for"] || "unknown";
  const timestamp = new Date().toISOString();

  try {
    const getCertificateByIdUseCase = makeGetCertificateByIdUseCase();

    const { certificate } = await getCertificateByIdUseCase.execute({
      certificateId: id,
    });

    // Retornar informações relevantes para verificação pública
    // SEM expor email por questões de privacidade (LGPD/GDPR)
    // O certificado retornado pelo repositório inclui as relações user, course e template
    const cert = certificate as any;

    return reply.status(200).send({
      certificate: {
        id: cert.id,
        createdAt: cert.createdAt,
        user: {
          name: cert.user?.name,
          // Email removido por questões de privacidade e segurança
        },
        course: {
          id: cert.course?.id,
          title: cert.course?.title,
          slug: cert.course?.slug,
          instructor: {
            name: cert.course?.instructor?.name,
          },
        },
        template: cert.template,
      },
      verified: true, // Indica que o certificado foi encontrado e é válido
    });
  } catch (error) {
    // Log de falha (certificado não encontrado)
    if (error instanceof CertificateNotFoundError) {
      console.log(
        `[CERTIFICATE_VERIFY_FAILED] IP: ${clientIp}, CertificateID: ${id}, Reason: NOT_FOUND, Time: ${timestamp}`
      );
      return reply.status(404).send({
        verified: false,
        message: "Certificado não encontrado ou inválido",
      });
    }

    // Log de erro interno
    console.error(
      `[CERTIFICATE_VERIFY_ERROR] IP: ${clientIp}, CertificateID: ${id}, Error: ${
        error instanceof Error ? error.message : "Unknown"
      }, Time: ${timestamp}`
    );

    return reply.status(500).send({
      verified: false,
      message: "Erro ao verificar certificado",
    });
  }
}
