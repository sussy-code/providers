import ISO6391 from 'iso-639-1';

export const captionTypes = {
  srt: 'srt',
  vtt: 'vtt',
};
export type CaptionType = keyof typeof captionTypes;

export type Caption = {
  type: CaptionType;
  id: string; // only unique per stream
  opensubtitles?: boolean;
  url: string;
  hasCorsRestrictions: boolean;
  language: string;
};

export function getCaptionTypeFromUrl(url: string): CaptionType | null {
  const extensions = Object.keys(captionTypes) as CaptionType[];
  const type = extensions.find((v) => url.endsWith(`.${v}`));
  if (!type) return null;
  return type;
}

export function labelToLanguageCode(label: string): string | null {
  const code = ISO6391.getCode(label);
  if (code.length === 0) return null;
  return code;
}

export function isValidLanguageCode(code: string | null): boolean {
  if (!code) return false;
  return ISO6391.validate(code);
}

export function removeDuplicatedLanguages(list: Caption[]) {
  const beenSeen: Record<string, true> = {};

  return list.filter((sub) => {
    if (beenSeen[sub.language]) return false;
    beenSeen[sub.language] = true;
    return true;
  });
}
