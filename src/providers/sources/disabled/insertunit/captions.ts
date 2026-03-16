import { Caption, removeDuplicatedLanguages } from '@/providers/captions';

import { Subtitle } from './types';

export async function getCaptions(data: Subtitle[]) {
  let captions: Caption[] = [];
  for (const subtitle of data) {
    let language = '';

    if (subtitle.name.includes('Рус')) {
      language = 'ru';
    } else if (subtitle.name.includes('Укр')) {
      language = 'uk';
    } else if (subtitle.name.includes('Eng')) {
      language = 'en';
    } else {
      continue;
    }

    captions.push({
      id: subtitle.url,
      url: subtitle.url,
      language,
      type: 'vtt',
      hasCorsRestrictions: false,
    });
  }
  captions = removeDuplicatedLanguages(captions);
  return captions;
}
