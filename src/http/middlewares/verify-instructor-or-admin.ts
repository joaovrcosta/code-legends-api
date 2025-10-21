import { FastifyReply, FastifyRequest } from "fastify";

export async function verifyInstructorOrAdmin(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // Primeiro verifica se está autenticado
    await request.jwtVerify();

    // Verifica se o usuário tem role INSTRUCTOR ou ADMIN
    const userRole = request.user.role;

    if (userRole !== "INSTRUCTOR" && userRole !== "ADMIN") {
      return reply.status(403).send({
        message: "Forbidden - Instructor or Admin access required",
      });
    }
  } catch (err) {
    return reply.status(401).send({ message: "Unauthorized" });
  }
}
