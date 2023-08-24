export type StreamFile = {
  type: 'mp4';
  url: string;
};

export type Qualities = '360' | '480' | '720' | '1080';

export type FileBasedStream = {
  type: 'file';
  qualities: Partial<Record<Qualities, StreamFile>>;
};

export type HlsBasedStream = {
  type: 'hls';
  playlist: string;
};

export type Stream = FileBasedStream | HlsBasedStream;
