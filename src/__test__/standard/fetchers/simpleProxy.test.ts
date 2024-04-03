import { makeSimpleProxyFetcher } from '@/fetchers/simpleProxy';
import { DefaultedFetcherOptions, FetcherOptions } from '@/fetchers/types';
import { Headers } from 'node-fetch';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('makeSimpleProxyFetcher()', () => {
  const fetch = vi.fn();
  const fetcher = makeSimpleProxyFetcher('https://example.com/proxy', fetch);

  afterEach(() => {
    vi.clearAllMocks();
  });

  function setResult(type: 'text' | 'json', value: any) {
    if (type === 'text')
      return fetch.mockResolvedValueOnce({
        headers: new Headers({
          'content-type': 'text/plain',
        }),
        status: 204,
        url: 'test123',
        text() {
          return Promise.resolve(value);
        },
      });
    if (type === 'json')
      return fetch.mockResolvedValueOnce({
        headers: new Headers({
          'content-type': 'application/json',
        }),
        status: 204,
        url: 'test123',
        json() {
          return Promise.resolve(value);
        },
      });
  }

  function expectFetchCall(ops: {
    inputUrl: string;
    input: DefaultedFetcherOptions;
    outputUrl?: string;
    output: any;
    outputBody: any;
  }) {
    const prom = fetcher(ops.inputUrl, ops.input);
    expect((async () => (await prom).body)()).resolves.toEqual(ops.outputBody);
    expect((async () => Array.from((await prom).headers.entries()))()).resolves.toEqual(
      Array.from(new Headers().entries()),
    );
    expect((async () => (await prom).statusCode)()).resolves.toEqual(204);
    expect((async () => (await prom).finalUrl)()).resolves.toEqual('test123');
    expect(fetch).toBeCalledWith(ops.outputUrl ?? ops.inputUrl, ops.output);
    vi.clearAllMocks();
  }

  it('should pass options through', () => {
    setResult('text', 'hello world');
    expectFetchCall({
      inputUrl: 'https://google.com',
      input: {
        method: 'GET',
        query: {},
        readHeaders: [],
        headers: {
          'X-Hello': 'world',
        },
      },
      outputUrl: `https://example.com/proxy?destination=${encodeURIComponent('https://google.com/')}`,
      output: {
        method: 'GET',
        headers: {
          'X-Hello': 'world',
        },
      },
      outputBody: 'hello world',
    });
    setResult('text', 'hello world');
    expectFetchCall({
      inputUrl: 'https://google.com',
      input: {
        method: 'GET',
        headers: {},
        readHeaders: [],
        query: {
          a: 'b',
        },
      },
      outputUrl: `https://example.com/proxy?destination=${encodeURIComponent('https://google.com/?a=b')}`,
      output: {
        method: 'GET',
        headers: {},
      },
      outputBody: 'hello world',
    });
    setResult('text', 'hello world');
    expectFetchCall({
      inputUrl: 'https://google.com',
      input: {
        method: 'GET',
        query: {},
        readHeaders: [],
        headers: {},
      },
      outputUrl: `https://example.com/proxy?destination=${encodeURIComponent('https://google.com/')}`,
      output: {
        method: 'GET',
        headers: {},
      },
      outputBody: 'hello world',
    });
  });

  it('should parse response correctly', () => {
    setResult('text', 'hello world');
    expectFetchCall({
      inputUrl: 'https://google.com/',
      input: {
        method: 'POST',
        query: {},
        readHeaders: [],
        headers: {},
      },
      outputUrl: `https://example.com/proxy?destination=${encodeURIComponent('https://google.com/')}`,
      output: {
        method: 'POST',
        headers: {},
      },
      outputBody: 'hello world',
    });
    setResult('json', { hello: 42 });
    expectFetchCall({
      inputUrl: 'https://google.com/',
      input: {
        method: 'POST',
        query: {},
        readHeaders: [],
        headers: {},
      },
      outputUrl: `https://example.com/proxy?destination=${encodeURIComponent('https://google.com/')}`,
      output: {
        method: 'POST',
        headers: {},
      },
      outputBody: { hello: 42 },
    });
  });
});
