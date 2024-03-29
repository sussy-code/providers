import { sendRequest } from '@/providers/sources/showbox/sendRequest';
import { StreamFile } from '@/providers/streams';
import { ScrapeContext } from '@/utils/context';

const allowedQualities = ['360', '480', '720', '1080', '4k'];

interface FebboxQuality {
  path: string;
  real_quality: string;
  fid?: number;
}

function mapToQuality(quality: FebboxQuality): FebboxQuality | null {
  const q = quality.real_quality.replace('p', '').toLowerCase();
  if (!allowedQualities.includes(q)) return null;
  return {
    real_quality: q,
    path: quality.path,
    fid: quality.fid,
  };
}

function removeBadUrlParams(url: string): string {
  const urlObject = new URL(url);

  const urlSearchParams = new URLSearchParams(urlObject.search);

  const keysToKeep = ['KEY1', 'KEY2'];
  for (const key of Array.from(urlSearchParams.keys())) {
    if (!keysToKeep.includes(key)) {
      urlSearchParams.delete(key);
    }
  }

  return `${urlObject.origin}${urlObject.pathname}?${urlSearchParams.toString()}`;
}

export async function getStreamQualities(ctx: ScrapeContext, apiQuery: object) {
  const mediaRes: { list: FebboxQuality[] } = (await sendRequest(ctx, apiQuery)).data;

  const qualityMap = mediaRes.list.map((v) => mapToQuality(v)).filter((v): v is FebboxQuality => !!v);

  const qualities: Record<string, StreamFile> = {};

  allowedQualities.forEach((quality) => {
    const foundQuality = qualityMap.find((q) => q.real_quality === quality && q.path);
    if (foundQuality) {
      qualities[quality] = {
        type: 'mp4',
        url: removeBadUrlParams(foundQuality.path),
      };
    }
  });

  return {
    qualities,
    fid: mediaRes.list[0]?.fid,
  };
}
