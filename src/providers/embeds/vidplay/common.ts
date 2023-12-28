import { makeFullUrl } from '@/fetchers/common';
import { EmbedScrapeContext } from '@/utils/context';

export const vidplayBase = 'https://vidplay.site';

export function keyPermutation(key: string, data: any) {
  const state = Array.from(Array(256).keys());
  let index1 = 0;
  for (let i = 0; i < 256; i += 1) {
    index1 = (index1 + state[i] + key.charCodeAt(i % key.length)) % 256;
    const temp = state[i];
    state[i] = state[index1];
    state[index1] = temp;
  }
  index1 = 0;
  let index2 = 0;
  let finalKey = '';
  for (let char = 0; char < data.length; char += 1) {
    index1 = (index1 + 1) % 256;
    index2 = (index2 + state[index1]) % 256;
    const temp = state[index1];
    state[index1] = state[index2];
    state[index2] = temp;
    if (typeof data[char] === 'string') {
      finalKey += String.fromCharCode(data[char].charCodeAt(0) ^ state[(state[index1] + state[index2]) % 256]);
    } else if (typeof data[char] === 'number') {
      finalKey += String.fromCharCode(data[char] ^ state[(state[index1] + state[index2]) % 256]);
    }
  }
  return finalKey;
}

export const getDecryptionKeys = async (ctx: EmbedScrapeContext): Promise<string[]> => {
  const res = await ctx.fetcher<string>(
    'https://raw.githubusercontent.com/Claudemirovsky/worstsource-keys/keys/keys.json',
  );
  return JSON.parse(res);
};

export const getEncodedId = async (ctx: EmbedScrapeContext) => {
  const url = new URL(ctx.url);
  const id = url.pathname.replace('/e/', '');
  const keyList = await getDecryptionKeys(ctx);

  const decodedId = keyPermutation(keyList[0], id);
  const encodedResult = keyPermutation(keyList[1], decodedId);
  const base64 = btoa(encodedResult);
  return base64.replace('/', '_');
};

export const getFuTokenKey = async (ctx: EmbedScrapeContext) => {
  const id = await getEncodedId(ctx);
  const fuTokenRes = await ctx.proxiedFetcher<string>('/futoken', {
    baseUrl: vidplayBase,
    headers: {
      referer: ctx.url,
    },
  });
  const fuKey = fuTokenRes.match(/var\s+k\s*=\s*'([^']+)'/)?.[1];
  if (!fuKey) throw new Error('No fuKey found');
  const tokens = [];
  for (let i = 0; i < id.length; i += 1) {
    tokens.push(fuKey.charCodeAt(i % fuKey.length) + id.charCodeAt(i));
  }
  return `${fuKey},${tokens.join(',')}`;
};

export const getFileUrl = async (ctx: EmbedScrapeContext) => {
  const fuToken = await getFuTokenKey(ctx);
  return makeFullUrl(`/mediainfo/${fuToken}`, {
    baseUrl: vidplayBase,
    query: {
      ...Object.fromEntries(new URL(ctx.url).searchParams.entries()),
      autostart: 'true',
    },
  });
};
