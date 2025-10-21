import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { makeAuthenticateUseCase } from "../../../utils/factories/make-authenticate-user-use-case";
import { InvalidCredentialsError } from "../../../use-cases/errors/invalidCredentials";

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const authenticateUserBodySchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
  });

  const { email, password } = authenticateUserBodySchema.parse(request.body);

  try {
    const authenticateUseCase = makeAuthenticateUseCase();

    const { user } = await authenticateUseCase.execute({ email, password });

    const token = await reply.jwtSign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      {
        expiresIn: "10m",
      }
    );

    const refreshToken = await reply.jwtSign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      {
        expiresIn: "7d",
      }
    );

    return reply
      .setCookie("refreshToken", refreshToken, {
        path: "/",
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
      })
      .status(200)
      .send({
        token,
      });
  } catch (err) {
    if (err instanceof InvalidCredentialsError) {
      return reply.status(400).send({ message: err.message });
    }

    throw err;
  }
}
