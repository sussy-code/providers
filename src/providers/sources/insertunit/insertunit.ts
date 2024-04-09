import { flags } from '@/entrypoint/utils/targets';
import { makeSourcerer } from '@/providers/base';
import { Caption, removeDuplicatedLanguages } from '@/providers/captions';
import { NotFoundError } from '@/utils/errors';

import { Season, Subtitle } from './types';

const insertUnitBase = 'https://api.insertunit.ws/';

export const insertunitScraper = makeSourcerer({
  id: 'insertunit',
  name: 'Insertunit',
  disabled: false,
  rank: 60,
  flags: [flags.CORS_ALLOWED],
  async scrapeShow(ctx) {
    const playerData = await ctx.fetcher<string>(`/embed/imdb/${ctx.media.imdbId}`, {
      baseUrl: insertUnitBase,
    });
    ctx.progress(30);

    const seasonDataJSONregex = /seasons:(.*)/;
    const seasonData = seasonDataJSONregex.exec(playerData);

    if (seasonData === null || seasonData[1] === null) {
      throw new NotFoundError('No result found');
    }
    ctx.progress(60);

    const seasonTable: Season[] = JSON.parse(seasonData[1]) as Season[];

    const currentSeason = seasonTable.find(
      (seasonElement) => seasonElement.season === ctx.media.season.number && !seasonElement.blocked,
    );

    const currentEpisode = currentSeason?.episodes.find((episodeElement) =>
      episodeElement.episode.includes(ctx.media.episode.number.toString()),
    );

    if (!currentEpisode?.hls) throw new NotFoundError('No result found');

    let captions: Caption[] = [];

    ctx.progress(80);

    if (currentEpisode.cc != null) {
      let subtitle: Subtitle;
      for (subtitle of currentEpisode.cc) {
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
    }

    ctx.progress(95);

    return {
      embeds: [],
      stream: [
        {
          id: 'primary',
          playlist: currentEpisode.hls,
          type: 'hls',
          flags: [flags.CORS_ALLOWED],
          captions,
        },
      ],
    };
  },
  async scrapeMovie(ctx) {
    const playerData = await ctx.fetcher<string>(`/embed/imdb/${ctx.media.imdbId}`, {
      baseUrl: insertUnitBase,
    });
    ctx.progress(35);

    const streamRegex = /hls: "([^"]*)/;
    const streamData = streamRegex.exec(playerData);

    if (streamData === null || streamData[1] === null) {
      throw new NotFoundError('No result found');
    }
    ctx.progress(75);

    const subtitleRegex = /cc: (.*)/;
    const subtitleJSONData = subtitleRegex.exec(playerData);

    let captions: Caption[] = [];

    if (subtitleJSONData != null && subtitleJSONData[1] != null) {
      const subtitleData = JSON.parse(subtitleJSONData[1]);
      let subtitle: Subtitle;
      for (subtitle of subtitleData as Subtitle[]) {
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
    }

    ctx.progress(90);

    return {
      embeds: [],
      stream: [
        {
          id: 'primary',
          type: 'hls',
          playlist: streamData[1],
          flags: [flags.CORS_ALLOWED],
          captions,
        },
      ],
    };
  },
});
