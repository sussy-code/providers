export interface itemDetails {
  status: number;
  message: {
    id: string;
    imdbID: string;
    title: string;
    video: string;
    server: string;
    year: string;
    image: string;
    glow: string;
    rating: string;
    watch_count: string;
    datetime?: string | null;
    requested_by?: string | null;
    subs?: string | null;
    time?: string | null;
    duration?: string | null;
  };
}

export interface renewResponse {
  k: string;
  msg?: string | null;
  status: number | string | null;
}
