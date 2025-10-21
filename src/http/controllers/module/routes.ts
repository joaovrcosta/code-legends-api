import { FastifyInstance } from "fastify";
import { create } from "./create.controller";
import { list } from "./list.controller";
import { getBySlug } from "./get-by-slug.controller";
import { update } from "./update.controller";
import { remove } from "./delete.controller";
import { verifyAdmin } from "../../middlewares/verify-admin";
import { verifyInstructorOrAdmin } from "../../middlewares/verify-instructor-or-admin";

export async function moduleRoutes(app: FastifyInstance) {
  // Rotas aninhadas em courses
  app.get("/courses/:courseId/modules", list);
  app.post(
    "/courses/:courseId/modules",
    { onRequest: [verifyInstructorOrAdmin] },
    create
  );

  // Rotas públicas de módulos
  app.get("/modules/:slug", getBySlug);

  // Rotas protegidas - apenas ADMIN
  app.put("/modules/:id", { onRequest: [verifyAdmin] }, update);
  app.delete("/modules/:id", { onRequest: [verifyAdmin] }, remove);
}
