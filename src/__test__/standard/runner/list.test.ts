import { mockEmbeds, mockSources } from '../providerTests.ts';
import { makeProviders } from '@/entrypoint/declare';
import { targets } from '@/entrypoint/utils/targets';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = await vi.hoisted(async () => (await import('../providerTests.ts')).makeProviderMocks());
vi.mock('@/providers/all', () => mocks);

describe('ProviderControls.listSources()', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return the source with movie type', () => {
    mocks.gatherAllSources.mockReturnValue([mockSources.fullSourceYMovie]);
    mocks.gatherAllEmbeds.mockReturnValue([]);
    const p = makeProviders({
      fetcher: null as any,
      target: targets.NATIVE,
    });
    expect(p.listSources()).toEqual([
      {
        type: 'source',
        id: 'y',
        rank: mockSources.fullSourceYMovie.rank,
        name: 'Y',
        mediaTypes: ['movie'],
      },
    ]);
  });

  it('should return the source with show type', () => {
    mocks.gatherAllSources.mockReturnValue([mockSources.fullSourceYShow]);
    mocks.gatherAllEmbeds.mockReturnValue([]);
    const p = makeProviders({
      fetcher: null as any,
      target: targets.NATIVE,
    });
    expect(p.listSources()).toEqual([
      {
        type: 'source',
        id: 'y',
        rank: mockSources.fullSourceYShow.rank,
        name: 'Y',
        mediaTypes: ['show'],
      },
    ]);
  });

  it('should return the source with both types', () => {
    mocks.gatherAllSources.mockReturnValue([mockSources.fullSourceZBoth]);
    mocks.gatherAllEmbeds.mockReturnValue([]);
    const p = makeProviders({
      fetcher: null as any,
      target: targets.NATIVE,
    });
    expect(p.listSources()).toEqual([
      {
        type: 'source',
        id: 'z',
        rank: mockSources.fullSourceZBoth.rank,
        name: 'Z',
        mediaTypes: ['movie', 'show'],
      },
    ]);
  });

  it('should return the sources in correct order', () => {
    mocks.gatherAllSources.mockReturnValue([mockSources.fullSourceYMovie, mockSources.fullSourceZBoth]);
    mocks.gatherAllEmbeds.mockReturnValue([]);
    const p1 = makeProviders({
      fetcher: null as any,
      target: targets.NATIVE,
    });
    const l1 = p1.listSources();
    expect(l1.map((v) => v.id).join(',')).toEqual('z,y');

    mocks.gatherAllSources.mockReturnValue([mockSources.fullSourceZBoth, mockSources.fullSourceYMovie]);
    mocks.gatherAllEmbeds.mockReturnValue([]);
    const p2 = makeProviders({
      fetcher: null as any,
      target: targets.NATIVE,
    });
    const l2 = p2.listSources();
    expect(l2.map((v) => v.id).join(',')).toEqual('z,y');
  });
});

describe('ProviderControls.getAllEmbedMetaSorted()', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return the correct embed format', () => {
    mocks.gatherAllSources.mockReturnValue([]);
    mocks.gatherAllEmbeds.mockReturnValue([mockEmbeds.fullEmbedX]);
    const p = makeProviders({
      fetcher: null as any,
      target: targets.NATIVE,
    });
    expect(p.listEmbeds()).toEqual([
      {
        type: 'embed',
        id: 'x',
        rank: mockEmbeds.fullEmbedX.rank,
        name: 'X',
      },
    ]);
  });

  it('should return the embeds in correct order', () => {
    mocks.gatherAllSources.mockReturnValue([]);
    mocks.gatherAllEmbeds.mockReturnValue([mockEmbeds.fullEmbedX, mockEmbeds.fullEmbedZ]);
    const p1 = makeProviders({
      fetcher: null as any,
      target: targets.NATIVE,
    });
    const l1 = p1.listEmbeds();
    expect(l1.map((v) => v.id).join(',')).toEqual('z,x');

    mocks.gatherAllSources.mockReturnValue([]);
    mocks.gatherAllEmbeds.mockReturnValue([mockEmbeds.fullEmbedZ, mockEmbeds.fullEmbedX]);
    const p2 = makeProviders({
      fetcher: null as any,
      target: targets.NATIVE,
    });
    const l2 = p2.listEmbeds();
    expect(l2.map((v) => v.id).join(',')).toEqual('z,x');
  });
});
