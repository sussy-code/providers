import { pArray, sBox0, sBox1, sBox2, sBox3 } from './constants';

class Blowfish {
  sBox0: number[];

  sBox1: number[];

  sBox2: number[];

  sBox3: number[];

  pArray: number[];

  keyStr: string;

  iv: string;

  constructor(t: string) {
    this.sBox0 = sBox0.slice();
    this.sBox1 = sBox1.slice();
    this.sBox2 = sBox2.slice();
    this.sBox3 = sBox3.slice();
    this.pArray = pArray.slice();
    this.keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    this.iv = 'abc12345';
    this.generateSubkeys(t);
  }

  encrypt(e: string) {
    const root = this.utf8Decode(e);
    let encrypted = '';
    const blockSize = 8;
    const paddingChar = '\0';
    const numBlocks = Math.ceil(e.length / blockSize);

    for (let i = 0; i < numBlocks; i++) {
      let block = root.substr(blockSize * i, blockSize);

      if (block.length < blockSize) {
        block += paddingChar.repeat(blockSize - block.length);
      }

      let [left, right] = this.split64by32(block);
      [left, right] = this.encipher(left, right);

      encrypted += this.num2block32(left) + this.num2block32(right);
    }

    return encrypted;
  }

  decrypt(input: string) {
    const numBlocks = Math.ceil(input.length / 8);
    let decrypted = '';
    for (let i = 0; i < numBlocks; i++) {
      const block = input.substr(8 * i, 8);
      if (block.length < 8) {
        throw new Error('Invalid block size');
      }
      const [left, right] = this.split64by32(block);
      const [decipheredLeft, decipheredRight] = this.decipher(left, right);
      decrypted += this.num2block32(decipheredLeft) + this.num2block32(decipheredRight);
    }
    return this.utf8Encode(decrypted);
  }

  substitute(value: number) {
    const t = value >>> 24;
    const n = (value << 8) >>> 24;
    const r = (value << 16) >>> 24;
    const i = (value << 24) >>> 24;
    let result = this.addMod32(this.sBox0[t], this.sBox1[n]);
    result = this.xor(result, this.sBox2[r]);
    result = this.addMod32(result, this.sBox3[i]);
    return result;
  }

  /* eslint-disable */
  encipher(plaintext: number, key: number) {
    for (var temp, round = 0; round < 16; round++) {
      temp = plaintext = this.xor(plaintext, this.pArray[round]);
      plaintext = key = this.xor(this.substitute(plaintext), key);
      key = temp;
    }
    temp = plaintext;
    plaintext = key;
    key = temp;
    key = this.xor(key, this.pArray[16]);

    return [(plaintext = this.xor(plaintext, this.pArray[17])), key];
  }
  /* eslint-enable */

  decipher(left: number, right: number) {
    let n;
    let e = left;
    let t = right;
    n = this.xor(e, this.pArray[17]);
    e = this.xor(t, this.pArray[16]);
    t = n;
    for (let r = 15; r >= 0; r--) {
      n = e;
      e = t;
      t = n;
      t = this.xor(this.substitute(e), t);
      e = this.xor(e, this.pArray[r]);
    }
    return [e, t];
  }

  generateSubkeys(key: string) {
    let temp;
    let keyIndex = 0;
    let pIndex = 0;
    for (let i = 0; i < 18; i++) {
      temp = 0;
      for (let j = 0; j < 4; j++) {
        temp = this.fixNegative((temp << 8) | key.charCodeAt(keyIndex));
        keyIndex = (keyIndex + 1) % key.length;
      }
      this.pArray[pIndex] = this.xor(this.pArray[pIndex], temp);
      pIndex++;
    }
    let tempSubkey = [0, 0];
    for (let i = 0; i < 18; i += 2) {
      tempSubkey = this.encipher(tempSubkey[0], tempSubkey[1]);
      this.pArray[i] = tempSubkey[0];
      this.pArray[i + 1] = tempSubkey[1];
    }
    for (let i = 0; i < 256; i += 2) {
      tempSubkey = this.encipher(tempSubkey[0], tempSubkey[1]);
      this.sBox0[i] = tempSubkey[0];
      this.sBox0[i + 1] = tempSubkey[1];
    }
    for (let i = 0; i < 256; i += 2) {
      tempSubkey = this.encipher(tempSubkey[0], tempSubkey[1]);
      this.sBox1[i] = tempSubkey[0];
      this.sBox1[i + 1] = tempSubkey[1];
    }
    for (let i = 0; i < 256; i += 2) {
      tempSubkey = this.encipher(tempSubkey[0], tempSubkey[1]);
      this.sBox2[i] = tempSubkey[0];
      this.sBox2[i + 1] = tempSubkey[1];
    }
    for (let i = 0; i < 256; i += 2) {
      tempSubkey = this.encipher(tempSubkey[0], tempSubkey[1]);
      this.sBox3[i] = tempSubkey[0];
      this.sBox3[i + 1] = tempSubkey[1];
    }
  }

