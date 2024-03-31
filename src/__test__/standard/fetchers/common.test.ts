import { makeFullUrl } from '@/fetchers/common';
import { describe, expect, it } from 'vitest';

describe('makeFullUrl()', () => {
  it('should pass normal url if no options', () => {
    expect(makeFullUrl('https://example.com/hello/world')).toEqual('https://example.com/hello/world');
    expect(makeFullUrl('https://example.com/hello/world?a=b')).toEqual('https://example.com/hello/world?a=b');
    expect(makeFullUrl('https://example.com/hello/world?a=b#hello')).toEqual(
      'https://example.com/hello/world?a=b#hello',
    );
    expect(makeFullUrl('https://example.com/hello/world#hello')).toEqual('https://example.com/hello/world#hello');
  });

  it('should append baseurl correctly', () => {
    const correctResult = 'https://example.com/hello/world';
    expect(makeFullUrl(correctResult, { baseUrl: '' })).toEqual(correctResult);
    expect(makeFullUrl('/hello/world', { baseUrl: 'https://example.com' })).toEqual(correctResult);
    expect(makeFullUrl('/hello/world', { baseUrl: 'https://example.com/' })).toEqual(correctResult);
    expect(makeFullUrl('hello/world', { baseUrl: 'https://example.com/' })).toEqual(correctResult);
    expect(makeFullUrl('hello/world', { baseUrl: 'https://example.com' })).toEqual(correctResult);
    expect(makeFullUrl('/world', { baseUrl: 'https://example.com/hello' })).toEqual(correctResult);
    expect(makeFullUrl('/world', { baseUrl: 'https://example.com/hello/' })).toEqual(correctResult);
    expect(makeFullUrl('world', { baseUrl: 'https://example.com/hello/' })).toEqual(correctResult);
    expect(makeFullUrl('world', { baseUrl: 'https://example.com/hello' })).toEqual(correctResult);
    expect(makeFullUrl('world?a=b', { baseUrl: 'https://example.com/hello' })).toEqual(
      'https://example.com/hello/world?a=b',
    );
  });

  it('should throw with invalid baseurl combinations', () => {
    expect(() => makeFullUrl('example.com/hello/world', { baseUrl: '' })).toThrowError();
    expect(() => makeFullUrl('/hello/world', { baseUrl: 'example.com' })).toThrowError();
    expect(() => makeFullUrl('/hello/world', { baseUrl: 'tcp://example.com' })).toThrowError();
    expect(() => makeFullUrl('/hello/world', { baseUrl: 'tcp://example.com' })).toThrowError();
  });

  it('should add/merge query parameters', () => {
    expect(makeFullUrl('https://example.com/hello/world', { query: { a: 'b' } })).toEqual(
      'https://example.com/hello/world?a=b',
    );
    expect(makeFullUrl('https://example.com/hello/world/', { query: { a: 'b' } })).toEqual(
      'https://example.com/hello/world/?a=b',
    );
    expect(makeFullUrl('https://example.com', { query: { a: 'b' } })).toEqual('https://example.com/?a=b');
    expect(makeFullUrl('https://example.com/', { query: { a: 'b' } })).toEqual('https://example.com/?a=b');

    expect(makeFullUrl('https://example.com/hello/world?c=d', { query: { a: 'b' } })).toEqual(
      'https://example.com/hello/world?c=d&a=b',
    );
    expect(makeFullUrl('https://example.com/hello/world?c=d', { query: {} })).toEqual(
      'https://example.com/hello/world?c=d',
    );
    expect(makeFullUrl('https://example.com/hello/world?c=d')).toEqual('https://example.com/hello/world?c=d');
    expect(makeFullUrl('https://example.com/hello/world?c=d', {})).toEqual('https://example.com/hello/world?c=d');
  });

  it('should work with a mix of multiple options', () => {
    expect(makeFullUrl('/hello/world?c=d', { baseUrl: 'https://example.com/', query: { a: 'b' } })).toEqual(
      'https://example.com/hello/world?c=d&a=b',
    );
  });
});
