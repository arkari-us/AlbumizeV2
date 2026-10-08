import { Type, type Static } from "typebox";

export const AlbumSchema = Type.Object({
	id: Type.String(),
	name: Type.String(),
	images: Type.Array(
		Type.Object({
			id: Type.String(),
			url: Type.String(),
		}),
	),
	artists: Type.Array(
		Type.Object({
			id: Type.String(),
			name: Type.String(),
		}),
	),
	album_type: Type.String(),
	total_tracks: Type.Number(),
	alreadyExported: Type.Boolean(),
});

export type Album = Static<typeof AlbumSchema>;
