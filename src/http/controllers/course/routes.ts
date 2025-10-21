import { FastifyInstance } from "fastify";
import { create } from "./create.controller";
import { verifyJWT } from "../../middlewares/verify-jwt";

export async function courseRoutes(app: FastifyInstance) {
  // Rotas autenticadas
  app.post("/courses", { onRequest: [verifyJWT] }, create);
}
