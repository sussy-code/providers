import { Flags } from '@/main/targets';
import { Stream } from '@/providers/streams';
import { EmbedScrapeContext, MovieScrapeContext, ShowScrapeContext } from '@/utils/context';

export type SourcererEmbed = {
  embedId: string;
  url: string;
};

export type SourcererOutput = {
  embeds: SourcererEmbed[];
  stream?: Stream;
};

export type Sourcerer = {
  id: string;
  name: string; // displayed in the UI
  rank: number; // the higher the number, the earlier it gets put on the queue
  disabled?: boolean;
  flags: Flags[];
  scrapeMovie?: (input: MovieScrapeContext) => Promise<SourcererOutput>;
  scrapeShow?: (input: ShowScrapeContext) => Promise<SourcererOutput>;
};

export function makeSourcerer(state: Sourcerer): Sourcerer {
  return state;
}

export type EmbedOutput = {
  stream: Stream;
};

export type Embed = {
  id: string;
  name: string; // displayed in the UI
  rank: number; // the higher the number, the earlier it gets put on the queue
  disabled?: boolean;
  scrape: (input: EmbedScrapeContext) => Promise<EmbedOutput>;
};

export function makeEmbed(state: Embed): Embed {
  return state;
}
