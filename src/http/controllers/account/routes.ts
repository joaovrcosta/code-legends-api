import { FastifyInstance } from "fastify";
import { create } from "./create.controller";
import { authenticate } from "./authenticate.controller";
import { profile } from "./profile.controller";
import { refreshToken } from "./refresh-token.controller";
import { verifyJWT } from "../../middlewares/verify-jwt";

export async function usersRoutes(app: FastifyInstance) {
  app.post("/users", create);
  app.post("/users/auth", authenticate);
  app.post("/token/refresh", refreshToken);

  // Rotas autenticadas
  app.get("/me", { onRequest: [verifyJWT] }, profile);
}
