import { FastifyInstance } from "fastify";
import { create } from "./create.controller";
import { list } from "./list.controller";
import { listRecent } from "./list-recent.controller";
import { listPopular } from "./list-popular.controller";
import { getBySlug } from "./get-by-slug.controller";
import { update } from "./update.controller";
import { remove } from "./delete.controller";
import { enroll } from "./enroll.controller";
import { getRoadmap } from "./get-roadmap.controller";
import { continueCourse } from "./continue.controller";
import { listEnrolled } from "./list-enrolled.controller";
import { verifyJWT } from "../../middlewares/verify-jwt";
import { verifyJWTOptional } from "../../middlewares/verify-jwt-optional";
import { verifyAdmin } from "../../middlewares/verify-admin";
import { verifyInstructorOrAdmin } from "../../middlewares/verify-instructor-or-admin";

export async function courseRoutes(app: FastifyInstance) {
  // Rotas públicas (com autenticação opcional para incluir isEnrolled)
  app.get("/courses", { onRequest: [verifyJWTOptional] }, list); // Suporta ?category=id&instructor=id&search=termo - isEnrolled incluído se autenticado
  app.get("/courses/recent", listRecent); // Suporta ?limit=10
  app.get("/courses/popular", listPopular); // Suporta ?limit=10
  app.get("/courses/:slug", getBySlug);

  // Rotas protegidas - apenas INSTRUCTOR ou ADMIN
  app.post("/courses", { onRequest: [verifyInstructorOrAdmin] }, create);

  // Rotas protegidas - apenas ADMIN
  app.put("/courses/:id", { onRequest: [verifyAdmin] }, update);
  app.delete("/courses/:id", { onRequest: [verifyAdmin] }, remove);

  // Rotas protegidas - requer autenticação JWT
  app.post("/courses/:id/enroll", { onRequest: [verifyJWT] }, enroll);
  app.get("/courses/:id/roadmap", { onRequest: [verifyJWT] }, getRoadmap);
  app.get("/courses/:id/continue", { onRequest: [verifyJWT] }, continueCourse);
  app.get("/courses/enrolled", { onRequest: [verifyJWT] }, listEnrolled);
}
