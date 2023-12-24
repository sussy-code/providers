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
  name: 'A',
  rank: 1,
  disabled: false,
  flags: [],
} as Sourcerer;
const sourceB = {
  id: 'b',
  name: 'B',
  rank: 2,
  disabled: false,
  flags: [],
} as Sourcerer;
const sourceCDisabled = {
  id: 'c',
  name: 'C',
  rank: 3,
  disabled: true,
  flags: [],
} as Sourcerer;
const sourceAHigherRank = {
  id: 'a',
  name: 'A',
  rank: 100,
  disabled: false,
  flags: [],
} as Sourcerer;
const sourceGSameRankAsA = {
  id: 'g',
  name: 'G',
  rank: 1,
  disabled: false,
  flags: [],
} as Sourcerer;
const fullSourceYMovie = {
  id: 'y',
  name: 'Y',
  rank: 105,
  scrapeMovie: vi.fn(),
  flags: [],
} as Sourcerer;
const fullSourceYShow = {
  id: 'y',
  name: 'Y',
  rank: 105,
  scrapeShow: vi.fn(),
  flags: [],
} as Sourcerer;
const fullSourceZBoth = {
  id: 'z',
  name: 'Z',
  rank: 106,
  scrapeMovie: vi.fn(),
  scrapeShow: vi.fn(),
  flags: [],
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
