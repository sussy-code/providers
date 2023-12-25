import { Flags } from '@/entrypoint/utils/targets';
import { Caption } from '@/providers/captions';

export type StreamFile = {
  type: 'mp4';
  url: string;
  headers?: Record<string, string>;
};

export type Qualities = 'unknown' | '360' | '480' | '720' | '1080' | '4k';

export type FileBasedStream = {
  type: 'file';
  id: string; // only unique per output
  flags: Flags[];
  qualities: Partial<Record<Qualities, StreamFile>>;
  captions: Caption[];
};

export type HlsBasedStream = {
  type: 'hls';
  id: string; // only unique per output
  flags: Flags[];
  playlist: string;
  captions: Caption[];
};

export type Stream = FileBasedStream | HlsBasedStream;
