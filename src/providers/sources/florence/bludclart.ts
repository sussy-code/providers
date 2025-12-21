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

const SHOWBOX_BASE = 'https://www.showbox.media';
const FEBBOX_BASE = 'https://www.febbox.com';
const MEDIA_PROXY_API = 'https://media-proxy.oct-cdn.co/api/fetchMp4';

const REQUEST_HEADERS = {
  'user-agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:145.0) Gecko/20100101 Firefox/145.0',
  accept: 'application/json, text/plain, */*',
  'accept-language': 'en-US,en;q=0.5',
  'accept-encoding': 'gzip, deflate, br, zstd',
  origin: 'https://watch.bludclart.com',
  referer: 'https://watch.bludclart.com/',
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'cross-site',
};

async function customFetcher(
  ctx: ShowScrapeContext | MovieScrapeContext,
  url: string,
  options: any = {},
  maxConcurrent = 4,
  timeoutMs = 7000,
): Promise<any> {
  const shuffled = [...PROXY_URLS].sort(() => 0.5 - Math.random());
  const ac = new AbortController();

  const fetchWithTimeout = async (proxy: string) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const proxied = `${proxy}/?destination=${encodeURIComponent(url)}`;
      const res = await ctx.fetcher(proxied, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(id);
      ac.abort(); 
      return res;
    } catch (err) {
      clearTimeout(id);
      throw err;
    }
  };

  for (let i = 0; i < shuffled.length; i += maxConcurrent) {
    const batch = shuffled.slice(i, i + maxConcurrent);
    const promises = batch.map((proxy) => fetchWithTimeout(proxy).catch(() => null));

    try {
      const winner = await Promise.race(
        promises.map((p) => p.then((res) => (res !== null ? res : new Promise(() => {})))),
      );
      if (winner !== undefined) return winner;
    } catch {}
  }

  throw new Error('All proxies failed');
}

async function getShowboxId(
  ctx: ShowScrapeContext | MovieScrapeContext,
  query: string,
  _mediaType: string,
): Promise<string | null> {
  const searchUrl = `${SHOWBOX_BASE}/search?keyword=${encodeURIComponent(query)}`;
  try {
    const response = await customFetcher(ctx, searchUrl, { headers: REQUEST_HEADERS });
    const $ = load(response);
    const results = $('.film-poster-ahref');
    if (results.length === 0) return null;

    let exactMatch: string | null = null;
    let startsWithMatch: string | null = null;
    let firstResult: string | null = `${SHOWBOX_BASE}${$(results[0]).attr('href')}`;

    const queryLower = query.toLowerCase();
    for (const result of results.toArray()) {
      const title = $(result).attr('title')?.trim()?.toLowerCase();
      const href = $(result).attr('href');
      if (title === queryLower) {
        exactMatch = `${SHOWBOX_BASE}${href}`;
        break;
      }
      if (!startsWithMatch && title?.startsWith(queryLower)) {
        startsWithMatch = `${SHOWBOX_BASE}${href}`;
      }
    }

    const targetUrl = exactMatch || startsWithMatch || firstResult;
    if (targetUrl) {
      const detailResponse = await customFetcher(ctx, targetUrl, { headers: REQUEST_HEADERS });
      const detail$ = load(detailResponse);
      const headingLink = detail$('h2.heading-name a');
      if (headingLink.length > 0) {
        return headingLink.attr('href')?.split('/').pop() || null;
      }
      const match = targetUrl.match(/-(\d+)$/);
      return match ? match[1] : null;
    }
  } catch {}
  return null;
}

async function getShareKey(
  ctx: ShowScrapeContext | MovieScrapeContext,
  showboxId: string,
  mediaType: string,
): Promise<string | null> {
  const typeCode = mediaType === 'tv' ? '2' : '1';
  const shareLinkUrl = `${SHOWBOX_BASE}/index/share_link?id=${showboxId}&type=${typeCode}`;
  try {
    const response = await customFetcher(ctx, shareLinkUrl, { headers: REQUEST_HEADERS });
    if (typeof response === 'object' && response !== null) {
      if ('data' in response && response.data && 'link' in response.data) {
        return (response.data as any).link.split('/').pop();
      }
      if ('link' in response) return (response as any).link.split('/').pop();
      if ('key' in response) return (response as any).key;
      if ('data' in response) {
        const val = (response as any).data;
        if (typeof val === 'string' && val.includes('febbox.com')) {
          return val.split('/').pop() || null;
        }
        return String(val);
      }
    }
    return String(response);
  } catch {
    return null;
  }
}

async function getFebboxFileList(ctx: any, shareKey: string, parentId = 0) {
  const url = `${FEBBOX_BASE}/file/file_share_list?share_key=${shareKey}&pwd=&parent_id=${parentId}`;
  return await customFetcher(ctx, url, { headers: REQUEST_HEADERS });
}

