import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';

async function filmuCombo(
  ctx: ShowScrapeContext | MovieScrapeContext
): Promise<SourcererOutput> {
  const id = ctx.media.tmdbId;

  const season =
    ctx.media.type === 'show' ? ctx.media.season.number : null;
  const episode =
    ctx.media.type === 'show' ? ctx.media.episode.number : null;

  const embeds = [];

  if (ctx.media.type === 'movie') {
    embeds.push(
      { embedId: 'vidsrc', url: `https://vidsrc.cc/v2/embed/movie/${id}` },
      { embedId: 'embed_su', url: `https://embed.su/embed/movie/${id}` },
      { embedId: 'autoembed', url: `https://player.autoembed.cc/embed/movie/${id}` },
      { embedId: 'vidfast', url: `https://vidfast.pro/movie/${id}` },
      { embedId: 'vidzen', url: `https://vidzen.fun/movie/${id}` },
      { embedId: 'rivestream', url: `https://rivestream.net/embed?type=movie&id=${id}` },
    );
  } else {
    embeds.push(
      { embedId: 'vidsrc', url: `https://vidsrc.cc/v2/embed/tv/${id}/${season}/${episode}` },
      { embedId: 'vidsrc_vip', url: `https://vidsrc.vip/embed/tv?tmdb=${id}&season=${season}&episode=${episode}` },
      { embedId: 'embed_su', url: `https://embed.su/embed/tv/${id}/${season}/${episode}` },
      { embedId: 'autoembed', url: `https://player.autoembed.cc/embed/tv/${id}/${season}/${episode}` },
      { embedId: 'vidfast', url: `https://vidfast.pro/tv/${id}/${season}/${episode}` },
      { embedId: 'vidzen', url: `https://vidzen.fun/tv/${id}/${season}/${episode}` },
      { embedId: 'smashy', url: `https://player.smashy.stream/tv/${id}?s=${season}&e=${episode}` },
      { embedId: 'rivestream', url: `https://rivestream.net/embed?type=tv&id=${id}&season=${season}&episode=${episode}` },
      { embedId: 'vidsrc_icu', url: `https://vidsrc.icu/embed/tv?tmdb=${id}&season=${season}&episode=${episode}` },
      { embedId: 'mapple', url: `https://mapple.tv/embed/tv/${id}/${season}/${episode}` },
      { embedId: '111movies', url: `https://111movies.com/tv-shows/${id}/${season}/${episode}/` },
    );
  }

  return { embeds };
}

export const filmuScraper = makeSourcerer({
  id: 'Filmu',
  name: 'Filmu Aggregator',
  rank: 98,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: filmuCombo,
  scrapeShow: filmuCombo,
});