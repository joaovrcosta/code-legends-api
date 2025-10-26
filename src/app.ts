import fastify from "fastify";
import { ZodError } from "zod";

import fastifyCors from "@fastify/cors";
import fastifyCookie from "@fastify/cookie";
import fastifyJwt from "@fastify/jwt";

import { usersRoutes } from "./http/controllers/account/routes";
import { courseRoutes } from "./http/controllers/course/routes";
import { categoryRoutes } from "./http/controllers/category/routes";
import { moduleRoutes } from "./http/controllers/module/routes";
import { groupRoutes } from "./http/controllers/group/routes";
import { lessonRoutes } from "./http/controllers/lesson/routes";
import { favoriteCourseRoutes } from "./http/controllers/favorite-course/routes";
import { certificateRoutes } from "./http/controllers/certificate/routes";
import { env } from "./env/index";

export const app = fastify();

app.register(fastifyCors, {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
});

app.register(fastifyCookie);

app.register(fastifyJwt, {
  secret: env.JWT_SECRET,
  cookie: {
    cookieName: "refreshToken",
    signed: false,
  },
  sign: {
    expiresIn: "10m",
  },
});

app.register(usersRoutes);
app.register(courseRoutes);
app.register(categoryRoutes);
app.register(moduleRoutes);
app.register(groupRoutes);
app.register(lessonRoutes);
app.register(favoriteCourseRoutes);
app.register(certificateRoutes);

app.setErrorHandler((error, _, reply) => {
  if (error instanceof ZodError) {
    return reply
      .status(400)
      .send({ message: "validation error", issues: error.format() });
  }

  if (env.NODE_ENV !== "production") {
    console.error(error);
  } else {
  }

  return reply.status(500).send({ message: "internal server error" });
});
