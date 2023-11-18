import { Caption, getCaptionTypeFromUrl, isValidLanguageCode } from '@/providers/captions';
import { sendRequest } from '@/providers/sources/superstream/sendRequest';
import { ScrapeContext } from '@/utils/context';

interface CaptionApiResponse {
  data: {
    list: {
      subtitles: {
        order: number;
        lang: string;
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

  const subtitleList = ((await sendRequest(ctx, subtitleApiQuery)) as CaptionApiResponse).data.list;
  const output: Caption[] = [];

  subtitleList.forEach((sub) => {
    const subtitle = sub.subtitles.sort((a, b) => a.order - b.order)[0];
    if (!subtitle) return;
    const subtitleType = getCaptionTypeFromUrl(subtitle.file_path);
    if (!subtitleType) return;

    const validCode = isValidLanguageCode(subtitle.lang);
    if (!validCode) return;

    output.push({
      language: subtitle.lang,
      hasCorsRestrictions: true,
      type: subtitleType,
      url: subtitle.file_path,
    });
  });

  return output;
}
