import { load } from 'cheerio';

import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

const PROXY_URLS = [
  'https://sky-simple-proxy.netlify.app',
  'https://simple-proxy.asteral-ss2.workers.dev',
  'https://pcors.shipwr3ck.workers.dev',
  'https://pstream-proxy.katelyn-boreham.workers.dev',
  'https://simple-proxy-pstream.mohamdaimn.workers.dev',
  'https://simple-proxy.adzel.workers.dev',
  'https://simple-proxy.agenteg1000.workers.dev',
  'https://simple-proxy.bmk77778888.workers.dev',
  'https://simple-proxy.cacayi.workers.dev',
  'https://simple-proxy.chayokefck.workers.dev',
  'https://simple-proxy.f6zc5kyfjn.workers.dev',
  'https://simple-proxy.febopo2221.workers.dev',
  'https://simple-proxy.garble.workers.dev',
  'https://simple-proxy.hydrovolter.workers.dev',
  'https://simple-proxy.issaoui-said-info.workers.dev',
  'https://simple-proxy.jacobalt.workers.dev',
  'https://simple-proxy.justinbdaludado.workers.dev',
  'https://simple-proxy.kllxcai-2e8.workers.dev',
  'https://simple-proxy.lloydsymonds.workers.dev',
  'https://simple-proxy.quantality.workers.dev',
  'https://simple-proxy.ratshrabies.workers.dev',
  'https://simple-proxy.remuxbay.workers.dev',
  'https://simple-proxy.six666666666666666666-6-6-6-6-6-6-6-6-6-6.workers.dev',
  'https://simple-proxy.spencerjamesdeal.workers.dev',
  'https://simple-proxy.starseekerdude.workers.dev',
  'https://simple-proxy.subhashgottumukkala17.workers.dev',
  'https://simple-proxy.suvigya-goyal.workers.dev',
  'https://simple-proxy.tusharkhandare007.workers.dev',
  'https://simple-proxy.valdezmarcjoshua.workers.dev',
  'https://simple-proxy.ytonlyamit.workers.dev',
  'https://simple-proxy2.tonyvu4913.workers.dev',
  'https://simple-proxyyy.thinner-life-void.workers.dev',
  'https://bruh.jerry5890.workers.dev',
  'https://c719dda0-simple-proxy.sylaxx95.workers.dev',
].map((url) => url.trim());

const LOOKMOVIE_BASE = 'https://lookmovie2.biz';

const BROWSER_HEADERS = {
  'user-agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'accept-language': 'en-US,en;q=0.9',
  'accept-encoding': 'gzip, deflate, br, zstd',
  'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
  'sec-fetch-dest': 'document',
  'sec-fetch-mode': 'navigate',
  'sec-fetch-site': 'same-origin',
  'upgrade-insecure-requests': '1',
};

async function fetchWithProxies(ctx: any, url: string): Promise<string> {
  const shuffled = [...PROXY_URLS].sort(() => 0.5 - Math.random());
  const ac = new AbortController();

  const tryOne = async (proxy: string) => {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 7000);
    try {
      const res = await ctx.fetcher(`${proxy}/?destination=${encodeURIComponent(url)}`, {
        headers: BROWSER_HEADERS,
        signal: ctrl.signal,
      });
      const text = await res.text();
      clearTimeout(to);
      ac.abort();
      return text;
    } catch {
      clearTimeout(to);
      throw new Error('fail');
    }
  };

  for (let i = 0; i < shuffled.length; i += 4) {
    const batch = shuffled.slice(i, i + 4);
    const promises = batch.map((p) => tryOne(p).catch(() => null));
    try {
      const winner = await Promise.race(promises.map((p) => p.then((r) => (r ? r : new Promise(() => {})))));
      if (winner) return winner;
    } catch {}
  }
  throw new Error('All proxies failed');
}

async function getStreamFromEmbed(ctx: MovieScrapeContext, embedUrl: string): Promise<string | null> {
  try {
    const html = await fetchWithProxies(ctx, embedUrl);
    const $ = load(html);

    let id: string | null = null;
    const match = embedUrl.match(/(?:embed-|\/e\/|id=)([a-zA-Z0-9]+)/);
    if (match) id = match[1];

    if (!id) {
      id = $('body').attr('data-id') || null;
      if (!id) {
        const scriptText = $('script').text();
        const m = scriptText.match(/video_id["']?\s*[:=]\s*["']?([a-zA-Z0-9]+)/);
        if (m) id = m[1];
      }
    }

    if (!id) return null;

    const infoUrl = `https://vidcloud.lol/api/videos/info/${id}`;
    const apiHeaders = {
      'user-agent': BROWSER_HEADERS['user-agent'],
      accept: 'application/json',
      origin: 'https://vidcloud.lol',
      referer: embedUrl,
    };

    const shuffled = [...PROXY_URLS].sort(() => 0.5 - Math.random());
    for (const proxy of shuffled) {
      try {
        const res = await ctx.fetcher(`${proxy}/?destination=${encodeURIComponent(infoUrl)}`, {
          headers: apiHeaders,
        });
        const data = await res.json();
        if (data?.sources?.length) {
          const hls = data.sources.find((s: any) => typeof s.file === 'string' && s.file.endsWith('.m3u8'));
          if (hls?.file) return hls.file;
        }
        if (typeof data?.hls === 'string') return data.hls;
      } catch {}
    }

    return null;
  } catch {
    return null;
  }
}

async function scraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  ctx.progress(10);

  if (ctx.media.type !== 'movie') {
    throw new NotFoundError('LookMovie2 only supports movies');
  }

  const query = ctx.media.title || '';
  const searchUrl = `${LOOKMOVIE_BASE}/?s=${encodeURIComponent(query)}`;
  const searchHtml = await fetchWithProxies(ctx, searchUrl);
  const $ = load(searchHtml);

  const detailUrl =
    $('.result-item a').first().attr('href') ||
    $('article a').first().attr('href') ||
    $('.title a').first().attr('href') ||
    null;

  if (!detailUrl) throw new NotFoundError('No result');

  ctx.progress(30);

  const detailHtml = await fetchWithProxies(ctx, detailUrl);
  const detail$ = load(detailHtml);

  const iframeSrc = detail$('iframe').first().attr('src') || null;
  if (!iframeSrc) throw new NotFoundError('No iframe found');

  let embedUrl: string;
  if (iframeSrc.startsWith('http')) {
    embedUrl = iframeSrc;
  } else if (iframeSrc.startsWith('//')) {
    embedUrl = `https:${iframeSrc}`;
  } else {
    embedUrl = new URL(iframeSrc, detailUrl).href;
  }

  ctx.progress(50);

  const streamUrl = await getStreamFromEmbed(ctx as MovieScrapeContext, embedUrl);
  if (!streamUrl) throw new NotFoundError('No stream resolved');

  ctx.progress(90);

  return {
    embeds: [],
    stream: [
      {
        id: 'primary',
        type: 'hls',
        playlist: streamUrl,
        flags: [flags.CORS_ALLOWED],
        captions: [],
        headers: {
          Referer: embedUrl,
        },
      },
    ],
  };
}

export const roseScraper = makeSourcerer({
  id: 'rose',
  name: 'Rosé 🌹',
  rank: 203,
  disabled: false,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: scraper,
  scrapeShow: () => Promise.reject(new NotFoundError('LookMovie2 only supports movies')),
});
