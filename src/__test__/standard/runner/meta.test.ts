import { mockEmbeds, mockSources } from '../providerTests.ts';
import { makeProviders } from '@/entrypoint/declare';
import { targets } from '@/entrypoint/utils/targets';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = await vi.hoisted(async () => (await import('../providerTests.ts')).makeProviderMocks());
vi.mock('@/providers/all', () => mocks);

describe('ProviderControls.getMetadata()', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return null if not found', () => {
    mocks.gatherAllSources.mockReturnValue([]);
    mocks.gatherAllEmbeds.mockReturnValue([]);
    const p = makeProviders({
      fetcher: null as any,
      target: targets.NATIVE,
    });
    expect(p.getMetadata(':)')).toEqual(null);
  });

  it('should return correct source meta', () => {
    mocks.gatherAllSources.mockReturnValue([mockSources.fullSourceZBoth]);
    mocks.gatherAllEmbeds.mockReturnValue([]);
    const p = makeProviders({
      fetcher: null as any,
      target: targets.NATIVE,
    });
    expect(p.getMetadata(mockSources.fullSourceZBoth.id)).toEqual({
      type: 'source',
      id: 'z',
      name: 'Z',
      rank: mockSources.fullSourceZBoth.rank,
      mediaTypes: ['movie', 'show'],
    });
  });

  it('should return correct embed meta', () => {
    mocks.gatherAllSources.mockReturnValue([]);
    mocks.gatherAllEmbeds.mockReturnValue([mockEmbeds.fullEmbedX]);
    const p = makeProviders({
      fetcher: null as any,
      target: targets.NATIVE,
    });
    expect(p.getMetadata(mockEmbeds.fullEmbedX.id)).toEqual({
      type: 'embed',
      id: 'x',
      name: 'X',
      rank: mockEmbeds.fullEmbedX.rank,
    });
  });
});
