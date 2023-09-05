// eslint-disable-next-line import/no-extraneous-dependencies
import { vi } from 'vitest';

import { gatherAllEmbeds, gatherAllSources } from '@/providers/all';
import { Embed, Sourcerer } from '@/providers/base';

export function makeProviderMocks() {
  const embedsMock = vi.fn<Parameters<typeof gatherAllEmbeds>, ReturnType<typeof gatherAllEmbeds>>();
  const sourcesMock = vi.fn<Parameters<typeof gatherAllSources>, ReturnType<typeof gatherAllSources>>();
  return {
    gatherAllEmbeds: embedsMock,
    gatherAllSources: sourcesMock,
  };
}

const sourceA = {
  id: 'a',
  rank: 1,
  disabled: false,
} as Sourcerer;
const sourceB = {
  id: 'b',
  rank: 2,
  disabled: false,
} as Sourcerer;
const sourceCDisabled = {
  id: 'c',
  rank: 3,
  disabled: true,
} as Sourcerer;
const sourceAHigherRank = {
  id: 'a',
  rank: 100,
  disabled: false,
} as Sourcerer;
const sourceGSameRankAsA = {
  id: 'g',
  rank: 1,
  disabled: false,
} as Sourcerer;
const fullSourceYMovie = {
  id: 'y',
  name: 'Y',
  rank: 105,
  scrapeMovie: vi.fn(),
} as Sourcerer;
const fullSourceYShow = {
  id: 'y',
  name: 'Y',
  rank: 105,
  scrapeShow: vi.fn(),
} as Sourcerer;
const fullSourceZBoth = {
  id: 'z',
  name: 'Z',
  rank: 106,
  scrapeMovie: vi.fn(),
  scrapeShow: vi.fn(),
} as Sourcerer;

const embedD = {
  id: 'd',
  rank: 4,
  disabled: false,
} as Embed;
const embedA = {
  id: 'a',
  rank: 5,
  disabled: false,
} as Embed;
const embedEDisabled = {
  id: 'e',
  rank: 6,
  disabled: true,
} as Embed;
const embedDHigherRank = {
  id: 'd',
  rank: 4000,
  disabled: false,
} as Embed;
const embedFSameRankAsA = {
  id: 'f',
  rank: 5,
  disabled: false,
} as Embed;
const embedHSameRankAsSourceA = {
  id: 'h',
  rank: 1,
  disabled: false,
} as Embed;
const fullEmbedX = {
  id: 'x',
  name: 'X',
  rank: 104,
} as Embed;
const fullEmbedZ = {
  id: 'z',
  name: 'Z',
  rank: 109,
} as Embed;

export const mockSources = {
  sourceA,
  sourceB,
  sourceCDisabled,
  sourceAHigherRank,
  sourceGSameRankAsA,
  fullSourceYMovie,
  fullSourceYShow,
  fullSourceZBoth,
};

export const mockEmbeds = {
  embedA,
  embedD,
  embedDHigherRank,
  embedEDisabled,
  embedFSameRankAsA,
  embedHSameRankAsSourceA,
  fullEmbedX,
  fullEmbedZ,
};
