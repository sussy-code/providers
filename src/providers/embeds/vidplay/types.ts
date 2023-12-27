export type VidplaySourceResponse = {
  result: {
    sources: {
      file: string;
      tracks: {
        file: string;
        kind: string;
      }[];
    }[];
  };
};
