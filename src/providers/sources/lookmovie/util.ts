import json5 from 'json5';

import { MovieMedia, ShowMedia } from '@/main/media';
import { compareMedia } from '@/utils/compare';
import { NotFoundError } from '@/utils/errors';

import { Result } from './type';
import { getVideoUrl } from './video';

export async function searchAndFindMedia(media: MovieMedia | ShowMedia): Promise<Result | undefined> {
  if (media.type === "show") {
    const searchRes = await fetch(`https://lmscript.xyz/v1/shows?filters[q]=${encodeURIComponent(media.title)}`).then((d) => d.json());

    const results = searchRes.result;
    const result = results.find((res: Result) => compareMedia(media, res.title, Number(res.year)));
    return result;
  } else if (media.type === "movie")  {
    const searchRes = await fetch(`https://lmscript.xyz/v1/movies?filters[q]=${encodeURIComponent(media.title)}`).then((d) => d.json());

    const results = searchRes.items;
    const result = results.find((res: Result) => compareMedia(media, res.title, Number(res.year)));
    return result;
  }
 

}

export async function scrape(media: MovieMedia | ShowMedia, result: Result) {
  const url = `https://www.lookmovie2.to/${media.type}s/play/${result.slug}`;
  const pageReq = await fetch(url).then((d) => d.text());

  // Extract and parse JSON
  const scriptJson = `{${pageReq
    .slice(pageReq.indexOf(`${media.type}_storage`))
    .split('};')[0]
    .split('= {')[1]
    .trim()}}`;
  const data = json5.parse(scriptJson);

  // Find the relevant id
  let id = null;
  if (media.type === 'movie') {
    id = result.id_movie;
  } else if (media.type === 'show') {
    const episodeObj = data.seasons.find((v: any) => {
      return Number(v.season) === Number(media.season.number) && Number(v.episode) === Number(media.episode.number);
    });

    if (episodeObj) id = episodeObj.id_episode;
  }

  // Check ID
  if (id === null) throw new NotFoundError('Not found');

  // Generate object to send over to scraper
  let reqObj = null;
  if (media.type === 'show') {
    reqObj = {
      slug: result.slug,
      episodeId: id,
      type: 'tv',
      ...data,
    };
  } else if (media.type === 'movie') {
    reqObj = {
      slug: result.slug,
      movieId: id,
      type: 'movie',
      ...data,
    };
  }

  if (!reqObj) throw new NotFoundError('Invalid media type');

  const videoUrl = await getVideoUrl(reqObj);
  return videoUrl;
}
