import { mixdropScraper } from '@/providers/embeds/mixdrop';
import { upcloudScraper } from '@/providers/embeds/upcloud';
import { upstreamScraper } from '@/providers/embeds/upstream';
import { vidCloudScraper } from '@/providers/embeds/vidcloud';
import { getZoeChipSourceURL, getZoeChipSources } from '@/providers/sources/zoechip/scrape';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';

export const zoeBase = 'https://zoechip.cc';

export type ZoeChipSourceDetails = {
  type: string; // Only seen "iframe" so far
  link: string;
  sources: string[]; // Never seen this populated, assuming it's a string array
  tracks: string[]; // Never seen this populated, assuming it's a string array
  title: string;
};

export async function formatSource(
  ctx: MovieScrapeContext | ShowScrapeContext,
  source: { embed: string; episodeId: string },
) {
  const link = await getZoeChipSourceURL(ctx, source.episodeId);
  if (link) {
    const embed = {
      embedId: '',
      url: link,
    };

    const parsedUrl = new URL(link);

    switch (parsedUrl.host) {
      case 'rabbitstream.net':
        embed.embedId = upcloudScraper.id;
        break;
      case 'upstream.to':
        embed.embedId = upstreamScraper.id;
        break;
      case 'mixdrop.co':
        embed.embedId = mixdropScraper.id;
        break;
      default:
        return null;
    }

    return embed;
  }
}

export async function createZoeChipStreamData(ctx: MovieScrapeContext | ShowScrapeContext, id: string) {
  const sources = await getZoeChipSources(ctx, id);
  const embeds: {
    embedId: string;
    url: string;
  }[] = [];

  for (const source of sources) {
    const formatted = await formatSource(ctx, source);
    if (formatted) {
      // Zoechip does not return titles for their sources, so we can not check if a source is upcloud or vidcloud because the domain is the same.
      const upCloudAlreadyExists = embeds.find((e) => e.embedId === upcloudScraper.id);
      if (formatted.embedId === upcloudScraper.id && upCloudAlreadyExists) {
        formatted.embedId = vidCloudScraper.id;
      }
      embeds.push(formatted);
    }
  }

  return {
    embeds,
  };
}
