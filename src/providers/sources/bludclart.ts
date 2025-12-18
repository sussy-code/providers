import { load } from 'cheerio';

import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

const PROXY_URLS = [
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
];

const SHOWBOX_BASE = 'https://www.showbox.lat';
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
  // Try up to 3 different proxies before falling back to direct access
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const proxiedUrl = proxyUrl(url);
      return await ctx.fetcher(proxiedUrl, options);
    } catch (error) {
      // If it's a 520 error (Cloudflare issue), try next proxy
      if (attempt < 2) continue;
      // On last proxy attempt failure, try direct access
      return ctx.proxiedFetcher(url, options);
    }
  }
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
      // Check for nested data
      if ('data' in data && typeof data.data === 'object' && data.data !== null && 'link' in data.data) {
        return (data.data as any).link.split('/').pop();
      }

      if ('link' in data) {
        // Maybe it returns a febbox link? https://www.febbox.com/share/KEY
        return (data as any).link.split('/').pop();
      }
      if ('key' in data) {
        return (data as any).key;
      }
      if ('data' in data) {
        // generic data field
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

    if (results.length === 0) {
      return null;
    }

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

      // Fallback: extract from URL
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
  const pidStr = parentId.toString();
  const listUrl = `${FEBBOX_BASE}/file/file_share_list?share_key=${shareKey}&pwd=&parent_id=${pidStr}`;

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
  if (!rootData || !rootData.data || !rootData.data.file_list) {
    return null;
  }

  const files = rootData.data.file_list;

  if (mediaType === 'movie') {
    const videoFiles = files.filter((f: any) => f.ext && ['mp4', 'mkv', 'avi'].includes(f.ext.toLowerCase()));
    if (videoFiles.length === 0) {
      return null;
    }

    videoFiles.sort(
      (a: any, b: any) => parseInt(b.file_size_bytes || '0', 10) - parseInt(a.file_size_bytes || '0', 10),
    );
    return videoFiles[0].fid;
  }

  if (mediaType === 'tv' && season && episode) {
    const seasonFolderName = `Season ${season}`;
    const seasonFolderNamePad = `Season ${season.toString().padStart(2, '0')}`;

    let seasonFid: number | null = null;
    for (const f of files) {
      if (f.is_dir === 1) {
        const fname = f.file_name.trim();
        if (
          fname.toLowerCase() === seasonFolderName.toLowerCase() ||
          fname.toLowerCase() === seasonFolderNamePad.toLowerCase()
        ) {
          seasonFid = f.fid;
          break;
        }
      }
    }

    if (!seasonFid) {
      for (const f of files) {
        if (f.is_dir === 1) {
          const fname = f.file_name.trim();
          const seasonRegex = new RegExp(`S0?${season}\\b`, 'i');
          const seasonOnlyRegex = new RegExp(`\\b${season}\\b.*season`, 'i');
          if (seasonRegex.test(fname) && !seasonOnlyRegex.test(fname)) {
            seasonFid = f.fid;
            break;
          }
        }
      }
    }

    if (!seasonFid) {
      return null;
    }

    const seasonData = await getFebboxFileList(ctx, shareKey, seasonFid);
    if (!seasonData || !seasonData.data || !seasonData.data.file_list) {
      return null;
    }

    const episodeFiles = seasonData.data.file_list;

    const episodePatterns = [
      new RegExp(`S0?${season}E0?${episode}\\b`, 'i'),
      new RegExp(`${season}x0?${episode}\\b`, 'i'),
      new RegExp(`E0?${episode}\\b`, 'i'),
      new RegExp(`\\b${episode}\\b`, 'i'), // Risky, might match other numbers
    ];

    for (const f of episodeFiles) {
      if (f.is_dir === 0 && f.ext && ['mp4', 'mkv', 'avi'].includes(f.ext.toLowerCase())) {
        const fname = f.file_name;
        for (const pattern of episodePatterns) {
          if (pattern.test(fname)) {
            return f.fid;
          }
        }
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

    if (response && response.sources && response.sources.length > 0) {
      const sources = response.sources;

      // Sort by quality ranking
      const qualityRank = (q: string): number => {
        const quality = q.toUpperCase();
        if (quality.includes('1080')) return 100;
        if (quality.includes('720')) return 80;
        if (quality === 'ORG') return 60;
        if (quality.includes('480')) return 40;
        if (quality.includes('360')) return 20;
        return 0;
      };

      sources.sort((a: any, b: any) => qualityRank(b.quality) - qualityRank(a.quality));
      return sources[0].download_url;
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
        type: 'hls' as const,
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
  disabled: true,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});
