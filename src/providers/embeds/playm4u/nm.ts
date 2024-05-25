import { load } from 'cheerio';
import crypto from 'crypto-js';

import { makeEmbed } from '@/providers/base';

const { AES, MD5 } = crypto;

// I didn't even care to take a look at the code
// it poabably could be better,
// i don't care
// Thanks Paradox_77
function mahoaData(input: string, key: string) {
  const a = AES.encrypt(input, key).toString();

  const b = a
    .replace('U2FsdGVkX1', '')
    .replace(/\//g, '|a')
    .replace(/\+/g, '|b')
    .replace(/\\=/g, '|c')
    .replace(/\|/g, '-z');
  return b;
}

function caesarShift(str: string, amount: number) {
  if (amount < 0) {
    return caesarShift(str, amount + 26);
  }
  let output = '';
  for (let i = 0; i < str.length; i++) {
    let c = str[i];
    if (c.match(/[a-z]/i)) {
      const code = str.charCodeAt(i);
      if (code >= 65 && code <= 90) {
        c = String.fromCharCode(((code - 65 + amount) % 26) + 65);
      } else if (code >= 97 && code <= 122) {
        c = String.fromCharCode(((code - 97 + amount) % 26) + 97);
      }
    }
    output += c;
  }
  return output;
}

function stringToHex(tmp: string) {
  let str = '';
  for (let i = 0; i < tmp.length; i++) {
    str += tmp[i].charCodeAt(0).toString(16);
  }
  return str;
}

function generateResourceToken(idUser: string, idFile: string, domainRef: string) {
  const dataToken = stringToHex(
    caesarShift(mahoaData(`Win32|${idUser}|${idFile}|${domainRef}`, MD5('plhq@@@2022').toString()), 22),
  );
  const resourceToken = `${dataToken}|${MD5(`${dataToken}plhq@@@22`).toString()}`;
  return resourceToken;
}

const apiUrl = 'https://api-post-iframe-rd.playm4u.xyz/api/playiframe';

type apiRes = {
  status: number;
  // i only came across url-m3u8
  type: 'url-m3u8';
  data: string;
  cache: boolean;
  sub?: string | undefined;
  subs?: string | undefined;
};

export const playm4uNMScraper = makeEmbed({
  id: 'playm4u-nm',
  name: 'PlayM4U',
  rank: 240,
  scrape: async (ctx) => {
    // ex: https://play9str.playm4u.xyz/play/648f159ba3115a6f00744a16
    const mainPage$ = load(await ctx.proxiedFetcher<string>(ctx.url));

    const script = mainPage$(`script:contains("${apiUrl}")`).text();
    if (!script) throw new Error('Failed to get script');

    ctx.progress(50);

    const domainRef = 'https://ww2.m4ufree.tv';
    const idFile = script.match(/var\s?idfile\s?=\s?"(.*)";/im)?.[1];
    const idUser = script.match(/var\s?iduser\s?=\s?"(.*)";/im)?.[1];
    if (!idFile || !idUser) throw new Error('Failed to get ids');

    const charecters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789=+';

    const apiRes: apiRes = await ctx.proxiedFetcher<apiRes>(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        namekey: 'playm4u03',
        token: Array.from({ length: 100 }, () => charecters.charAt(Math.floor(Math.random() * charecters.length))).join(
          '',
        ),
        referrer: domainRef,
        data: generateResourceToken(idUser, idFile, domainRef),
      }),
    });

    if (!apiRes.data || apiRes.type !== 'url-m3u8') throw new Error('Failed to get the stream');

    ctx.progress(100);

    return {
      stream: [
        {
          id: 'primary',
          type: 'hls',
          playlist: apiRes.data,
          captions: [],
          flags: [],
        },
      ],
    };
  },
});
