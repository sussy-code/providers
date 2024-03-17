import { getCaptionTypeFromUrl, labelToLanguageCode } from '@/providers/captions';
import { FileBasedStream } from '@/providers/streams';
import { NotFoundError } from '@/utils/errors';
import { getValidQualityFromString } from '@/utils/quality';

function generateRandomFavs(): string {
  const randomHex = () => Math.floor(Math.random() * 16).toString(16);
  const generateSegment = (length: number) => Array.from({ length }, randomHex).join('');

  return `${generateSegment(8)}-${generateSegment(4)}-${generateSegment(4)}-${generateSegment(4)}-${generateSegment(
    12,
  )}`;
}

function parseSubtitleLinks(inputString?: string | boolean): FileBasedStream['captions'] {
  if (!inputString || typeof inputString === 'boolean') return [];
  const linksArray = inputString.split(',');
  const captions: FileBasedStream['captions'] = [];

  linksArray.forEach((link) => {
    const match = link.match(/\[([^\]]+)\](https?:\/\/\S+?)(?=,\[|$)/);

    if (match) {
      const type = getCaptionTypeFromUrl(match[2]);
      const language = labelToLanguageCode(match[1]);
      if (!type || !language) return;

      captions.push({
        id: match[2],
        language,
        hasCorsRestrictions: false,
        type,
        url: match[2],
      });
    }
  });

  return captions;
}

function parseVideoLinks(inputString?: string): FileBasedStream['qualities'] {
  if (!inputString) throw new NotFoundError('No video links found');
  const linksArray = inputString.split(',');
  const result: FileBasedStream['qualities'] = {};

  linksArray.forEach((link) => {
    const match = link.match(/\[([^]+)](https?:\/\/[^\s,]+\.mp4)/);
    if (match) {
      const qualityText = match[1];
      const mp4Url = match[2];

      const numericQualityMatch = qualityText.match(/(\d+p)/);
      const quality = numericQualityMatch ? numericQualityMatch[1] : 'Unknown';

      const validQuality = getValidQualityFromString(quality);
      result[validQuality] = { type: 'mp4', url: mp4Url };
    }
  });

  return result;
}

function extractTitleAndYear(input: string) {
  const regex = /^(.*?),.*?(\d{4})/;
  const match = input.match(regex);

  if (match) {
    const title = match[1];
    const year = match[2];
    return { title: title.trim(), year: year ? parseInt(year, 10) : null };
  }
  return null;
}

export { extractTitleAndYear, parseSubtitleLinks, parseVideoLinks, generateRandomFavs };
