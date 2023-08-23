import { Stream } from '@/providers/streams';

export type RunOutput = {
  sourceId: string;
  fromEmbed: boolean;
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
