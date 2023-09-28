export const flags = {
  NO_CORS: 'no-cors',
} as const;

export type Flags = (typeof flags)[keyof typeof flags];

export const targets = {
  BROWSER: 'browser',
  NATIVE: 'native',
  ALL: 'all',
} as const;

export type Targets = (typeof targets)[keyof typeof targets];

export type FeatureMap = {
  requires: readonly Flags[];
};

export const targetToFeatures: Record<Targets, FeatureMap> = {
  browser: {
    requires: [flags.NO_CORS],
  },
  native: {
    requires: [],
  },
  all: {
    requires: [],
  },
} as const;

export function getTargetFeatures(target: Targets): FeatureMap {
  return targetToFeatures[target];
}

export function flagsAllowedInFeatures(features: FeatureMap, inputFlags: Flags[]): boolean {
  const hasAllFlags = features.requires.every((v) => inputFlags.includes(v));
  if (!hasAllFlags) return false;
  return true;
}
