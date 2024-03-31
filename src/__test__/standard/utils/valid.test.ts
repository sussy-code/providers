import { isValidStream } from '@/utils/valid';
import { describe, it, expect } from 'vitest';

describe('isValidStream()', () => {
  it('should pass valid streams', () => {
    expect(
      isValidStream({
        type: 'file',
        id: 'a',
        flags: [],
        captions: [],
        qualities: {
          '1080': {
            type: 'mp4',
            url: 'hello-world',
          },
        },
      }),
    ).toBe(true);
    expect(
      isValidStream({
        type: 'hls',
        id: 'a',
        flags: [],
        captions: [],
        playlist: 'hello-world',
      }),
    ).toBe(true);
  });

  it('should detect empty qualities', () => {
    expect(
      isValidStream({
        type: 'file',
        id: 'a',
        flags: [],
        captions: [],
        qualities: {},
      }),
    ).toBe(false);
  });

  it('should detect empty stream urls', () => {
    expect(
      isValidStream({
        type: 'file',
        id: 'a',
        flags: [],
        captions: [],
        qualities: {
          '1080': {
            type: 'mp4',
            url: '',
          },
        },
      }),
    ).toBe(false);
  });

  it('should detect emtpy HLS playlists', () => {
    expect(
      isValidStream({
        type: 'hls',
        id: 'a',
        flags: [],
        captions: [],
        playlist: '',
      }),
    ).toBe(false);
  });
});