async function findFileFid(
  ctx: ShowScrapeContext | MovieScrapeContext,
  shareKey: string,
  mediaType: string,
  season?: number,
  episode?: number,
): Promise<number | null> {
  const rootData = await getFebboxFileList(ctx, shareKey);
  if (!rootData?.data?.file_list) return null;
  const files = rootData.data.file_list;

  if (mediaType === 'movie') {
    const videoFiles = files.filter((f: any) => f.ext && ['mp4', 'mkv', 'avi'].includes(f.ext.toLowerCase()));
    if (videoFiles.length === 0) return null;
    videoFiles.sort(
      (a: any, b: any) => parseInt(b.file_size_bytes || '0', 10) - parseInt(a.file_size_bytes || '0', 10),
    );
    return videoFiles[0].fid;
  }

  if (mediaType === 'tv' && season && episode) {
    const seasonStr = `Season ${season}`;
    const seasonPad = `Season ${season.toString().padStart(2, '0')}`;
    let seasonFid: number | null = null;

    for (const f of files) {
      if (f.is_dir === 1) {
        const name = f.file_name.trim();
        if (name.toLowerCase() === seasonStr.toLowerCase() || name.toLowerCase() === seasonPad.toLowerCase()) {
          seasonFid = f.fid;
          break;
        }
      }
    }

    if (!seasonFid) {
      const seasonRegex = new RegExp(`S0?${season}\\b`, 'i');
      for (const f of files) {
        if (f.is_dir === 1) {
          const name = f.file_name.trim();
          if (seasonRegex.test(name) && !/\b\d+\b.*season/i.test(name)) {
            seasonFid = f.fid;
            break;
          }
        }
      }
    }

    if (!seasonFid) return null;
    const seasonData = await getFebboxFileList(ctx, shareKey, seasonFid);
    if (!seasonData?.data?.file_list) return null;

    const epFiles = seasonData.data.file_list;
    const patterns = [
      new RegExp(`S0?${season}E0?${episode}\\b`, 'i'),
      new RegExp(`${season}x0?${episode}\\b`, 'i'),
      new RegExp(`E0?${episode}\\b`, 'i'),
      new RegExp(`\\b${episode}\\b`, 'i'),
    ];

    for (const f of epFiles) {
      if (f.is_dir === 0 && f.ext && ['mp4', 'mkv', 'avi'].includes(f.ext.toLowerCase())) {
        const name = f.file_name;
        if (patterns.some((p) => p.test(name))) return f.fid;
      }
    }
  }
  return null;
}

async function getStreamUrl(
  ctx: ShowScrapeContext | MovieScrapeContext,
  fid: number,
  shareKey: string,
): Promise<string | null> {
  const payload = { fid, share_key: shareKey, user_token: null };
  try {
    const response = await customFetcher(ctx, MEDIA_PROXY_API, {
      method: 'POST',
      headers: { ...REQUEST_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response?.sources?.length) {
      let sources = response.sources.filter(
        (s: any) => s.download_url.includes('.m3u8') && s.download_url.includes('hls.shegu.net'),
      );
      if (sources.length === 0) return null;

      const auto = sources.find((s: any) => s.quality.toUpperCase() === 'AUTO');
      if (auto) return auto.download_url;

      const rank = (q: string) => {
        const u = q.toUpperCase();
        if (u.includes('1080')) return 100;
        if (u.includes('720')) return 80;
        if (u === 'ORG') return 60;
        if (u.includes('480')) return 40;
        if (u.includes('360')) return 20;
        return 0;
      };

      sources.sort((a: any, b: any) => rank(b.quality) - rank(a.quality));
      return sources[0].download_url;
    }
  } catch {}
  return null;
}

async function scraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  ctx.progress(10);
  const isShow = ctx.media.type === 'show';
  const mediaType = isShow ? 'tv' : 'movie';
  const queryName = (ctx.media.title || '').replace(/and/gi, '&');

  const showboxId = await getShowboxId(ctx, queryName, mediaType);
  if (!showboxId) throw new NotFoundError('Showbox ID not found');

  const shareKey = await getShareKey(ctx, showboxId, mediaType);
  if (!shareKey) throw new NotFoundError('Share key not found');

  let fid: number | null;
  if (isShow) {
    const showCtx = ctx as ShowScrapeContext;
    fid = await findFileFid(ctx, shareKey, mediaType, showCtx.media.season.number, showCtx.media.episode.number);
  } else {
    fid = await findFileFid(ctx, shareKey, mediaType);
  }
  if (!fid) throw new NotFoundError('File ID not found');

  ctx.progress(50);
  const streamUrl = await getStreamUrl(ctx, fid, shareKey);
  if (!streamUrl) throw new NotFoundError('No stream found');
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
          Referer: FEBBOX_BASE,
        },
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
  scrapeMovie: scraper,
  scrapeShow: scraper,
});
