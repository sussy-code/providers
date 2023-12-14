/* eslint-disable no-bitwise */
import { decode } from 'html-entities';

export const vidsrcBase = 'https://vidsrc.to';

export function keyPermutation(key: string, data: any): string {
  const state: number[] = Array.from(Array(256).keys());
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

function adecode(buffer: Buffer): Buffer {
  const keyBytes = Buffer.from('8z5Ag5wgagfsOuhz', 'utf-8');
  let j = 0;
  const s = Buffer.alloc(256).map((_, index) => index);

  for (let i = 0; i < 256; i += 1) {
    j = (j + s[i] + keyBytes[i % keyBytes.length]) & 0xff;
    [s[i], s[j]] = [s[j], s[i]];
  }

  const decoded = Buffer.alloc(buffer.length);
  let i = 0;
  let k = 0;

  for (let index = 0; index < buffer.length; index += 1) {
    i = (i + 1) & 0xff;
    k = (k + s[i]) & 0xff;
    [s[i], s[k]] = [s[k], s[i]];
    const t = (s[i] + s[k]) & 0xff;
    decoded[index] = buffer[index] ^ s[t];
  }

  return decoded;
}

export function decodeBase64UrlSafe(s: string) {
  const standardizedInput = s.replace('_', '/').replace('-', '+');

  const binaryData = Buffer.from(standardizedInput, 'base64');
  return Buffer.from(binaryData);
}

export function decryptSourceUrl(sourceUrl: string) {
  const encoded = decodeBase64UrlSafe(sourceUrl);
  const decoded = adecode(encoded);
  const decodedText = decoded.toString('utf-8');

  return decode(decodedText);
}
