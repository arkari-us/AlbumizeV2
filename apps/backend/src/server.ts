import Fastify from "fastify";
import fp from "fastify-plugin";
import "dotenv/config.js";
import fs from "fs";

import app from "./app";
import path from "path/win32";

const fastify = Fastify({
	logger: true, // TODO: update to log to database
	connectionTimeout: 120000,
	requestTimeout: 60000,
	keepAliveTimeout: 10000,
	https: {
		key: fs.readFileSync(process.env.SSL_CERT_PATH + "-key.pem" || ""),
		cert: fs.readFileSync(process.env.SSL_CERT_PATH + ".pem" || ""),
	},
});

fastify.register(fp(app));

fastify.listen(
	{ port: +(process.env.API_PORT || 3000) },
	function (err, address) {
		if (err) {
			fastify.log.error(err);
			process.exit(1);
		}
	},
);
