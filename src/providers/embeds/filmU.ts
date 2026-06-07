import { makeEmbed } from '@/providers/base';
import { extractStream } from './_shared';

export const embedSuEmbed = makeEmbed({
  id: 'embed_su',
  name: 'EmbedSu',
  rank: 171,
  flags: [],
  async scrape(ctx) {
    const html = await ctx.proxiedFetcher<string>(ctx.url);
    return { stream: [extractStream(html)] };
  },
});

export const vidzenEmbed = makeEmbed({
  id: 'vidzen',
  name: 'VidZen',
  rank: 173,
  flags: [],
  async scrape(ctx) {
    const html = await ctx.proxiedFetcher<string>(ctx.url);
    return { stream: [extractStream(html)] };
  },
});

export const smashyEmbed = makeEmbed({
  id: 'smashy',
  name: 'Smashy',
  rank: 174,
  flags: [],
  async scrape(ctx) {
    const html = await ctx.proxiedFetcher<string>(ctx.url);
    return { stream: [extractStream(html)] };
  },
});

export const rivestreamEmbed = makeEmbed({
  id: 'rivestream',
  name: 'RiverStream',
  rank: 175,
  flags: [],
  async scrape(ctx) {
    const html = await ctx.proxiedFetcher<string>(ctx.url);
    return { stream: [extractStream(html)] };
  },
});

export const mappleEmbed = makeEmbed({
  id: 'mapple',
  name: 'Mapple',
  rank: 176,
  flags: [],
  async scrape(ctx) {
    const html = await ctx.proxiedFetcher<string>(ctx.url);
    return { stream: [extractStream(html)] };
  },
});

export const movies111Embed = makeEmbed({
  id: '111movies',
  name: '111Movies',
  rank: 177,
  flags: [],
  async scrape(ctx) {
    const html = await ctx.proxiedFetcher<string>(ctx.url);
    return { stream: [extractStream(html)] };
  },
});