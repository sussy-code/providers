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

export const getSimilarityBetweenStrings = (firstParam: string, secondParam: string): number => {
  const first = firstParam.replace(/\s+/g, '');
  const second = secondParam.replace(/\s+/g, '');

  if (first === second) return 1; // identical or empty
  if (first.length < 2 || second.length < 2) return 0; // if either is a 0-letter or 1-letter string

  const firstBigrams = new Map();
  for (let i = 0; i < first.length - 1; i += 1) {
    const bigram = first.substring(i, i + 2);
    const count = firstBigrams.has(bigram) ? firstBigrams.get(bigram) + 1 : 1;

    firstBigrams.set(bigram, count);
  }

  let intersectionSize = 0;
  for (let i = 0; i < second.length - 1; i += 1) {
    const bigram = second.substring(i, i + 2);
    const count = firstBigrams.has(bigram) ? firstBigrams.get(bigram) : 0;

    if (count > 0) {
      firstBigrams.set(bigram, count - 1);
      intersectionSize += 1;
    }
  }

  return (2.0 * intersectionSize) / (first.length + second.length - 2);
};
