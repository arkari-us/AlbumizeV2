import Fastify from "fastify";
import fp from "fastify-plugin";

import app from "./app";

const fastify = Fastify({
	logger: true, // TODO: update to log to database
	connectionTimeout: 120000,
	requestTimeout: 60000,
	keepAliveTimeout: 10000,
	http: {
		headersTimeout: 15000,
	},
});

fastify.register(fp(app));

fastify.listen({ port: 3000 }, function (err, address) {
	if (err) {
		fastify.log.error(err);
		process.exit(1);
	}
});
