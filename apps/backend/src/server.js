import Fastify from "fastify";
const fastify = Fastify({
    logger: true,
});
fastify.get("/", async (request, reply) => {
    console.log("request", request);
    reply.send({ hello: "world" });
});
fastify.listen({ port: 3000 }, function (err, address) {
    if (err) {
        fastify.log.error(err);
        process.exit(1);
    }
});
