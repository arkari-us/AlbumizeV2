import { FastifyError, FastifyInstance, FastifyPluginOptions } from "fastify";

export default async function app(
	fastify: FastifyInstance,
	opts: FastifyPluginOptions,
) {
	fastify.get("/", async (request, reply) => {
		console.log("request", request);
		reply.send({ hello: "world" });
	});
}
