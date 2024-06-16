import { parse, stringify } from 'hls-parser';
import { MasterPlaylist } from 'hls-parser/types';

import { UseableFetcher } from '@/fetchers/types';

export async function convertPlaylistsToDataUrls(
  fetcher: UseableFetcher,
  playlistUrl: string,
  headers?: Record<string, string>,
) {
  const playlistData = await fetcher(playlistUrl, { headers });
  const playlist = parse(playlistData);

  if (playlist.isMasterPlaylist) {
    for (const variant of (playlist as MasterPlaylist).variants) {
      const variantPlaylistData = await fetcher(variant.uri, { headers });
      const variantPlaylist = parse(variantPlaylistData);
      variant.uri = `data:application/vnd.apple.mpegurl;base64,${btoa(stringify(variantPlaylist))}`;
    }
  }

  return `data:application/vnd.apple.mpegurl;base64,${btoa(stringify(playlist))}`;
}
