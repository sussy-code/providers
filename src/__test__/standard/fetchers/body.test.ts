import { serializeBody } from '@/fetchers/body';
import FormData from 'form-data';
import { describe, expect, it } from 'vitest';

describe('serializeBody()', () => {
  it('should work with standard text', () => {
    expect(serializeBody('hello world')).toEqual({
      headers: {},
      body: 'hello world',
    });
  });

  it('should work with objects', () => {
    expect(serializeBody({ hello: 'world', a: 42 })).toEqual({
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ hello: 'world', a: 42 }),
    });
  });

  it('should work x-www-form-urlencoded', () => {
    const obj = new URLSearchParams();
    obj.set('a', 'b');
    expect(serializeBody(obj)).toEqual({
      headers: {},
      body: obj,
    });
  });

  it('should work multipart/form-data', () => {
    const obj = new FormData();
    obj.append('a', 'b');
    expect(serializeBody(obj)).toEqual({
      headers: {},
      body: obj,
    });
  });
});
