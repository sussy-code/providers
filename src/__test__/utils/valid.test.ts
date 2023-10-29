import { makeStandardFetcher } from "@/fetchers/standardFetch";
import { makeProviders } from "@/main/builder";
import { targets } from "@/main/targets";
import { isValidStream } from "@/utils/valid";
import fetch from "node-fetch";
import { describe, it, expect } from "vitest";

describe('isValidStream()', () => {
  it('should pass valid streams', () => {
    expect(isValidStream({
      type: "file",
      flags: [],
      qualities: {
        "1080": {
          type: "mp4",
          url: "hello-world"
        }
      }
    })).toBe(true);
    expect(isValidStream({
      type: "hls",
      flags: [],
      playlist: "hello-world"
    })).toBe(true);
  });

  it('should detect empty qualities', () => {
    expect(isValidStream({
      type: "file",
      flags: [],
      qualities: {}
    })).toBe(false);
  });
  
  it('should detect empty stream urls', () => {
    expect(isValidStream({
      type: "file",
      flags: [],
      qualities: {
        "1080": {
          type: "mp4",
          url: "",
        }
      }
    })).toBe(false);
  });
    
  it('should detect emtpy HLS playlists', () => {
    expect(isValidStream({
      type: "hls",
      flags: [],
      playlist: "",
    })).toBe(false);
  });
});
