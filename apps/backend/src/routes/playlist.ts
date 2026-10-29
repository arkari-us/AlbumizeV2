import {
	FastifyPluginAsyncTypebox,
	Type,
} from "@fastify/type-provider-typebox";
import axios from "axios";
import { upsertOptions } from "./constants";
import { User } from "../schemas/User";
import { authCheck } from "../plugins/authCheck";

export const playlistRoutes: FastifyPluginAsyncTypebox = async function (
	fastify,
) {
	fastify.register(authCheck);

	fastify.post(
		"/newplaylist",
		{
			schema: {
				body: Type.Object({
					albums: Type.Array(Type.String()),
				}),
			},
		},
		async (request, reply) => {
			const playlistName = `Albumize_${getDateYYYYMMDD()}`;

			const headers = {
				Accept: "application/json",
				"Content-Type": "application/json",
				Authorization: "Bearer " + request.session.accessToken,
			};

			const query = {
				name: playlistName,
				description: "Created by Albumize: http://arkari.us/albumize",
				public: false,
			};

			const playlistResponse = await axios.post(
				`https://api.spotify.com/v1/users/${request.session.userid}/playlists`,
				query,
				{ headers },
			);

			const albumPromises: Promise<any>[] = [];
			const uris: string[] = [];
			const albums = Array.isArray(request.body.albums)
				? request.body.albums
				: [];

			if (!albums.length) {
				return reply
					.status(400)
					.send({ err: "No albums provided", status: 400 });
			}

			for (let i = 0; i < albums.length / 20; i++) {
				albumPromises.push(
					axios.get(
						`https://api.spotify.com/v1/albums?ids=${albums
							.slice(i * 20, (i + 1) * 20)
							.join(",")}&market=US`,
						{ headers },
					),
				);
			}

			try {
				const albumData = await Promise.all(albumPromises);

				albumData.forEach((segment) => {
					segment.data.albums.forEach((album) => {
						album.tracks.items.forEach((track) => {
							uris.push(track.uri);
						});
					});
				});
			} catch (err) {
				return reply.send(err);
			}

			for (let i = 0; i < uris.length / 100; i++) {
				await axios.post(
					`https://api.spotify.com/v1/playlists/${playlistResponse.data.id}/tracks?uris=${uris
						.slice(i * 100, (i + 1) * 100)
						.join(",")}`,
					{},
					{ headers },
				);
			}

			return User.findOneAndUpdate(
				{ userid: request.session.userId },
				{ $addToSet: { exportList: { $each: albums } } },
				upsertOptions,
			);
		},
	);

	const getDateYYYYMMDD = () => {
		const curDate = new Date();
		const yyyy = curDate.getFullYear();
		const month = curDate.getMonth() + 1;
		const mm = (month > 9 ? "" : "0") + month;
		const day = curDate.getDate();
		const dd = (day > 9 ? "" : "0") + day;

		return [yyyy, "-", mm, "-", dd].join("");
	};
};
