import { CommonMedia } from '@/entrypoint/utils/media';

export function normalizeTitle(title: string): string {
  let titleTrimmed = title.trim().toLowerCase();
  if (titleTrimmed !== 'the movie' && titleTrimmed.endsWith('the movie')) {
    titleTrimmed = titleTrimmed.replace('the movie', '');
  }
  if (titleTrimmed !== 'the series' && titleTrimmed.endsWith('the series')) {
    titleTrimmed = titleTrimmed.replace('the series', '');
  }
  return titleTrimmed.replace(/['":]/g, '').replace(/[^a-zA-Z0-9]+/g, '_');
}

export function compareTitle(a: string, b: string): boolean {
  return normalizeTitle(a) === normalizeTitle(b);
}

export function compareMedia(media: CommonMedia, title: string, releaseYear?: number): boolean {
  // if no year is provided, count as if its the correct year
  const isSameYear = releaseYear === undefined ? true : media.releaseYear === releaseYear;
  return compareTitle(media.title, title) && isSameYear;
}
