import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

const API_BASE = 'https://api.smashystream.top/api/v1';
const ENC_DEC_API = 'https://enc-dec.app/api';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Referer': 'https://smashystream.top/',
};

async function smashyScrapy(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  const { tmdbId, imdbId } = ctx.media;
  ctx.progress(5);

  const tokenRes = await ctx.fetcher<any>(`${ENC_DEC_API}/enc-vidstack`);
  const token = tokenRes?.result?.token;
  const userId = tokenRes?.result?.userId || tokenRes?.result?.user_id || 'none';

  if (!token) throw new NotFoundError('API Token unreachable');

  const players = [
    { name: 'Player SY', endpoint: 'videosmashyi', type: '1', idType: 'imdb' },
    { name: 'Player O',  endpoint: 'videoophim',   type: '2', idType: 'tmdb' },
    { name: 'Player F',  endpoint: 'videoff',      type: '2', idType: 'tmdb' },
  ];

  for (const player of players) {
    try {
      const id = player.idType === 'imdb' ? imdbId : tmdbId;
      if (!id) continue;

      const url = ctx.media.type === 'movie'
        ? `${API_BASE}/${player.endpoint}/${id}?token=${token}&user_id=${userId}`
        : `${API_BASE}/${player.endpoint}/${id}/${ctx.media.season.number}/${ctx.media.episode.number}?token=${token}&user_id=${userId}`;

      const res = await ctx.fetcher<any>(url, { headers: HEADERS });
      if (res?.success === false || res?.msg?.includes('not found')) continue;

      const encryptedData = player.type === '1' 
        ? (res?.data || res?.url) 
        : (res?.data?.sources?.[0]?.file || res?.data?.file || res?.file);

      if (!encryptedData) continue;

      let finalEncrypted = encryptedData;
      if (player.type === '1' && encryptedData.includes('/#')) {
        const [host, videoId] = encryptedData.split('/#');
        const syHost = host.startsWith('http') ? host : `https:${host}`;
        finalEncrypted = await ctx.fetcher<string>(`${syHost}/api/v1/video?id=${videoId}`, { 
          headers: { ...HEADERS, 'Referer': syHost + '/' } 
        });
      }

      const decrypted = await ctx.fetcher<any>(`${ENC_DEC_API}/dec-vidstack`, {
        method: 'POST',
        body: { text: finalEncrypted, type: player.type }
      });

      if (decrypted?.result) {
        let streamUrl = decrypted.result.trim();
        if (!streamUrl.startsWith('http')) streamUrl = `https:${streamUrl.startsWith('//') ? '' : '//'}${streamUrl}`;
        
        const isHls = streamUrl.toLowerCase().includes('.m3u8');
        
        // This specific branching ensures the runner validates the stream correctly
        if (isHls) {
          return {
            embeds: [],
            stream: [{
              id: `smashy-${player.endpoint}`,
              type: 'hls',
              playlist: streamUrl,
              flags: [flags.CORS_ALLOWED],
              captions: [],
              headers: {
                'Referer': 'https://smashystream.top/',
                'Origin': 'https://smashystream.top',
                'User-Agent': HEADERS['User-Agent']
              }
            }]
          };
        } else {
          return {
            embeds: [],
            stream: [{
              id: `smashy-${player.endpoint}`,
              type: 'file',
              flags: [flags.CORS_ALLOWED],
              captions: [],
              qualities: {
                unknown: {
                  type: 'mp4',
                  url: streamUrl,
                }
              } as any
            }]
          };
        }
      }
    } catch (e) {
      continue;
    }
  }

  throw new NotFoundError('No playable streams found');
}

export const smashyScraper = makeSourcerer({
  id: 'smashy',
  name: 'SmashyStream',
  rank: 94,
  disabled: true,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: smashyScrapy,
  scrapeShow: smashyScrapy,
});