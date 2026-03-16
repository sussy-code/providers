/* eslint-disable no-console */
import { load } from 'cheerio';

import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

const baseUrl = 'https://www3.animeflv.net';

async function searchAnimeFlv(ctx: ShowScrapeContext | MovieScrapeContext, title: string): Promise<string> {
  const searchUrl = `${baseUrl}/browse?q=${encodeURIComponent(title)}`;
  const html = await ctx.proxiedFetcher(searchUrl, {
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });
  const $ = load(html);

  const results = $('div.Container ul.ListAnimes li article');

  if (!results.length) throw new NotFoundError('No se encontró el anime en AnimeFLV');

  let animeUrl = '';
  results.each((_, el) => {
    const resultTitle = $(el).find('a h3').text().trim().toLowerCase();
    if (resultTitle === title.trim().toLowerCase()) {
      animeUrl = $(el).find('div.Description a.Button').attr('href') || '';
      return false; // salir del each
    }
  });

  if (!animeUrl) {
    animeUrl = results.first().find('div.Description a.Button').attr('href') || '';
  }
  if (!animeUrl) throw new NotFoundError('No se encontró el anime en AnimeFLV');

  const fullUrl = animeUrl.startsWith('http') ? animeUrl : `${baseUrl}${animeUrl}`;
  return fullUrl;
}

async function getEpisodes(
  ctx: ShowScrapeContext | MovieScrapeContext,
  animeUrl: string,
): Promise<{ number: number; url: string }[]> {
  const html = await ctx.proxiedFetcher(animeUrl, {
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });
  const $ = load(html);

  let episodes: { number: number; url: string }[] = [];
  $('script').each((_, script) => {
    const data = $(script).html() || '';
    if (data.includes('var anime_info =')) {
      const animeInfo = data.split('var anime_info = [')[1]?.split('];')[0];
      const animeUri = animeInfo?.split(',')[2]?.replace(/"/g, '').trim();
      const episodesRaw = data.split('var episodes = [')[1]?.split('];')[0];
      if (animeUri && episodesRaw) {
        const arrEpisodes = episodesRaw.split('],[');
        episodes = arrEpisodes.map((arrEp) => {
          const noEpisode = arrEp.replace('[', '').replace(']', '').split(',')[0];
          return {
            number: parseInt(noEpisode, 10),
            url: `${baseUrl}/ver/${animeUri}-${noEpisode}`,
          };
        });
      } else {
        console.log('[AnimeFLV] No se encontró animeUri o lista de episodios en el script');
      }
    }
  });

  if (episodes.length === 0) {
    console.log('[AnimeFLV] No se encontraron episodios');
  }
  return episodes;
}

async function getEmbeds(
  ctx: ShowScrapeContext | MovieScrapeContext,
  episodeUrl: string,
): Promise<{ [key: string]: string | undefined }> {
  const html = await ctx.proxiedFetcher(episodeUrl, {
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });
  const $ = load(html);

  // Busca el script que contiene la variable videos
  const script = $('script:contains("var videos =")').html();
  if (!script) return {};

  // Extrae el objeto videos usando regex
  const match = script.match(/var videos = (\{[\s\S]*?\});/);
  if (!match) return {};

  let videos: any = {};
  try {
    videos = JSON.parse(match[1]);
  } catch {
    return {};
  }

  // Busca StreamWish en SUB
  let streamwishJapanese: string | undefined;
  if (videos.SUB) {
    const sw = videos.SUB.find((s: any) => s.title?.toLowerCase() === 'sw');
    if (sw && (sw.url || sw.code)) {
      streamwishJapanese = sw.url || sw.code;
      if (streamwishJapanese && streamwishJapanese.startsWith('/e/')) {
        streamwishJapanese = `https://streamwish.to${streamwishJapanese}`;
      }
    }
  }

  // Busca Streamtape en LAT
  let streamtapeLatino: string | undefined;
  if (videos.LAT) {
    const stape = videos.LAT.find(
      (s: any) => s.title?.toLowerCase() === 'stape' || s.title?.toLowerCase() === 'streamtape',
    );
    if (stape && (stape.url || stape.code)) {
      streamtapeLatino = stape.url || stape.code;
      if (streamtapeLatino && streamtapeLatino.startsWith('/e/')) {
        streamtapeLatino = `https://streamtape.com${streamtapeLatino}`;
      }
    }
  }

  return {
    'streamwish-japanese': streamwishJapanese,
    'streamtape-latino': streamtapeLatino,
  };
}

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  const title = ctx.media.title;
  if (!title) throw new NotFoundError('Falta el título');
  console.log(`[AnimeFLV] Iniciando scraping para: ${title}`);

  const animeUrl = await searchAnimeFlv(ctx, title);

  let episodeUrl = animeUrl;

  if (ctx.media.type === 'show') {
    const episode = ctx.media.episode?.number;
    if (!episode) throw new NotFoundError('Faltan datos de episodio');

    const episodes = await getEpisodes(ctx, animeUrl);
    const ep = episodes.find((e) => e.number === episode);
    if (!ep) throw new NotFoundError(`No se encontró el episodio ${episode}`);

    episodeUrl = ep.url;
  } else if (ctx.media.type === 'movie') {
    const html = await ctx.proxiedFetcher(animeUrl, {
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    const $ = load(html);

    let animeUri: string | null = null;
    $('script').each((_, script) => {
      const data = $(script).html() || '';
      if (data.includes('var anime_info =')) {
        const animeInfo = data.split('var anime_info = [')[1]?.split('];')[0];
        animeUri = animeInfo?.split(',')[2]?.replace(/"/g, '').trim() || null;
      }
    });

    if (!animeUri) throw new NotFoundError('No se pudo obtener el animeUri para la película');

    episodeUrl = `${baseUrl}/ver/${animeUri}-1`;
  }

  const embedsObj = await getEmbeds(ctx, episodeUrl);

  // Construye el array de embeds válidos
  const filteredEmbeds = Object.entries(embedsObj)
    .filter(([, url]) => typeof url === 'string' && !!url)
    .map(([embedId, url]) => ({ embedId, url: url as string }));

  if (filteredEmbeds.length === 0) {
    throw new NotFoundError('No se encontraron streams válidos');
  }

  return { embeds: filteredEmbeds };
}

export const animeflvScraper = makeSourcerer({
  id: 'animeflv',
  name: 'AnimeFLV',
  rank: 10,
  disabled: false,
  flags: [flags.CORS_ALLOWED],
  scrapeShow: comboScraper,
  scrapeMovie: comboScraper,
});

// made by @moonpic
