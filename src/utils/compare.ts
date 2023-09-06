import { CommonMedia } from '@/main/media';

export function normalizeTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/['":]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_');
}

export function compareTitle(a: string, b: string): boolean {
  return normalizeTitle(a) === normalizeTitle(b);
}

export function compareMedia(media: CommonMedia, title: string, releaseYear?: number): boolean {
  // if no year is provided, count as if its the correct year
  const isSameYear = releaseYear === undefined ? true : media.releaseYear === releaseYear;
  return compareTitle(media.title, title) && isSameYear;
}
