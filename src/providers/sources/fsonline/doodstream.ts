import * as cheerio from 'cheerio';
import type { CheerioAPI } from 'cheerio';

import { flags } from '@/entrypoint/utils/targets';
import { FetcherResponse } from '@/fetchers/types';
import { EmbedScrapeContext, ScrapeContext } from '@/utils/context';

import { ORIGIN_HOST, fetchIFrame, throwOnResponse } from './utils';
import { EmbedOutput } from '../../base';

const LOG_PREFIX = `[Doodstream]`;
const STREAM_REQ_PATERN = /\$\.get\('(\/pass_md5\/.+?)'/;
const TOKEN_PARAMS_PATERN = /\+ "\?(token=.+?)"/;

// This nonsense is added to the end of the URL alongside the token params
function generateStreamKey(): string {
  const CHARS: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let o = 0; o < 10; o++) {
    result += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return result;
}

function extractStreamInfo($: CheerioAPI): [string | undefined, string | undefined] {
  let streamReq: string | undefined;
  let tokenParams: string | undefined;

  $('script').each((_, script) => {
    if (streamReq && tokenParams) {
      return;
    }
    const text = $(script).text().trim();
    if (!streamReq) {
      streamReq = text.match(STREAM_REQ_PATERN)?.[1];
    }
    if (!tokenParams) {
      tokenParams = text.match(TOKEN_PARAMS_PATERN)?.[1];
    }
  });

  tokenParams = `${generateStreamKey()}?${tokenParams}${Date.now()}`;
  return [streamReq, tokenParams];
}

async function getStream(ctx: ScrapeContext, url: string): Promise<[string, string] | undefined> {
  // console.log(LOG_PREFIX, 'Fetching iframe');

  let $: CheerioAPI;
  let streamHost: string;
  let reqReferer: string;
  try {
    const response: FetcherResponse | undefined = await fetchIFrame(ctx, url);
    if (!response) {
      return undefined;
    }
    $ = cheerio.load(response.body);
    streamHost = new URL(response.finalUrl).hostname;
    reqReferer = response.finalUrl;
  } catch (error) {
    console.error(LOG_PREFIX, 'Failed to fetch iframe', error);
    return undefined;
  }

  const [streamReq, tokenParams] = extractStreamInfo($);
  if (!streamReq || !tokenParams) {
    console.error(LOG_PREFIX, "Couldn't find stream info", streamReq, tokenParams);
    return undefined;
  }
  // console.log(LOG_PREFIX, 'Stream info', streamReq, tokenParams);

  let streamURL: string;
  try {
    const response: FetcherResponse = await ctx.proxiedFetcher.full(`https://${streamHost}${streamReq}`, {
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        Referer: reqReferer,
        Origin: ORIGIN_HOST,
      },
    });
    throwOnResponse(response);
    streamURL = (await response.body) + tokenParams;
  } catch (error) {
    console.error(LOG_PREFIX, 'Failed to request stream URL', error);
    return undefined;
  }
  // console.log(LOG_PREFIX, 'Stream URL', streamURL);

  return [streamURL, new URL(streamURL).hostname];
}

export async function scrapeDoodstreamEmbed(ctx: EmbedScrapeContext): Promise<EmbedOutput> {
  // console.log(LOG_PREFIX, 'Scraping stream URL', ctx.url);
  let streamURL: string | undefined;
  let streamHost: string | undefined;
  try {
    const stream = await getStream(ctx, ctx.url);
    if (!stream || !stream[0]) {
      return {
        stream: [],
      };
    }
    [streamURL, streamHost] = stream;
  } catch (error) {
    console.warn(LOG_PREFIX, 'Failed to get stream', error);
    throw error;
  }
  return {
    stream: [
      {
        type: 'file',
        id: 'primary',
        flags: [flags.CORS_ALLOWED],
        captions: [],
        qualities: {
          unknown: {
            type: 'mp4',
            url: streamURL,
          },
        },
        headers: {
          Referer: `https://${streamHost}/`,
          Origin: ORIGIN_HOST,
        },
      },
    ],
  };
}
