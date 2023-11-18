export const captionTypes = {
  srt: 'srt',
  vtt: 'vtt',
};
export type CaptionType = keyof typeof captionTypes;

export type Caption = {
  type: CaptionType;
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
