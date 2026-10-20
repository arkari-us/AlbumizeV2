import { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { FastifyReply, FastifyRequest } from "fastify";
import { User } from "../schemas/User";
import querystring from "node:querystring";
import axios from "axios";

const authCheck: FastifyPluginAsyncTypebox = async function (fastify, opts) {
	const authCheck = async (
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<FastifyReply | void> => {
		if (!request.session || !request.session.userId) {
			return reply.status(401).send({ err: "No session", status: 401 });
		}

		const currentTime = new Date().getTime();

		if (currentTime > (request.session.expires ?? 0)) {
			const doc = await User.findOne({ userid: request.session.userId });
			if (!doc) {
				return reply
					.status(401)
					.send({ err: "Invalid session", status: 401 });
			}

			const newTokenData = await refreshApiToken(
				request.session.refreshToken ?? "",
				request.session.userId ?? "",
			);
			request.session.accessToken = newTokenData.accessToken;
			request.session.expires = newTokenData.expires;
		}
	};

	const refreshApiToken = async (refreshToken: string, userId: string) => {
		const headers = {
			Accept: "application/json",
			"Content-Type": "application/x-www-form-urlencoded",
		};

		const postQuery = {
			grant_type: "refresh_token",
			refresh_token: refreshToken,
			redirect_uri: process.env.REDIRECT_URI,
			client_id: process.env.CLIENT_ID,
			client_secret: process.env.CLIENT_SECRET,
		};

		return axios
			.post(
				"https://accounts.spotify.com/api/token",
				querystring.stringify(postQuery),
				{ headers },
			)
			.then((spotifyKeys) => {
				const keys = {
					accessToken: spotifyKeys.data.access_token,
					expires: new Date().getTime() + 60 * 60 * 1000, //one hour in milliseconds
				};
				return keys;
			})
			.catch((err) => {
				console.log(
					"Error refreshing API token for userId: ",
					userId,
					err,
				);
				throw new Error("Error refreshing API token");
			});
	};

	fastify.addHook("onRequest", async (request, reply) => {
		if (
			!request.session ||
			!request.session.userId ||
			!request.session.userName ||
			!request.session.accessToken ||
			!request.session.refreshToken
		) {
			return reply.status(401).send({ err: "No session", status: 401 });
		}

		return authCheck(request, reply);
	});
};
