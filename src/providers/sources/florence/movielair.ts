import { load } from "cheerio";

import { flags } from "@/entrypoint/utils/targets";
import { SourcererOutput, makeSourcerer } from "@/providers/base";
import { MovieScrapeContext, ShowScrapeContext } from "@/utils/context";
import { NotFoundError } from "@/utils/errors";

const BASE = "https://movielair.cc";

const HEADERS = {
  "user-agent":
    "Mozilla/5.0 (X11; Linux x86_64) Gecko/20100101 Firefox/145.0",
  referer: BASE,
};

async function searchFirst(
  ctx: ShowScrapeContext | MovieScrapeContext,
  query: string
): Promise<string | null> {
  // IMPORTANT: /1 is required
  const url = `${BASE}/search/${encodeURIComponent(query)}/1`;

  const html = await ctx.proxiedFetcher(url, { headers: HEADERS });
  const $ = load(html);

  const first = $(".film-poster a").first().attr("href");
  if (!first) return null;

  return first;
}

function buildWatchUrl(
  ctx: ShowScrapeContext | MovieScrapeContext,
  path: string
) {
  const id = path.split("/").pop();

  if (ctx.media.type === "movie") {
    return `${BASE}/watch-movie/${id}`;
  }

  const season = (ctx as ShowScrapeContext).media.season.number;
  const episode = (ctx as ShowScrapeContext).media.episode.number;

  return `${BASE}/watch-tv/${id}?season=${season}&episode=${episode}`;
}

async function getIframe(
  ctx: ShowScrapeContext | MovieScrapeContext,
  watchUrl: string
) {
  const html = await ctx.proxiedFetcher(watchUrl, { headers: HEADERS });
  const $ = load(html);

  const iframe = $("iframe").attr("src");
  if (!iframe) return null;

  return iframe.startsWith("http") ? iframe : `https:${iframe}`;
}

async function extractStream(
  ctx: ShowScrapeContext | MovieScrapeContext,
  iframeUrl: string
) {
  const html = await ctx.proxiedFetcher(iframeUrl, { headers: HEADERS });

  const match = html.match(/file:\s*"(https?:\/\/[^"]+\.m3u8[^"]*)"/);
  if (match) return match[1];

  const match2 = html.match(/sources:\s*\[\{file:"([^"]+)"/);
  if (match2) return match2[1];

  return null;
}

async function movielairScraper(
  ctx: ShowScrapeContext | MovieScrapeContext
): Promise<SourcererOutput> {
  ctx.progress(10);

  const title = ctx.media.title;

  const path = await searchFirst(ctx, title);
  if (!path) throw new NotFoundError("MovieLair search failed");

  ctx.progress(30);

  const watchUrl = buildWatchUrl(ctx, path);

  ctx.progress(50);

  const iframe = await getIframe(ctx, watchUrl);
  if (!iframe) throw new NotFoundError("MovieLair iframe not found");

  ctx.progress(70);

  const stream = await extractStream(ctx, iframe);
  if (!stream) throw new NotFoundError("MovieLair stream not found");

  ctx.progress(90);

  return {
    embeds: [],
    stream: [
      {
        id: "primary",
        type: "hls" as const,
        playlist: stream,
        flags: [flags.CORS_ALLOWED],
        captions: [],
      },
    ],
  };
}

export const movielairScrape = makeSourcerer({
  id: "movielair",
  name: "MovieLair",
  rank: 30,
  disabled: true,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: movielairScraper,
  scrapeShow: movielairScraper,
});