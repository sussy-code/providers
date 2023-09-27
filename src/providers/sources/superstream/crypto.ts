import CryptoJS from 'crypto-js';

import { iv, key } from './common';

export function encrypt(str: string) {
  return CryptoJS.TripleDES.encrypt(str, CryptoJS.enc.Utf8.parse(key), {
    iv: CryptoJS.enc.Utf8.parse(iv),
  }).toString();
}

export function getVerify(str: string, str2: string, str3: string) {
  if (str) {
    return CryptoJS.MD5(CryptoJS.MD5(str2).toString() + str3 + str).toString();
  }
  return null;
}
