import { UseableFetcher } from '@/fetchers/types';
import { FullScraperEvents } from '@/main/events';
import { ScrapeMedia } from '@/main/media';
import { EmbedOutput, SourcererOutput } from '@/providers/base';
import { ProviderList } from '@/providers/get';
import { Stream } from '@/providers/streams';
import { ScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';
import { reorderOnIdList } from '@/utils/list';

export type RunOutput = {
  sourceId: string;
  embedId?: string;
  stream: Stream;
};

export type SourceRunOutput = {
  sourceId: string;
  stream?: Stream;
  embeds: [];
};

export type EmbedRunOutput = {
  embedId: string;
  stream?: Stream;
};

export type ProviderRunnerOptions = {
  fetcher: UseableFetcher;
  proxiedFetcher: UseableFetcher;
  sourceOrder?: string[];
  embedOrder?: string[];
  events?: FullScraperEvents;
  media: ScrapeMedia;
};

export async function runAllProviders(list: ProviderList, ops: ProviderRunnerOptions): Promise<RunOutput | null> {
  const sources = reorderOnIdList(ops.sourceOrder ?? [], list.sources).filter((v) => {
    if (ops.media.type === 'movie') return !!v.scrapeMovie;
    if (ops.media.type === 'show') return !!v.scrapeShow;
    return false;
  });
  const embeds = reorderOnIdList(ops.embedOrder ?? [], list.embeds);
  const embedIds = embeds.map((v) => v.id);

  const contextBase: ScrapeContext = {
    fetcher: ops.fetcher,
    proxiedFetcher: ops.proxiedFetcher,
    progress(val) {
      ops.events?.update?.({
        percentage: val,
        status: 'pending',
      });
    },
  };

  ops.events?.init?.({
    sourceIds: sources.map((v) => v.id),
  });

  for (const s of sources) {
    ops.events?.start?.(s.id);

    // run source scrapers
    let output: SourcererOutput | null = null;
    try {
      if (ops.media.type === 'movie' && s.scrapeMovie)
        output = await s.scrapeMovie({
          ...contextBase,
          media: ops.media,
        });
      else if (ops.media.type === 'show' && s.scrapeShow)
        output = await s.scrapeShow({
          ...contextBase,
          media: ops.media,
        });
    } catch (err) {
      if (err instanceof NotFoundError) {
        ops.events?.update?.({
          percentage: 100,
          status: 'notfound',
        });
        continue;
      }
      ops.events?.update?.({
        percentage: 100,
        status: 'failure',
        error: err,
      });
      continue;
    }
    if (!output) throw new Error('Invalid media type');

    // return stream is there are any
    if (output.stream) {
      return {
        sourceId: s.id,
        stream: output.stream,
      };
    }

    if (output.embeds.length > 0) {
      ops.events?.discoverEmbeds?.({
        embeds: output.embeds.map((v, i) => ({
          id: [s.id, i].join('-'),
          embedScraperId: v.embedId,
        })),
        sourceId: s.id,
      });
    }

    // run embed scrapers on listed embeds
    const sortedEmbeds = output.embeds;
    sortedEmbeds.sort((a, b) => embedIds.indexOf(a.embedId) - embedIds.indexOf(b.embedId));

    for (const ind in sortedEmbeds) {
      if (!Object.prototype.hasOwnProperty.call(sortedEmbeds, ind)) continue;
      const e = sortedEmbeds[ind];
      const scraper = embeds.find((v) => v.id === e.embedId);
      if (!scraper) throw new Error('Invalid embed returned');

      // run embed scraper
      const id = [s.id, ind].join('-');
      ops.events?.start?.(id);
      let embedOutput: EmbedOutput;
      try {
        embedOutput = await scraper.scrape({
          ...contextBase,
          url: e.url,
        });
      } catch (err) {
        if (err instanceof NotFoundError) {
          ops.events?.update?.({
            percentage: 100,
            status: 'notfound',
          });
          continue;
        }
        ops.events?.update?.({
          percentage: 100,
          status: 'failure',
          error: err,
        });
        continue;
      }

      return {
        sourceId: s.id,
        embedId: scraper.id,
        stream: embedOutput.stream,
      };
    }
  }

  // no providers or embeds returns streams
  return null;
}
