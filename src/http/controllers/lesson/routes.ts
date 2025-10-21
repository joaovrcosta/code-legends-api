import { FastifyInstance } from "fastify";
import { create } from "./create.controller";
import { list } from "./list.controller";
import { getBySlug } from "./get-by-slug.controller";
import { update } from "./update.controller";
import { remove } from "./delete.controller";
import { verifyAdmin } from "../../middlewares/verify-admin";
import { verifyInstructorOrAdmin } from "../../middlewares/verify-instructor-or-admin";

export async function lessonRoutes(app: FastifyInstance) {
  // Rotas aninhadas em groups
  app.get("/groups/:groupId/lessons", list);
  app.post(
    "/groups/:groupId/lessons",
    { onRequest: [verifyInstructorOrAdmin] },
    create
  );

  // Rotas públicas de lições
  app.get("/lessons/:slug", getBySlug);

  // Rotas protegidas - apenas ADMIN
  app.put("/lessons/:id", { onRequest: [verifyAdmin] }, update);
  app.delete("/lessons/:id", { onRequest: [verifyAdmin] }, remove);
}
