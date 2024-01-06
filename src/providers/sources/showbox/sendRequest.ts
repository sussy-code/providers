import CryptoJS from 'crypto-js';
import { customAlphabet } from 'nanoid';

import type { ScrapeContext } from '@/utils/context';

import { apiUrls, appId, appKey, key } from './common';
import { encrypt, getVerify } from './crypto';

const randomId = customAlphabet('1234567890abcdef');
const expiry = () => Math.floor(Date.now() / 1000 + 60 * 60 * 12);

export const sendRequest = async (ctx: ScrapeContext, data: object, altApi = false) => {
  const defaultData = {
    childmode: '0',
    app_version: '11.5',
    appid: appId,
    lang: 'en',
    expired_date: `${expiry()}`,
    platform: 'android',
    channel: 'Website',
  };
  const encryptedData = encrypt(
    JSON.stringify({
      ...defaultData,
      ...data,
    }),
  );
  const appKeyHash = CryptoJS.MD5(appKey).toString();
  const verify = getVerify(encryptedData, appKey, key);
  const body = JSON.stringify({
    app_key: appKeyHash,
    verify,
    encrypt_data: encryptedData,
  });
  const base64body = btoa(body);

  const formatted = new URLSearchParams();
  formatted.append('data', base64body);
  formatted.append('appid', '27');
  formatted.append('platform', 'android');
  formatted.append('version', '129');
  formatted.append('medium', 'Website');
  formatted.append('token', randomId(32));

  const requestUrl = altApi ? apiUrls[1] : apiUrls[0];

  const response = await ctx.proxiedFetcher<string>(requestUrl, {
    method: 'POST',
    headers: {
      Platform: 'android',
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'okhttp/3.2.0',
    },
    body: formatted,
  });
  return JSON.parse(response);
};
