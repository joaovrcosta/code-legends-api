import { FastifyInstance } from "fastify";
import { createCertificate } from "./create.controller";
import { listCertificates } from "./list.controller";
import { getCertificateById } from "./get-by-id.controller";
import { deleteCertificate } from "./delete.controller";
import { verifyJWT } from "../../middlewares/verify-jwt";
import { verifyInstructorOrAdmin } from "../../middlewares/verify-instructor-or-admin";

export async function certificateRoutes(app: FastifyInstance) {
  // Todas as rotas de certificados precisam de autenticação
  app.addHook("onRequest", verifyJWT);

  // Listar certificados do usuário autenticado
  app.get("/certificates", listCertificates);

  // Buscar certificado por ID
  app.get("/certificates/:id", getCertificateById);

  // Criar certificado (apenas instrutores e admins)
  app.post("/certificates", {
    onRequest: [verifyInstructorOrAdmin],
    handler: createCertificate,
  });

  // Deletar certificado (apenas instrutores e admins)
  app.delete("/certificates/:id", {
    onRequest: [verifyInstructorOrAdmin],
    handler: deleteCertificate,
  });
}
