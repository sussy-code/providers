import { ScrapeMedia } from '@/entrypoint/utils/media';
import { Embed, Sourcerer, SourcererEmbed } from '@/providers/base';
import { buildProviders } from '@/entrypoint/builder';
import { describe, expect, it } from 'vitest';
import { makeStandardFetcher } from '@/fetchers/standardFetch';
import { ProviderControls } from '@/entrypoint/controls';
import { NotFoundError } from '@/utils/errors';
import { targets } from '@/entrypoint/utils/targets';
import { getBuiltinEmbeds } from '@/entrypoint/providers';
import { makeSimpleProxyFetcher } from '@/fetchers/simpleProxy';

export type TestTypes = 'standard' | 'ip:standard' | 'proxied';

export interface TestSourceOptions {
  source: Sourcerer;
  testSuite: ScrapeMedia[];
  types: TestTypes[];
  debug?: boolean;
  expect: {
    embeds?: number;
    streams?: number;
    error?: boolean;
    notfound?: boolean;
  };
}

function makeBaseProviders() {
  const builder = buildProviders().setTarget(targets.ANY).setFetcher(makeStandardFetcher(fetch));
  const embeds = getBuiltinEmbeds();
  embeds.forEach((embed) => builder.addEmbed(embed));
  return builder;
}

export function testSource(ops: TestSourceOptions) {
  if (ops.testSuite.length === 0) throw new Error('Test suite must have at least one test');
  describe(`source:${ops.source.id}`, () => {
    ops.testSuite.forEach((test) => {
      describe(`test ${test.title}`, () => {
        async function runTest(providers: ProviderControls) {
          let hasNotFound = false;
          let hasError = false;
          let streamCount = 0;
          let embedCount = 0;
          let embeds = [];
          try {
            const result = await providers.runSourceScraper({
              id: ops.source.id,
              media: test,
            });
            if (ops.debug) console.log(result);
            streamCount = (result.stream ?? []).length;
            embedCount = result.embeds.length;
          } catch (err) {
            if (ops.debug) console.log(err);
            if (err instanceof NotFoundError) hasNotFound = true;
            else hasError = true;
          }
          expect(ops.expect.error ?? false).toBe(hasError);
          expect(ops.expect.notfound ?? false).toBe(hasNotFound);
          expect(ops.expect.streams ?? 0).toBe(streamCount);
          expect(ops.expect.embeds ?? 0).toBe(embedCount);
        }

        if (ops.types.includes('standard')) {
          it(`standard`, async () => {
            const providers = makeBaseProviders().addSource(ops.source).build();
            await runTest(providers);
          });
        }

        if (ops.types.includes('ip:standard')) {
          it(`standard:ip`, async () => {
            const providers = makeBaseProviders().addSource(ops.source).enableConsistentIpForRequests().build();
            await runTest(providers);
          });
        }

        if (ops.types.includes('proxied')) {
          it(`proxied`, async () => {
            if (!process.env.MOVIE_WEB_PROXY_URL)
              throw new Error('Cant use proxied test without setting MOVIE_WEB_PROXY_URL env');
            const providers = makeBaseProviders()
              .addSource(ops.source)
              .setProxiedFetcher(makeSimpleProxyFetcher(process.env.MOVIE_WEB_PROXY_URL, fetch))
              .build();
            await runTest(providers);
          });
        }
      });
    });
  });
}
