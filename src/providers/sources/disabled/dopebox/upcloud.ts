import * as cheerio from 'cheerio';

import { flags } from '@/entrypoint/utils/targets';
import { EmbedOutput } from '@/providers/base';
import { Stream } from '@/providers/streams';
import { EmbedScrapeContext } from '@/utils/context';
import { createM3U8ProxyUrl } from '@/utils/proxy';

import {
  BASE_URL,
  CLIENT_KEY_PATTERN_1,
  CLIENT_KEY_PATTERN_2,
  CLIENT_KEY_PATTERN_3,
  FETCH_EMBEDS_URL,
  FETCH_SOURCES_URL,
} from './utils';

async function getEmbedLink(ctx: EmbedScrapeContext, playerURL: string): Promise<string> {
  const sourceID = playerURL.split('.').pop();
  const response = await ctx.proxiedFetcher.full(`${FETCH_EMBEDS_URL}${sourceID}`, {
    headers: {
      Referer: playerURL,
      'X-Requested-With': 'XMLHttpRequest',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
    },
  });
  return response.body.link;
}

async function getClientKey(ctx: EmbedScrapeContext, embedURL: string): Promise<string | undefined> {
  const response = await ctx.proxiedFetcher.full(embedURL, {
    headers: {
      Referer: `${BASE_URL}/`,
      'Sec-Fetch-Dest': 'iframe',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'cross-site',
    },
  });
  const $ = cheerio.load(response.body);

  let key: string | undefined = '';
  // script containing key (either plain or encoded)
  $('script').each((_, script) => {
    if (key) {
      return false;
    }
    const text = $(script).text().trim();

    // encoded key
    let match = CLIENT_KEY_PATTERN_2.exec(text);
    if (match) {
      key = match.slice(1).join('').trim();
      return;
    }

    // direct client key
    match = CLIENT_KEY_PATTERN_1.exec(text);
    if (!match) {
      // no key
      return;
    }
    key = match[1].trim();
  });

  // dummy script with key as attribute
  $('script').each((_, script) => {
    if (key) {
      return false;
    }
    const attr = $(script).attr('nonce');
    if (!attr) {
      return;
    }
    key = attr.trim();
  });

  // dummy div with key as attribute
  $('div').each((_, div) => {
    if (key) {
      return false;
    }
    const attr = $(div).attr('data-dpi');
    if (!attr) {
      return;
    }
    key = attr.trim();
  });

  // custom meta tag with key
  $('meta').each((_, meta) => {
    if (key) {
      return false;
    }
    const name = $(meta).attr('name')?.trim();
    const content = $(meta).attr('content')?.trim();
    if (!name || !content || name !== '_gg_fb') {
      return;
    }
    key = content.trim();
  });

  // comment containing key
  $('*')
    .contents()
    .each((_, node) => {
      if (key) {
        return false;
      }
      if (node.nodeType === 8) {
        const match = CLIENT_KEY_PATTERN_3.exec(node.nodeValue.trim());
        if (!match) {
          return;
        }
        key = match[1].trim();
      }
    });

  return key;
}

export async function scrapeUpCloudEmbed(ctx: EmbedScrapeContext): Promise<EmbedOutput> {
  const embedURL = URL.parse(await getEmbedLink(ctx, ctx.url));
  if (!embedURL) {
    throw new Error('Failed to get embed URL (invalid movie?)');
  }
  // console.log('Embed URL', embedURL.href);

  const embedID = embedURL.pathname.split('/').pop();
  if (!embedID) {
    throw new Error('Failed to get embed ID');
  }
  // console.log('Embed ID', embedID);

  const clientKey = await getClientKey(ctx, embedURL.href);
  if (!clientKey) {
    throw new Error('Failed to get client key');
  }
  // console.log('Client key', clientKey);

  const response = await ctx.proxiedFetcher.full(`${FETCH_SOURCES_URL}?id=${embedID}&_k=${clientKey}`, {
    headers: {
      Referer: embedURL.href,
      Origin: 'https://streameeeeee.site',
      'X-Requested-With': 'XMLHttpRequest',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
    },
  });

  if (!response.body.sources || response.body.sources.length === 0) {
    console.warn('Server gave no sources', response.body);
    return {
      stream: [],
    };
  }

  const streamHeaders = {
    Referer: 'https://streameeeeee.site/',
    Origin: 'https://streameeeeee.site',
  };

  return {
    stream: (response.body.sources as any[]).map((source: any, i: number): Stream => {
      return {
        type: 'hls',
        id: `stream-${i}`,
        flags: [flags.CORS_ALLOWED],
        captions: [],
        playlist: createM3U8ProxyUrl(source.file, ctx.features, streamHeaders),
        headers: streamHeaders,
      };
    }) as Stream[],
  };
}
