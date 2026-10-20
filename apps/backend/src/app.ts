import { FastifyError, FastifyInstance, FastifyPluginOptions } from "fastify";
import { userRoutes } from "./routes/user";
import { fastifyCookie } from "@fastify/cookie";
import { fastifySession } from "@fastify/session";
import middie from "@fastify/middie";
import cors from "@fastify/cors";

declare module "fastify" {
	interface Session {
		userId?: string;
		userName?: string;
		accessToken?: string;
		refreshToken?: string;
		authState?: string;
		expires?: number;
	}
}

export default async function app(
	fastify: FastifyInstance,
	opts: FastifyPluginOptions,
) {
	const sessionSecret = process.env.SESSION_SECRET;
	if (!sessionSecret) {
		throw new Error("SESSION_SECRET environment variable is required");
	}

	// Register middleware
	await fastify.register(middie);
	await fastify.register(cors, {
		origin: true,
	});

	// Register session management plugins
	fastify.register(fastifyCookie, {
		secret: sessionSecret,
	});
	fastify.register(fastifySession, {
		secret: sessionSecret,
		cookie: {
			maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
			secure: true,
			httpOnly: true,
			path: process.env.COOKIE_PATH,
			domain: process.env.COOKIE_DOMAIN,
		},
	});

	// Register route plugins
	fastify.register(userRoutes, { prefix: process.env.API_PATH + "/user" });

	fastify.get("/api", async (request, reply) => {
		console.log("request", request);
		reply.send({ hello: "world" });
	});
}
