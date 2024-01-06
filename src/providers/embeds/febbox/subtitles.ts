import {
  Caption,
  getCaptionTypeFromUrl,
  isValidLanguageCode,
  removeDuplicatedLanguages as removeDuplicateLanguages,
} from '@/providers/captions';
import { captionsDomains } from '@/providers/sources/showbox/common';
import { sendRequest } from '@/providers/sources/showbox/sendRequest';
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
    mid: type === 'movie' ? id : undefined,
    tid: type !== 'movie' ? id : undefined,
    episode: episodeId?.toString(),
    season: seasonId?.toString(),
  };

  const subResult = (await sendRequest(ctx, subtitleApiQuery)) as CaptionApiResponse;
  const subtitleList = subResult.data.list;
  let output: Caption[] = [];

  subtitleList.forEach((sub) => {
    const subtitle = sub.subtitles.sort((a, b) => b.order - a.order)[0];
    if (!subtitle) return;

    const subtitleFilePath = subtitle.file_path
      .replace(captionsDomains[0], captionsDomains[1])
      .replace(/\s/g, '+')
      .replace(/[()]/g, (c) => {
        return `%${c.charCodeAt(0).toString(16)}`;
      });

    const subtitleType = getCaptionTypeFromUrl(subtitleFilePath);
    if (!subtitleType) return;

    const validCode = isValidLanguageCode(subtitle.lang);
    if (!validCode) return;

    output.push({
      id: subtitleFilePath,
      language: subtitle.lang,
      hasCorsRestrictions: true,
      type: subtitleType,
      url: subtitleFilePath,
    });
  });

  output = removeDuplicateLanguages(output);

  return output;
}
