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

export const decode = (str: Uint8Array) => {
  const keyBytes = new TextEncoder().encode(DECRYPTION_KEY);

  let j = 0;
  const s = new Uint8Array(256);
  for (let i = 0; i < 256; i += 1) {
    s[i] = i;
  }

  for (let i = 0, k = 0; i < 256; i += 1) {
    j = (j + s[i] + keyBytes[k % keyBytes.length]) & 0xff;
    [s[i], s[j]] = [s[j], s[i]];
    k += 1;
  }

  const decoded = new Uint8Array(str.length);
  let i = 0;
  let k = 0;
  for (let index = 0; index < str.length; index += 1) {
    i = (i + 1) & 0xff;
    k = (k + s[i]) & 0xff;
    [s[i], s[k]] = [s[k], s[i]];
    const t = (s[i] + s[k]) & 0xff;
    decoded[index] = str[index] ^ s[t];
  }

  return decoded;
};

export const decryptSourceUrl = (sourceUrl: string) => {
  const encoded = decodeBase64UrlSafe(sourceUrl);
  const decoded = decode(encoded);
  const decodedText = new TextDecoder().decode(decoded);

  return decodeURIComponent(decodeURIComponent(decodedText));
};
