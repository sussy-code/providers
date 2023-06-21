import { LOG } from '@/testing/oof';

describe('oof.ts', () => {
  it('should contain hello', () => {
    expect(LOG).toContain('hello');
  });
});
