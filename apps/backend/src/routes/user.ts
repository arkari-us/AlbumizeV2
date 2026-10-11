import {
	Type,
	FastifyPluginAsyncTypebox,
} from "@fastify/type-provider-typebox";
import axios from "axios";
import querystring from "node:querystring";
import { upsertOptions } from "./constants";
import { User } from "../schemas/User";

function createStateString() {
	var state = "";
	const charset =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	for (var i = 0; i < 16; i++) {
		state += charset.charAt(Math.floor(Math.random() * charset.length));
	}

	return state;
}

export const userRoutes: FastifyPluginAsyncTypebox = async function (
	fastify,
	opts,
) {
	fastify.get("/auth", async (request, reply) => {
		const state = createStateString();
		const query = querystring.stringify({
			response_type: "code",
			client_id: process.env.CLIENT_ID,
			scope: "playlist-read-private user-read-private playlist-modify-private",
			redirect_uri: process.env.CALLBACK_URI,
			state: state,
		});

		request.session.authState = state;
		reply.redirect("https://accounts.spotify.com/authorize?" + query);
	});

	fastify.get("/auth/callback", async (request, reply) => {
		const query = querystring.parse(new URL(request.url).search);

		if (
			!request.session.authState ||
			request.session.authState !== query.state
		) {
			return reply
				.status(400)
				.send({ err: "State mismatch", status: 400 });
		}

		request.session.authState = undefined;
		const authCode = query.code;

		const headers = {
			Accept: "application/json",
			"Content-Type": "application/x-www-form-urlencoded",
		};

		const postQuery = {
			grant_type: "authorization_code",
			code: authCode,
			redirect_uri: process.env.CALLBACK_URI,
			client_id: process.env.CLIENT_ID,
			client_secret: process.env.CLIENT_SECRET,
		};

		axios
			.post(
				"https://accounts.spotify.com/api/token",
				querystring.stringify(postQuery),
				{ headers },
			)
			.then((spotifyKeys) => {
				//get user id (to be used as mongodb _id) and username (to display on front end)
				axios
					.get("https://api.spotify.com/v1/me", {
						headers: {
							Accept: "application/json",
							"Content-Type": "application/json",
							Authorization:
								"Bearer " + spotifyKeys.data.access_token,
						},
					})
					.then(async (profile) => {
						const userid = profile.data.id;
						const username = profile.data.display_name;

						request.session.refreshToken =
							spotifyKeys.data.refresh_token;
						request.session.accessToken =
							spotifyKeys.data.access_token;

						const keys = {
							userid: userid,
							username: username,
							expires: new Date().getTime() + 60 * 60 * 1000, //one hour in milliseconds
						};

						const doc = await User.findOneAndUpdate(
							{ userid },
							{ $set: keys },
							upsertOptions,
						);
						if (doc) {
							request.session.userId = userid;
							request.session.userName = username;

							return reply.redirect(process.env.CLIENT_URI ?? "");
						}
					})
					.catch((err) => {
						console.log(err);
					});
			})
			.catch((err) => {
				return reply.status(500).send({ err: err, status: 500 });
			});
	});
};
