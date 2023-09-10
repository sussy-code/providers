import { makeStandardFetcher } from "@/fetchers/standardFetch";
import { DefaultedFetcherOptions } from "@/fetchers/types";
import { Headers } from "node-fetch";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("makeStandardFetcher()", () => {
  const fetch = vi.fn();
  const fetcher = makeStandardFetcher(fetch);

  afterEach(() => {
    vi.clearAllMocks();
  });

  function setResult(type: "text" | "json", value: any) {
    if (type === 'text') return fetch.mockResolvedValueOnce({
      headers: new Headers({
        "content-type": "text/plain",
      }),
      text() { 
        return Promise.resolve(value);
      },
    });
    if (type === 'json') return fetch.mockResolvedValueOnce({
      headers: new Headers({
        "content-type": "application/json",
      }),
      json() {
        return Promise.resolve(value);
      },
    });
  }

  function expectFetchCall(ops: { inputUrl: string, input: DefaultedFetcherOptions, outputUrl?: string, output: any, outputBody: any }) {
    expect(fetcher(ops.inputUrl, ops.input)).resolves.toEqual(ops.outputBody);
    expect(fetch).toBeCalledWith(ops.outputUrl ?? ops.inputUrl, ops.output);
    vi.clearAllMocks();
  }

  it('should pass options through', () => {
    setResult("text", "hello world");
    expectFetchCall({
      inputUrl: "https://google.com",
      input: {
        method: "GET",
        query: {},
        headers: {
          "X-Hello": "world",
        },
      },
      outputUrl: "https://google.com/",
      output: {
        method: "GET",
        headers: {
          "X-Hello": "world",
        },
      },
      outputBody: "hello world"
    })
    setResult("text", "hello world");
    expectFetchCall({
      inputUrl: "https://google.com",
      input: {
        method: "GET",
        headers: {},
        query: {
          "a": 'b',
        }
      },
      outputUrl: "https://google.com/?a=b",
      output: {
        method: "GET",
        headers: {},
      },
      outputBody: "hello world"
    })
    setResult("text", "hello world");
    expectFetchCall({
      inputUrl: "https://google.com",
      input: {
        query: {},
        headers: {},
        method: "GET"
      },
      outputUrl: "https://google.com/",
      output: {
        method: "GET",
        headers: {},
      },
      outputBody: "hello world"
    })
  });

  it('should parse response correctly', () => {
    setResult("text", "hello world");
    expectFetchCall({
      inputUrl: "https://google.com/",
      input: {
        query: {},
        headers: {},
        method: "POST"
      },
      outputUrl: "https://google.com/",
      output: {
        method: "POST",
        headers: {},
      },
      outputBody: "hello world"
    })
    setResult("json", { hello: 42 });
    expectFetchCall({
      inputUrl: "https://google.com/",
      input: {
        query: {},
        headers: {},
        method: "POST"
      },
      outputUrl: "https://google.com/",
      output: {
        method: "POST",
        headers: {},
      },
      outputBody: { hello: 42 }
    })
  });
});
