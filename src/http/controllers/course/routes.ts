import { FastifyInstance } from "fastify";
import { create } from "./create.controller";
import { list } from "./list.controller";
import { getBySlug } from "./get-by-slug.controller";
import { update } from "./update.controller";
import { remove } from "./delete.controller";
import { verifyJWT } from "../../middlewares/verify-jwt";
import { verifyAdmin } from "../../middlewares/verify-admin";

export async function courseRoutes(app: FastifyInstance) {
  // Rotas públicas
  app.get("/courses", list);
  app.get("/courses/:slug", getBySlug);

  // Rotas autenticadas
  app.post("/courses", { onRequest: [verifyJWT] }, create);

  // Rotas protegidas - apenas ADMIN
  app.put("/courses/:id", { onRequest: [verifyAdmin] }, update);
  app.delete("/courses/:id", { onRequest: [verifyAdmin] }, remove);
}