  block32toNum(e: string) {
    return this.fixNegative(
      (e.charCodeAt(0) << 24) | (e.charCodeAt(1) << 16) | (e.charCodeAt(2) << 8) | e.charCodeAt(3),
    );
  }

  num2block32(e: number) {
    return (
      String.fromCharCode(e >>> 24) +
      String.fromCharCode((e << 8) >>> 24) +
      String.fromCharCode((e << 16) >>> 24) +
      String.fromCharCode((e << 24) >>> 24)
    );
  }

  xor(e: number, t: number) {
    return this.fixNegative(e ^ t);
  }

  addMod32(e: number, t: number) {
    return this.fixNegative((e + t) | 0);
  }

  fixNegative(e: number) {
    return e >>> 0;
  }

  split64by32(e: string) {
    const t = e.substring(0, 4);
    const n = e.substring(4, 8);
    return [this.block32toNum(t), this.block32toNum(n)];
  }

  utf8Decode(input: string) {
    let decoded = '';
    for (let i = 0; i < input.length; i++) {
      const charCode = input.charCodeAt(i);
      if (charCode < 128) {
        decoded += String.fromCharCode(charCode);
      } else if (charCode > 127 && charCode < 2048) {
        const firstCharCode = (charCode >> 6) | 192;
        const secondCharCode = (63 & charCode) | 128;
        decoded += String.fromCharCode(firstCharCode, secondCharCode);
      } else {
        const firstCharCode = (charCode >> 12) | 224;
        const secondCharCode = ((charCode >> 6) & 63) | 128;
        const thirdCharCode = (63 & charCode) | 128;
        decoded += String.fromCharCode(firstCharCode, secondCharCode, thirdCharCode);
      }
    }
    return decoded;
  }

  utf8Encode(input: string) {
    let encoded = '';
    let charCode;
    for (let i = 0; i < input.length; i++) {
      charCode = input.charCodeAt(i);
      if (charCode < 128) {
        encoded += String.fromCharCode(charCode);
      } else if (charCode > 191 && charCode < 224) {
        const secondCharCode = input.charCodeAt(i + 1);
        encoded += String.fromCharCode(((31 & charCode) << 6) | (63 & secondCharCode));
        i += 1;
      } else {
        const secondCharCode = input.charCodeAt(i + 1);
        const thirdCharCode = input.charCodeAt(i + 2);
        encoded += String.fromCharCode(((15 & charCode) << 12) | ((63 & secondCharCode) << 6) | (63 & thirdCharCode));
        i += 2;
      }
    }
    return encoded;
  }

  base64(e: string) {
    let t;
    let n;
    let r;
    let i;
    let o;
    let a;
    let s = '';
    let l = 0;
    const root = e.replace(/[^A-Za-z0-9\\+\\/=]/g, '');
    while (l < root.length) {
      t = (this.keyStr.indexOf(root.charAt(l++)) << 2) | ((i = this.keyStr.indexOf(root.charAt(l++))) >> 4);
      n = ((15 & i) << 4) | ((o = this.keyStr.indexOf(root.charAt(l++))) >> 2);
      r = ((3 & o) << 6) | (a = this.keyStr.indexOf(root.charAt(l++)));
      s += String.fromCharCode(t);
      if (o !== 64) {
        s += String.fromCharCode(n);
      }
      if (a !== 64) {
        s += String.fromCharCode(r);
      }
    }
    return s;
  }
}

export function getLinks(encryptedInput: string) {
  const key = encryptedInput.slice(-10);
  const data = encryptedInput.slice(0, -10);
  const cipher = new Blowfish(key);
  const decryptedData = cipher.decrypt(cipher.base64(data)).match(/.{1,5}/g);

  if (!decryptedData) {
    throw new Error('No links found');
  } else {
    return decryptedData;
  }
}
