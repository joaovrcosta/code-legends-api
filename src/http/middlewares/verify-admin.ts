import { FastifyReply, FastifyRequest } from "fastify";

export async function verifyAdmin(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // Primeiro verifica se está autenticado
    await request.jwtVerify();

    // Verifica se o usuário tem role ADMIN
    const userRole = request.user.role;

    if (userRole !== "ADMIN") {
      return reply.status(403).send({
        message: "Forbidden - Admin access required",
      });
    }
  } catch (err) {
    return reply.status(401).send({ message: "Unauthorized" });
  }
}
