// This file is based on https://github.com/Ciarands/vidsrc-to-resolver/blob/dffa45e726a4b944cb9af0c9e7630476c93c0213/vidsrc.py#L16
// Full credits to @Ciarands!

const DECRYPTION_KEY = '8z5Ag5wgagfsOuhz';

export const decodeBase64UrlSafe = (str: string) => {
  const standardizedInput = str.replace(/_/g, '/').replace(/-/g, '+');
  const decodedData = atob(standardizedInput);

  const bytes = new Uint8Array(decodedData.length);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = decodedData.charCodeAt(i);
  }

  return bytes;
};

export const decodeData = (key: string, data: any) => {
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
};

export const decryptSourceUrl = (sourceUrl: string) => {
  const encoded = decodeBase64UrlSafe(sourceUrl);
  const decoded = decodeData(DECRYPTION_KEY, encoded);
  return decodeURIComponent(decodeURIComponent(decoded));
};
