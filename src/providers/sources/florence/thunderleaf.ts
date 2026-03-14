/* eslint-disable no-console */
/* eslint-disable import/no-extraneous-dependencies */

import puppeteer from 'puppeteer';

import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36';

async function ThunderleafScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  console.log('[Thunderleaf] Starting headless scraper');

  const tmdb = ctx.media.tmdbId;

  if (!tmdb) throw new NotFoundError('Missing TMDB');

  const pageUrl =
    ctx.media.type === 'movie'
      ? `https://vidlink.pro/movie/${tmdb}`
      : `https://vidlink.pro/tv/${tmdb}/${ctx.media.season.number}/${ctx.media.episode.number}`;

  console.log('[Thunderleaf] Opening page:', pageUrl);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setUserAgent(UA);

  let stream: string | null = null;

  /* capture network requests */
  page.on('request', (req) => {
    const url = req.url();

    if (url.includes('videostr')) {
      console.log('[Thunderleaf] Videostr request:', url);
    }

    if (url.includes('.m3u8')) {
      console.log('[Thunderleaf] M3U8 request:', url);

      if (!url.includes('playlist')) {
        console.log('[Thunderleaf] FINAL STREAM FOUND:', url);
        stream = url;
      }
    }
  });

  /* capture network responses */
  page.on('response', async (res) => {
    const url = res.url();

    if (url.includes('.m3u8') && !url.includes('playlist')) {
      console.log('[Thunderleaf] M3U8 response:', url);
      stream = url;
    }
  });

  await page.goto(pageUrl, {
    waitUntil: 'networkidle2',
    timeout: 60000,
  });

  /* wait for player network calls */
  await new Promise<void>((resolve) => {
    setTimeout(resolve, 8000);
  });

  await browser.close();

  if (!stream) {
    throw new NotFoundError('Thunderleaf stream not found');
  }

  console.log('[Thunderleaf] Raw stream:', stream);

  /* convert to Thunderleaf proxy */
  const proxiedStream = `https://thunderleaf12.online/proxy?url=${encodeURIComponent(stream)}`;

  console.log('[Thunderleaf] Proxied stream:', proxiedStream);

  return {
    embeds: [],
    stream: [
      {
        id: 'primary',
        type: 'hls',
        playlist: stream,
        flags: [flags.CORS_ALLOWED],
        captions: [],
        headers: {
          origin: 'https://vidlink.pro',
          referer: 'https://vidlink.pro/',
        },
      },
    ],
  };
}

export const thunderleafScraper = makeSourcerer({
  id: 'thunderleaf',
  name: 'Thunderleaf',
  rank: 171,
  disabled: false,
  flags: [flags.CORS_ALLOWED, flags.IP_LOCKED, flags.PROXY_BLOCKED],
  scrapeMovie: ThunderleafScraper,
  scrapeShow: ThunderleafScraper,
});
