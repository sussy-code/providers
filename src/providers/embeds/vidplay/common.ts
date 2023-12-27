import { createCipheriv } from 'crypto';
import { Buffer } from 'node:buffer';

import { EmbedScrapeContext } from '@/utils/context';

export const vidplayBase = 'https://vidplay.site';

export const getDecryptionKeys = async (ctx: EmbedScrapeContext): Promise<string[]> => {
  const res = await ctx.fetcher<string>(
    'https://raw.githubusercontent.com/Claudemirovsky/worstsource-keys/keys/keys.json',
  );
  return JSON.parse(res);
};

// TODO: Fix this so its cross platform compatible
export const getEncodedId = async (ctx: EmbedScrapeContext) => {
  const id = ctx.url.split('/e/')[1].split('?')[0];
  const keys = await getDecryptionKeys(ctx);
  const c1 = createCipheriv('rc4', Buffer.from(keys[0]), '');
  const c2 = createCipheriv('rc4', Buffer.from(keys[1]), '');

  let input = Buffer.from(id);
  input = Buffer.concat([c1.update(input), c1.final()]);
  input = Buffer.concat([c2.update(input), c2.final()]);

  return input.toString('base64').replace('/', '_');
};

export const getFuTokenKey = async (ctx: EmbedScrapeContext) => {
  const id = await getEncodedId(ctx);
  console.log(`ENCODED ID: ${id}`);
  const fuTokenRes = await ctx.proxiedFetcher<string>('/futoken', {
    baseUrl: vidplayBase,
    headers: {
      referer: ctx.url,
    },
  });
  const fuKey = fuTokenRes.match(/var\s+k\s*=\s*'([^']+)'/)?.[1];
  console.log(`FU KEY: ${fuKey}`);
  if (!fuKey) throw new Error('No fuKey found');
  const tokens = [];
  for (let i = 0; i < id.length; i += 1) {
    tokens.push(fuKey.charCodeAt(i % fuKey.length) + id.charCodeAt(i));
  }
  console.log(`${fuKey},${tokens.join(',')}`);
  return `${fuKey},${tokens.join(',')}`;
};

export const getFileUrl = async (ctx: EmbedScrapeContext) => {
  console.log(ctx.url);
  const fuToken = await getFuTokenKey(ctx);
  return `${vidplayBase}/mediainfo/${fuToken}?${ctx.url.split('?')[1]}`;
};
