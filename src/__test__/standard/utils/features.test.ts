import { FeatureMap, Flags, flags, flagsAllowedInFeatures } from '@/entrypoint/utils/targets';
import { describe, it, expect } from 'vitest';

describe('flagsAllowedInFeatures()', () => {
  function checkFeatures(featureMap: FeatureMap, flags: Flags[], output: boolean) {
    expect(flagsAllowedInFeatures(featureMap, flags)).toEqual(output);
  }

  it('should check required correctly', () => {
    checkFeatures(
      {
        requires: [],
        disallowed: [],
      },
      [],
      true,
    );
    checkFeatures(
      {
        requires: [flags.CORS_ALLOWED],
        disallowed: [],
      },
      [flags.CORS_ALLOWED],
      true,
    );
    checkFeatures(
      {
        requires: [flags.CORS_ALLOWED],
        disallowed: [],
      },
      [],
      false,
    );
    checkFeatures(
      {
        requires: [flags.CORS_ALLOWED, flags.IP_LOCKED],
        disallowed: [],
      },
      [flags.CORS_ALLOWED, flags.IP_LOCKED],
      true,
    );
    checkFeatures(
      {
        requires: [flags.IP_LOCKED],
        disallowed: [],
      },
      [flags.CORS_ALLOWED],
      false,
    );
    checkFeatures(
      {
        requires: [flags.IP_LOCKED],
        disallowed: [],
      },
      [],
      false,
    );
  });

  it('should check disallowed correctly', () => {
    checkFeatures(
      {
        requires: [],
        disallowed: [],
      },
      [],
      true,
    );
    checkFeatures(
      {
        requires: [],
        disallowed: [flags.CORS_ALLOWED],
      },
      [],
      true,
    );
    checkFeatures(
      {
        requires: [],
        disallowed: [flags.CORS_ALLOWED],
      },
      [flags.CORS_ALLOWED],
      false,
    );
    checkFeatures(
      {
        requires: [],
        disallowed: [flags.CORS_ALLOWED],
      },
      [flags.IP_LOCKED],
      true,
    );
    checkFeatures(
      {
        requires: [],
        disallowed: [flags.CORS_ALLOWED, flags.IP_LOCKED],
      },
      [flags.CORS_ALLOWED],
      false,
    );
  });

  it('should pass mixed tests', () => {
    checkFeatures(
      {
        requires: [flags.CORS_ALLOWED],
        disallowed: [flags.IP_LOCKED],
      },
      [],
      false,
    );
    checkFeatures(
      {
        requires: [flags.CORS_ALLOWED],
        disallowed: [flags.IP_LOCKED],
      },
      [flags.CORS_ALLOWED],
      true,
    );
    checkFeatures(
      {
        requires: [flags.CORS_ALLOWED],
        disallowed: [flags.IP_LOCKED],
      },
      [flags.IP_LOCKED],
      false,
    );
    checkFeatures(
      {
        requires: [flags.CORS_ALLOWED],
        disallowed: [flags.IP_LOCKED],
      },
      [flags.IP_LOCKED, flags.CORS_ALLOWED],
      false,
    );
  });
});
