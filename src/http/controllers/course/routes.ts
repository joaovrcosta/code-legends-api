import { FastifyInstance } from "fastify";
import { create } from "./create.controller";
import { list } from "./list.controller";
import { listRecent } from "./list-recent.controller";
import { listPopular } from "./list-popular.controller";
import { getBySlug } from "./get-by-slug.controller";
import { update } from "./update.controller";
import { remove } from "./delete.controller";
import { verifyAdmin } from "../../middlewares/verify-admin";
import { verifyInstructorOrAdmin } from "../../middlewares/verify-instructor-or-admin";

export async function courseRoutes(app: FastifyInstance) {
  // Rotas públicas
  app.get("/courses", list); // Suporta ?category=id&instructor=id&search=termo
  app.get("/courses/recent", listRecent); // Suporta ?limit=10
  app.get("/courses/popular", listPopular); // Suporta ?limit=10
  app.get("/courses/:slug", getBySlug);

  // Rotas protegidas - apenas INSTRUCTOR ou ADMIN
  app.post("/courses", { onRequest: [verifyInstructorOrAdmin] }, create);

  // Rotas protegidas - apenas ADMIN
  app.put("/courses/:id", { onRequest: [verifyAdmin] }, update);
  app.delete("/courses/:id", { onRequest: [verifyAdmin] }, remove);
}
