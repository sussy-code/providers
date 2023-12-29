import { FullScraperEvents } from '@/entrypoint/utils/events';
import { ScrapeMedia } from '@/entrypoint/utils/media';
import { FeatureMap, flagsAllowedInFeatures } from '@/entrypoint/utils/targets';
import { UseableFetcher } from '@/fetchers/types';
import { EmbedOutput, SourcererOutput } from '@/providers/base';
import { ProviderList } from '@/providers/get';
import { Stream } from '@/providers/streams';
import { ScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';
import { reorderOnIdList } from '@/utils/list';
import { isValidStream } from '@/utils/valid';

export type RunOutput = {
  sourceId: string;
  embedId?: string;
  stream: Stream;
};

export type SourceRunOutput = {
  sourceId: string;
  stream: Stream[];
  embeds: [];
};

export type EmbedRunOutput = {
  embedId: string;
  stream: Stream[];
};

export type ProviderRunnerOptions = {
  fetcher: UseableFetcher;
  proxiedFetcher: UseableFetcher;
  features: FeatureMap;
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
  let lastId = '';

  const contextBase: ScrapeContext = {
    fetcher: ops.fetcher,
    proxiedFetcher: ops.proxiedFetcher,
    progress(val) {
      ops.events?.update?.({
        id: lastId,
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
    lastId = s.id;

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
      if (output) {
        output.stream = (output.stream ?? [])
          .filter((stream) => isValidStream(stream))
          .filter((stream) => flagsAllowedInFeatures(ops.features, stream.flags));
      }
      if (!output) throw Error('No output');
      if ((!output.stream || output.stream.length === 0) && output.embeds.length === 0)
        throw new NotFoundError('No streams found');
    } catch (err) {
      if (err instanceof NotFoundError) {
        ops.events?.update?.({
          id: s.id,
          percentage: 100,
          status: 'notfound',
          reason: err.message,
        });
        continue;
      }
      ops.events?.update?.({
        id: s.id,
        percentage: 100,
        status: 'failure',
        error: err,
      });
      continue;
    }
    if (!output) throw new Error('Invalid media type');

    // return stream is there are any
    if (output.stream?.[0]) {
      return {
        sourceId: s.id,
        stream: output.stream[0],
      };
    }

    // run embed scrapers on listed embeds
    const sortedEmbeds = output.embeds.sort((a, b) => embedIds.indexOf(a.embedId) - embedIds.indexOf(b.embedId));

    if (sortedEmbeds.length > 0) {
      ops.events?.discoverEmbeds?.({
        embeds: sortedEmbeds.map((v, i) => ({
          id: [s.id, i].join('-'),
          embedScraperId: v.embedId,
        })),
        sourceId: s.id,
      });
    }

    for (const ind in sortedEmbeds) {
      if (!Object.prototype.hasOwnProperty.call(sortedEmbeds, ind)) continue;
      const e = sortedEmbeds[ind];
      const scraper = embeds.find((v) => v.id === e.embedId);
      if (!scraper) throw new Error('Invalid embed returned');

      // run embed scraper
      const id = [s.id, ind].join('-');
      ops.events?.start?.(id);
      lastId = id;
      let embedOutput: EmbedOutput;
      try {
        embedOutput = await scraper.scrape({
          ...contextBase,
          url: e.url,
        });
        embedOutput.stream = embedOutput.stream
          .filter((stream) => isValidStream(stream))
          .filter((stream) => flagsAllowedInFeatures(ops.features, stream.flags));
        if (embedOutput.stream.length === 0) throw new NotFoundError('No streams found');
      } catch (err) {
        if (err instanceof NotFoundError) {
          ops.events?.update?.({
            id,
            percentage: 100,
            status: 'notfound',
            reason: err.message,
          });
          continue;
        }
        ops.events?.update?.({
          id,
          percentage: 100,
          status: 'failure',
          error: err,
        });
        continue;
      }

      return {
        sourceId: s.id,
        embedId: scraper.id,
        stream: embedOutput.stream[0],
      };
    }
  }

  // no providers or embeds returns streams
  return null;
}
