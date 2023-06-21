import { describe, expect, it } from 'vitest';
import { LOG } from '@/testing/oof';

describe('oof.ts', () => {
  it('should contain hello', () => {
    expect(LOG).toContain('hello');
  });
});
