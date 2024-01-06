export type VidplaySourceResponse = {
  result:
    | {
        sources: {
          file: string;
          tracks: {
            file: string;
            kind: string;
          }[];
        }[];
      }
    | number;
};

export type SubtitleResult = {
  file: string;
  label: string;
  kind: string;
}[];
