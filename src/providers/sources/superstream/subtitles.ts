import { Caption } from '@/providers/captions';
import { sendRequest } from '@/providers/sources/superstream/sendRequest';
import { ScrapeContext } from '@/utils/context';

interface CaptionApiResponse {
  data: {
    list: {
      language: string;
      subtitles: {
        file_path: string;
      }[];
    }[];
  };
}

export async function getSubtitles(
  ctx: ScrapeContext,
  id: string,
  fid: number | undefined,
  type: 'show' | 'movie',
  episodeId?: number,
  seasonId?: number,
): Promise<Caption[]> {
  const module = type === 'movie' ? 'Movie_srt_list_v2' : 'TV_srt_list_v2';
  const subtitleApiQuery = {
    fid,
    uid: '',
    module,
    mid: id,
    episode: episodeId?.toString(),
    season: seasonId?.toString(),
    group: episodeId ? '' : undefined,
  };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _subtitleList = ((await sendRequest(ctx, subtitleApiQuery)) as CaptionApiResponse).data.list;
  return [];
}
