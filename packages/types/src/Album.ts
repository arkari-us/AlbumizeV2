export type Album = {
  album_type: string;
  name: string;
  id: string;
  image: string;
  total_tracks: number;
  artists: { id: string; name: string }[];
};
