export type VidSrcToResponse<T> = {
  status: number;
  result: T;
};

export type SourcesResult = VidSrcToResponse<
  {
    id: string;
    title: 'Filemoon' | 'Vidplay';
  }[]
>;

export type SourceResult = VidSrcToResponse<{
  url: string;
}>;
