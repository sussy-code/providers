import { load } from 'cheerio';

import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

const PROXY_URLS = [
  "https://simple-proxy.asteral-ss2.workers.dev",
  /**
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
**/
  ];

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

function proxyUrl(url: string): string {
  const randomProxy = PROXY_URLS[Math.floor(Math.random() * PROXY_URLS.length)];
  return `${randomProxy}/?destination=${encodeURIComponent(url)}`;
}

async function customFetcher(ctx: ShowScrapeContext | MovieScrapeContext, url: string, options?: any): Promise<any> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const proxiedUrl = proxyUrl(url);
      const response = await ctx.fetcher(proxiedUrl, options);

      // ✅ Detect Cloudflare "Just a moment..." challenge
      if (typeof response === 'string' && response.includes('<title>Just a moment')) {
        throw new Error('Cloudflare challenge');
      }

      return response;
    } catch (error) {
      if (attempt < 2) continue;
      return ctx.proxiedFetcher(url, options);
    }
  }
  throw new Error('All fetch attempts failed');
}

async function getShareKey(
  ctx: ShowScrapeContext | MovieScrapeContext,
  showboxId: string,
  mediaType: string,
): Promise<string | null> {
  const typeCode = mediaType === 'tv' ? '2' : '1';
  const shareLinkUrl = `${SHOWBOX_BASE}/index/share_link?id=${showboxId}&type=${typeCode}`;

  try {
    const response = await customFetcher(ctx, shareLinkUrl, {
      headers: REQUEST_HEADERS,
    });

    const data = response;

    if (typeof data === 'object' && data !== null) {
      if ('data' in data && typeof data.data === 'object' && data.data !== null && 'link' in data.data) {
        return (data.data as any).link.split('/').pop();
      }
      if ('link' in data) {
        return (data as any).link.split('/').pop();
      }
      if ('key' in data) {
        return (data as any).key;
      }
      if ('data' in data) {
        const val = (data as any).data;
        if (typeof val === 'string' && val.includes('febbox.com')) {
          return val.split('/').pop() || null;
        }
        return String(val);
      }
    }

    return String(data);
  } catch (error) {
    return null;
  }
}

