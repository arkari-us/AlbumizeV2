import { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { User } from "../schemas/User";
import querystring from "node:querystring";
import { authCheck } from "../plugins/authCheck";
import axios from "axios";
import { Album } from "../../../../packages/common/dist/Album";
import { FastifyReply, FastifyRequest } from "fastify";

const releaseRadarPlaylistId = "37i9dQZEVXbcN5lAR5ECIv";
const discoverWeeklyPlaylistId = "37i9dQZEVXcKSyWvdqHE5m";

export const albumRoutes: FastifyPluginAsyncTypebox = async function (
	fastify,
	opts,
) {
	fastify.register(authCheck);

	const getNewReleaseAlbums = async (
		request: FastifyRequest,
		reply: FastifyReply,
	) => {
		const data = await getAlbums(
			releaseRadarPlaylistId,
			request.session.accessToken || "",
			request.session.userId || "",
		);
		return reply.status(200).send({ albums: data, status: 200 });
	};

	const getDiscoverWeeklyAlbums = async (
		request: FastifyRequest,
		reply: FastifyReply,
	) => {
		const data = await getAlbums(
			discoverWeeklyPlaylistId,
			request.session.accessToken || "",
			request.session.userId || "",
		);
		return reply.status(200).send({ albums: data, status: 200 });
	};

	const getAlbums = async (
		id: string,
		accessToken: string,
		userid: string,
	) => {
		const headers = {
			Accept: "application/json",
			"Content-Type": "application/json",
			Authorization: "Bearer " + accessToken,
		};

		const postQuery = {
			fields: "tracks.items.track.album(album_type,name,id,images,release_date,total_tracks,artists(id,name))",
		};

		const albumData = await axios.get(
			"https://api.spotify.com/v1/playlists/" +
				id +
				"?" +
				querystring.stringify(postQuery),
			{ headers: headers },
		);
		const exportedAlbums = await getExportedAlbums(userid);
		const albums: Album[] = [];
		albumData.data.tracks.items.forEach((item: any) => {
			if (item.track) {
				let album = item.track.album;
				album.alreadyExported = exportedAlbums.includes(
					item.track.album.id,
				);
				albums.push(album);
			}
		});

		return albums;
	};

	const getExportedAlbums = async (userid: string): Promise<string[]> => {
		const doc = await User.findOne({ userid: userid });
		if (doc) {
			return doc.exportList;
		}
		return [];
	};

	fastify.get("/releaseradar", getNewReleaseAlbums);
	fastify.get("/discoverweekly", getDiscoverWeeklyAlbums);
};
