import { ScrapeMedia } from '@/index';

export type VideoLinks = {
  success: boolean;
  message: string;
  premium_content: number;
  url: string;
  quality: string;
  subtitle: boolean | string;
  subtitle_lns: boolean;
  subtitle_def: boolean;
  thumbnails: string;
};

export interface MovieData {
  id: string | null;
  year: number;
  type: ScrapeMedia['type'];
  url: string;
}
