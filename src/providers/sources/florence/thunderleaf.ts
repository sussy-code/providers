import { flags } from "@/entrypoint/utils/targets";
import { makeSourcerer, SourcererOutput } from "@/providers/base";
import { MovieScrapeContext, ShowScrapeContext } from "@/utils/context";
import { NotFoundError } from "@/utils/errors";

const API = "https://thunderleaf.onrender.com";

async function ThunderleafScraper(
  ctx: MovieScrapeContext | ShowScrapeContext
): Promise<SourcererOutput> {
  const tmdb = ctx.media.tmdbId;

  if (!tmdb) throw new NotFoundError("Missing TMDB");

  let url: string;

  if (ctx.media.type === "movie") {
    url = `${API}/movie/${tmdb}`;
  } else {
    url = `${API}/tv/${tmdb}/${ctx.media.season.number}/${ctx.media.episode.number}`;
  }

  const res = await fetch(url);
  const data = await res.json();

  if (!data.stream) {
    throw new NotFoundError("Stream not found");
  }

  const playlist: string = data.stream;

  return {
    embeds: [],
    stream: [
      {
        id: "primary",
        type: "hls" as const,
        playlist,
        flags: [flags.CORS_ALLOWED],
        captions: [],
        headers: {
          origin: "https://vidlink.pro",
          referer: "https://vidlink.pro/",
        },
      },
    ],
  };
}

export const thunderleafScraper = makeSourcerer({
  id: "thunderleaf",
  name: "Thunderleaf",
  rank: 171,
  disabled: false,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: ThunderleafScraper,
  scrapeShow: ThunderleafScraper,
});
