import { MovieMedia, ShowMedia } from '@/main/media';
import { mixdropScraper } from '@/providers/embeds/mixdrop';
import { upcloudScraper } from '@/providers/embeds/upcloud';
import { upstreamScraper } from '@/providers/embeds/upstream';
import { getZoeChipSourceURL, getZoeChipSources } from '@/providers/sources/zoechip/scrape';
import { ScrapeContext } from '@/utils/context';

export const zoeBase = 'https://zoechip.cc';

export type MovieContext = ScrapeContext & {
  media: MovieMedia;
};

export type ShowContext = ScrapeContext & {
  media: ShowMedia;
};

export type ZoeChipSourceDetails = {
  type: string; // Only seen "iframe" so far
  link: string;
  sources: string[]; // Never seen this populated, assuming it's a string array
  tracks: string[]; // Never seen this populated, assuming it's a string array
  title: string;
};

export async function formatSource(ctx: MovieContext | ShowContext, source: { embed: string; episodeId: string }) {
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
        throw new Error(`Failed to find ZoeChip embed source for ${link}`);
    }

    return embed;
  }
}

export async function createZoeChipStreamData(ctx: MovieContext | ShowContext, id: string) {
  const sources = await getZoeChipSources(ctx, id);
  const embeds: {
    embedId: string;
    url: string;
  }[] = [];

  for (const source of sources) {
    const formatted = await formatSource(ctx, source);
    if (formatted) {
      embeds.push(formatted);
    }
  }

  return {
    embeds,
  };
}