async function getShowboxId(
  ctx: ShowScrapeContext | MovieScrapeContext,
  query: string,
  _mediaType: string,
): Promise<string | null> {
  const searchUrl = `${SHOWBOX_BASE}/search?keyword=${encodeURIComponent(query)}`;

  try {
    const response = await customFetcher(ctx, searchUrl, {
      headers: REQUEST_HEADERS,
    });

    const $ = load(response);
    const results = $('.film-poster-ahref');

    if (results.length === 0) return null;

    let targetUrl: string | null = null;
    for (const result of results.toArray()) {
      const title = $(result).attr('title')?.trim();
      const href = $(result).attr('href');

      if (title?.toLowerCase() === query.toLowerCase()) {
        targetUrl = `${SHOWBOX_BASE}${href}`;
        break;
      }
    }

    if (!targetUrl && results.length > 0) {
      const href = $(results[0]).attr('href');
      targetUrl = `${SHOWBOX_BASE}${href}`;
    }

    if (targetUrl) {
      const detailResponse = await customFetcher(ctx, targetUrl, {
        headers: REQUEST_HEADERS,
      });

      const detail$ = load(detailResponse);
      const headingLink = detail$('h2.heading-name a');

      if (headingLink.length > 0) {
        const href = headingLink.attr('href');
        const showId = href?.split('/').pop();
        return showId || null;
      }

      const match = targetUrl.match(/-(\d+)$/);
      if (match) {
        return match[1];
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

async function getFebboxFileList(
  ctx: ShowScrapeContext | MovieScrapeContext,
  shareKey: string,
  parentId: number = 0,
): Promise<any> {
  const listUrl = `${FEBBOX_BASE}/file/file_share_list?share_key=${shareKey}&pwd=&parent_id=${parentId}`;
  const response = await customFetcher(ctx, listUrl, {
    headers: REQUEST_HEADERS,
  });
  return response;
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
    const videoFiles = files.filter((f: any) =>
      f.ext && ['mp4', 'mkv', 'avi', 'm3u8'].includes(f.ext.toLowerCase())
    );
    if (videoFiles.length === 0) return null;

    videoFiles.sort(
      (a: any, b: any) => parseInt(b.file_size_bytes || '0', 10) - parseInt(a.file_size_bytes || '0', 10)
    );
    return videoFiles[0].fid;
  }

  if (mediaType === 'tv' && season != null && episode != null) {
    const seasonNames = [
      `Season ${season}`,
      `Season ${season.toString().padStart(2, '0')}`,
      `S${season.toString().padStart(2, '0')}`,
    ];

    let seasonFid: number | null = null;
    for (const f of files) {
      if (f.is_dir === 1) {
        const fname = f.file_name.trim();
        if (seasonNames.some(sn => fname.toLowerCase() === sn.toLowerCase())) {
          seasonFid = f.fid;
          break;
        }
      }
    }

    if (!seasonFid) {
      const seasonRegex = new RegExp(`\\b[Ss]?0?${season}\\b`, 'i');
      for (const f of files) {
        if (f.is_dir === 1 && seasonRegex.test(f.file_name)) {
          seasonFid = f.fid;
          break;
        }
      }
    }

    if (!seasonFid) return null;

    const seasonData = await getFebboxFileList(ctx, shareKey, seasonFid);
    if (!seasonData?.data?.file_list) return null;

    const episodeFiles = seasonData.data.file_list.filter(
      (f: any) => f.is_dir === 0 && f.ext && ['mp4', 'mkv', 'avi', 'm3u8'].includes(f.ext.toLowerCase())
    );

    const epStr = episode.toString().padStart(2, '0');
    const sStr = season.toString().padStart(2, '0');
    const patterns = [
      new RegExp(`[Ss]${sStr}[Ee]${epStr}`, 'i'),
      new RegExp(`${season}x${epStr}`, 'i'),
      new RegExp(`[Ee]${epStr}\\b`, 'i'),
    ];

    for (const f of episodeFiles) {
      const name = f.file_name;
      if (patterns.some(p => p.test(name))) {
        return f.fid;
      }
    }

    if (episodeFiles.length === 1) return episodeFiles[0].fid;
  }

  return null;
}

async function getStreamUrl(
  ctx: ShowScrapeContext | MovieScrapeContext,
  fid: number,
  shareKey: string,
): Promise<string | null> {
  const payload = {
    fid,
    share_key: shareKey,
    user_token: null,
  };

  try {
    const response = await customFetcher(ctx, MEDIA_PROXY_API, {
      method: 'POST',
      headers: {
        ...REQUEST_HEADERS,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response?.sources?.length) {
      const sources = [...response.sources];

      // ✅ Sort by quality
      const qualityRank = (q: string): number => {
        const Q = q.toUpperCase();
        if (Q.includes('1080')) return 100;
        if (Q.includes('720')) return 80;
        if (Q === 'ORG') return 60;
        if (Q.includes('480')) return 40;
        if (Q.includes('360')) return 20;
        return 0;
      };

      sources.sort((a: any, b: any) => qualityRank(b.quality) - qualityRank(a.quality));

      // ✅ CRITICAL FIX: Prefer .m3u8 URLs for HLS playback
      const hlsSource = sources.find(
        (s: any) => (s.url || s.download_url)?.endsWith('.m3u8')
      );

      const best = hlsSource || sources[0];
      return best.url || best.download_url;
    }

    return null;
  } catch (error) {
    return null;
  }
}

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  ctx.progress(10);

  const isShow = ctx.media.type === 'show';
  const mediaType = isShow ? 'tv' : 'movie';
  const queryName = (ctx.media.title || '').replace('and', '&');

  const showboxId = await getShowboxId(ctx, queryName, mediaType);
  if (!showboxId) {
    throw new NotFoundError('Could not find Showbox ID');
  }

  const shareKey = await getShareKey(ctx, showboxId, mediaType);
  if (!shareKey) {
    throw new NotFoundError('Could not get Share Key');
  }

  let fid: number | null;
  if (isShow) {
    const showCtx = ctx as ShowScrapeContext;
    fid = await findFileFid(ctx, shareKey, mediaType, showCtx.media.season.number, showCtx.media.episode.number);
  } else {
    fid = await findFileFid(ctx, shareKey, mediaType);
  }

  if (!fid) {
    throw new NotFoundError('Could not find file ID');
  }

  ctx.progress(50);

  const streamUrl = await getStreamUrl(ctx, fid, shareKey);
  if (!streamUrl) {
    throw new NotFoundError('No stream found');
  }

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