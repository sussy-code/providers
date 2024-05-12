import { Caption, labelToLanguageCode, removeDuplicatedLanguages } from '@/providers/captions';
import { IndividualEmbedRunnerOptions } from '@/runners/individualRunner';
import { ProviderRunnerOptions } from '@/runners/runner';

export async function addMissingCaptions(
  captions: Caption[],
  ops: ProviderRunnerOptions | IndividualEmbedRunnerOptions,
  media: string,
): Promise<Caption[]> {
  try {
    const [imdbId, season, episode] = atob(media)
      .split('.')
      .map((x, i) => (i === 0 ? x : Number(x) || null));
    if (!imdbId) return captions;
    const Res: { LanguageName: string; SubDownloadLink: string; SubFormat: 'srt' | 'vtt' }[] = await ops.proxiedFetcher(
      `https://rest.opensubtitles.org/search/${season && episode ? `episode-${episode}/` : ''}imdbid-${(imdbId as string).slice(2)}${season && episode ? `/season-${season}` : ''}`,
      {
        headers: {
          'X-User-Agent': 'VLSub 0.10.2',
        },
      },
    );

    const Captions: Caption[] = [];
    for (const caption of Res) {
      const url = caption.SubDownloadLink.replace('.gz', '').replace('download/', 'download/subencoding-utf8/');
      const language = labelToLanguageCode(caption.LanguageName);
      if (!url || !language) continue;

      // check if the stream already has the language
      const existingCaption = captions.find((x) => x.language === language);
      if (existingCaption) Captions.push(existingCaption);
      else
        Captions.push({
          id: url,
          url,
          type: caption.SubFormat || 'srt',
          hasCorsRestrictions: false,
          language,
        });
    }
    return removeDuplicatedLanguages(Captions);
  } catch {
    return captions;
  }
}
