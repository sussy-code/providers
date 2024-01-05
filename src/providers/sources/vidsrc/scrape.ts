import { load } from 'cheerio';

import { SourcererEmbed } from '@/providers/base';
import { streambucketScraper } from '@/providers/embeds/streambucket';
import { vidsrcembedScraper } from '@/providers/embeds/vidsrc';
import { vidsrcBase, vidsrcRCPBase } from '@/providers/sources/vidsrc/common';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';

function decodeSrc(encoded: string, seed: string) {
  let decoded = '';
  const seedLength = seed.length;

  for (let i = 0; i < encoded.length; i += 2) {
    const byte = parseInt(encoded.substr(i, 2), 16);
    const seedChar = seed.charCodeAt((i / 2) % seedLength);
    decoded += String.fromCharCode(byte ^ seedChar);
  }

  return decoded;
}

async function getVidSrcEmbeds(ctx: MovieScrapeContext | ShowScrapeContext, startingURL: string) {
  // VidSrc works by using hashes and a redirect system.
  // The hashes are stored in the html, and VidSrc will
  // make requests to their servers with the hash. This
  // will trigger a 302 response with a Location header
  // sending the user to the correct embed. To get the
  // real embed links, we must do the same. Slow, but
  // required

  const embeds: SourcererEmbed[] = [];

  let html = await ctx.proxiedFetcher<string>(startingURL, {
    baseUrl: vidsrcBase,
  });

  let $ = load(html);

  const sourceHashes = $('.server[data-hash]')
    .toArray()
    .map((el) => $(el).attr('data-hash'))
    .filter((hash) => hash !== undefined);

  for (const hash of sourceHashes) {
    html = await ctx.proxiedFetcher<string>(`/rcp/${hash}`, {
      baseUrl: vidsrcRCPBase,
      headers: {
        referer: vidsrcBase,
      },
    });

    $ = load(html);
    const encoded = $('#hidden').attr('data-h');
    const seed = $('body').attr('data-i');

    if (!encoded || !seed) {
      throw new Error('Failed to find encoded iframe src');
    }

    let redirectURL = decodeSrc(encoded, seed);
    if (redirectURL.startsWith('//')) {
      redirectURL = `https:${redirectURL}`;
    }

    const { finalUrl } = await ctx.proxiedFetcher.full(redirectURL, {
      method: 'HEAD',
      headers: {
        referer: vidsrcBase,
      },
    });

    const embed: SourcererEmbed = {
      embedId: '',
      url: finalUrl,
    };

    const parsedUrl = new URL(finalUrl);

    switch (parsedUrl.host) {
      case 'vidsrc.stream':
        embed.embedId = vidsrcembedScraper.id;
        break;
      case 'streambucket.net':
        embed.embedId = streambucketScraper.id;
        break;
      case '2embed.cc':
      case 'www.2embed.cc':
        // Just ignore this. This embed just sources from other embeds we can scrape as a 'source'
        break;
      case 'player-cdn.com':
        // Just ignore this. This embed streams video over a custom WebSocket connection
        break;
      default:
        throw new Error(`Failed to find VidSrc embed source for ${finalUrl}`);
    }

    // Since some embeds are ignored on purpose, check if a valid one was found
    if (embed.embedId !== '') {
      embeds.push(embed);
    }
  }

  return embeds;
}

export async function getVidSrcMovieSources(ctx: MovieScrapeContext) {
  return getVidSrcEmbeds(ctx, `/embed/${ctx.media.tmdbId}`);
}

export async function getVidSrcShowSources(ctx: ShowScrapeContext) {
  // VidSrc will always default to season 1 episode 1
  // no matter what embed URL is used. It sends back
  // a list of ALL the shows episodes, in order, for
  // all seasons. To get the real embed URL, have to
  // parse this from the response
  const html = await ctx.proxiedFetcher<string>(`/embed/${ctx.media.tmdbId}`, {
    baseUrl: vidsrcBase,
  });

  const $ = load(html);

  const episodeElement = $(`.ep[data-s="${ctx.media.season.number}"][data-e="${ctx.media.episode.number}"]`).first();
  if (episodeElement.length === 0) {
    throw new Error('failed to find episode element');
  }

  const startingURL = episodeElement.attr('data-iframe');
  if (!startingURL) {
    throw new Error('failed to find episode starting URL');
  }

  return getVidSrcEmbeds(ctx, startingURL);
}
