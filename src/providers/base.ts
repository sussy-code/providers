import { ScrapeContext } from '@/utils/context';

export type Sourcerer = {
  id: string;
  name: string; // displayed in the UI
  rank: number; // the higher the number, the earlier it gets put on the queue
  disabled?: boolean;
  scrape: (input: ScrapeContext) => void;
};

export function makeSourcerer(state: Sourcerer): Sourcerer | null {
  if (state.disabled) return null;
  return state;
}
