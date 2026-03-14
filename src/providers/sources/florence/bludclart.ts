import { load } from 'cheerio';

import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

const SHOWBOX_BASE = 'https://www.showbox.media';
const FEBBOX_BASE = 'https://www.febbox.com';
const MEDIA_PROXY_API = 'https://media-proxy.oct-cdn.co/api/fetchMp4';

const PROXY_URLS = [
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
  'https://simple-proxy.spencerjamesdeal.workers.dev',
  'https://simple-proxy.starseekerdude.workers.dev',
  'https://simple-proxy.subhashgottumukkala17.workers.dev',
  'https://simple-proxy.suvigya-goyal.workers.dev',
  'https://simple-proxy.tusharkhandare007.workers.dev',
  'https://simple-proxy.valdezmarcjoshua.workers.dev',
  'https://simple-proxy.ytonlyamit.workers.dev',
  'https://simple-proxy2.tonyvu4913.workers.dev',
  'https://bruh.jerry5890.workers.dev',
  'https://c719dda0-simple-proxy.sylaxx95.workers.dev',
];

const REQUEST_HEADERS = {
  'user-agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'accept-language': 'en-US,en;q=0.5',
};

function proxyUrl(url: string): string {
  const randomProxy = PROXY_URLS[Math.floor(Math.random() * PROXY_URLS.length)];
  return `${randomProxy}/?destination=${encodeURIComponent(url)}`;
}

async function customFetcher(ctx: any, url: string, options?: any): Promise<any> {
  const proxiedUrl = proxyUrl(url);
  const res = await ctx.fetcher(proxiedUrl, options);
  if (typeof res === 'string' && (res.trim().startsWith('{') || res.trim().startsWith('['))) {
    try {
      return JSON.parse(res);
    } catch {
      return res;
    }
  }
  return res;
}

async function getShowboxId(ctx: any, query: string): Promise<{ id: string; slug: string } | undefined> {
  const searchUrl = `${SHOWBOX_BASE}/search?keyword=${encodeURIComponent(query)}`;

  for (let i = 0; i < 3; i++) {
    const response = await customFetcher(ctx, searchUrl, {
      headers: { ...REQUEST_HEADERS, referer: `${SHOWBOX_BASE}/` },
    });
    if (!response || typeof response !== 'string') continue;

    const $ = load(response);
    const el = $('.film-poster').first();
    let id = el.find('.film-poster-ahref').attr('data-id') || el.attr('data-movie-id');
    const href = el.find('.film-poster-ahref').attr('href') || el.find('a').attr('href');
    const slug = href ? href.split('/').pop() : undefined;

    if (!id && slug?.includes('-')) id = slug.split('-').pop();

    if (id && slug) return { id, slug };
  }
  return undefined;
}

async function getShareKey(ctx: any, id: string, slug: string, type: string): Promise<string | undefined> {
  const typeCode = type === 'tv' ? '2' : '1';
  const shareLinkUrl = `${SHOWBOX_BASE}/index/share_link?id=${id}&type=${typeCode}`;
  const referer = `${SHOWBOX_BASE}/${type === 'tv' ? 'tv' : 'movie'}/${slug}`;

  const response = await customFetcher(ctx, shareLinkUrl, {
    headers: { ...REQUEST_HEADERS, 'x-requested-with': 'XMLHttpRequest', referer },
  });

  const link =
    response?.data?.link ||
    response?.link ||
    (typeof response?.data === 'string' && response.data.includes('febbox') ? response.data : undefined);
  return link && typeof link === 'string' ? link.split('/').pop() : undefined;
}

async function findFileFid(ctx: any, shareKey: string, media: any): Promise<number | undefined> {
  const isShow = media.type === 'show';
  const listUrl = `${FEBBOX_BASE}/file/file_share_list?share_key=${shareKey}&pwd=&parent_id=0`;
  const rootData = await customFetcher(ctx, listUrl, { headers: REQUEST_HEADERS });
  let files = rootData?.data?.file_list || [];

  if (isShow) {
    const sNum = media.season.number;
    const seasonFolder = files.find(
      (f: any) => f.is_dir === 1 && f.file_name.toLowerCase().replace(/\s/g, '').includes(`season${sNum}`),
    );
    if (!seasonFolder) return undefined;

    const seasonUrl = `${FEBBOX_BASE}/file/file_share_list?share_key=${shareKey}&pwd=&parent_id=${seasonFolder.fid}`;
    const seasonData = await customFetcher(ctx, seasonUrl, { headers: REQUEST_HEADERS });
    files = seasonData?.data?.file_list || [];

    const epStr = `E${media.episode.number.toString().padStart(2, '0')}`;
    const episodeFile = files.find((f: any) => f.is_dir === 0 && f.file_name.toUpperCase().includes(epStr));
    return episodeFile?.fid;
  }

  const video = files
    .filter((f: any) => f.is_dir === 0)
    .sort((a: any, b: any) => (b.file_size_bytes || 0) - (a.file_size_bytes || 0))[0];
  return video?.fid;
}

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  const mediaType = ctx.media.type === 'show' ? 'tv' : 'movie';

  // 1. Get IDs (Using nullish coalescing to satisfy TS)
  const result = await getShowboxId(ctx, ctx.media.title);
  if (!result || !result.id || !result.slug) throw new NotFoundError('No Showbox ID found');

  // 2. Get Share Key
  const shareKey = await getShareKey(ctx, result.id, result.slug, mediaType);
  if (!shareKey) throw new NotFoundError('No Share Key found');

  // 3. Find FID
  const fid = await findFileFid(ctx, shareKey, ctx.media);
  if (!fid) throw new NotFoundError('No File ID found');

  // 4. Resolve Stream
  const response = await customFetcher(ctx, MEDIA_PROXY_API, {
    method: 'POST',
    headers: { ...REQUEST_HEADERS, 'content-type': 'application/json' },
    body: JSON.stringify({ fid, share_key: shareKey }),
  });

  const source = response?.sources?.find((s: any) => s.download_url.includes('.m3u8'));
  if (!source) throw new NotFoundError('No stream found');

  return {
    embeds: [],
    stream: [
      {
        id: 'primary',
        type: 'hls',
        playlist: source.download_url,
        flags: [flags.CORS_ALLOWED],
        captions: [],
        headers: { Referer: FEBBOX_BASE },
      },
    ],
  };
}

export const bludclartScraper = makeSourcerer({
  id: 'bludclart',
  name: 'Bludclart 🤝',
  rank: 202,
  disabled: false,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});
