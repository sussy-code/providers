import { buildProviders } from '@/entrypoint/builder';
import { ScrapeMedia } from '@/entrypoint/utils/media';
import { targets } from '@/entrypoint/utils/targets';
import { makeStandardFetcher } from '@/fetchers/standardFetch';
import { Embed, Sourcerer, SourcererEmbed } from '@/providers/base';
import { TestTypes } from './providerUtils';
import { describe, expect, it } from 'vitest';
import { ProviderControls } from '@/entrypoint/controls';
import { makeSimpleProxyFetcher } from '@/fetchers/simpleProxy';

export interface TestEmbedOptions {
  embed: Embed;
  source: Sourcerer;
  testSuite: ScrapeMedia[];
  types: TestTypes[];
  debug?: boolean;
  expect: {
    embeds: number;
    streams?: number;
    error?: boolean;
  };
}

function makeBaseEmbedProviders() {
  const builder = buildProviders().setTarget(targets.ANY).setFetcher(makeStandardFetcher(fetch));
  return builder;
}

export function testEmbed(ops: TestEmbedOptions) {
  if (ops.testSuite.length === 0) throw new Error('Test suite must have at least one test');
  describe(`embed:${ops.source.id}:${ops.embed.id}`, () => {
    ops.testSuite.forEach((test) => {
      describe(`test ${test.title}`, async () => {
        async function gatherEmbeds(providers: ProviderControls): Promise<SourcererEmbed[]> {
          const results = await providers.runSourceScraper({
            id: ops.source.id,
            media: test,
          });
          if (results.embeds.length !== ops.expect.embeds)
            throw new Error(
              `Embeds don't match expected amount of embeds (${ops.source.id}, ${ops.embed.id}, got ${results.embeds.length} but expected ${ops.expect.embeds})`,
            );
          return results.embeds;
        }

        async function runTest(providers: ProviderControls, embedUrl: string) {
          let hasError = false;
          let streamCount = 0;
          try {
            const result = await providers.runEmbedScraper({
              id: ops.embed.id,
              url: embedUrl,
            });
            if (ops.debug) console.log(result);
            streamCount = (result.stream ?? []).length;
          } catch (err) {
            if (ops.debug) console.log(err);
            hasError = true;
          }
          expect(ops.expect.error ?? false).toBe(hasError);
          expect(ops.expect.streams ?? 0).toBe(streamCount);
        }

        for (const t of ops.types) {
          const builder = makeBaseEmbedProviders().addSource(ops.source).addEmbed(ops.embed);
          if (t === 'standard') {
          } else if (t === 'ip:standard') builder.enableConsistentIpForRequests();
          else if (t === 'proxied') {
            if (!process.env.MOVIE_WEB_PROXY_URL)
              throw new Error('Cant use proxied test without setting MOVIE_WEB_PROXY_URL env');
            builder.setProxiedFetcher(makeSimpleProxyFetcher(process.env.MOVIE_WEB_PROXY_URL, fetch));
          }
          const providers = builder.build();
          try {
            const embeds = await gatherEmbeds(providers);
            embeds.forEach((embed, i) => {
              it(`${t} - embed ${i}`, async () => {
                await runTest(providers, embed.url);
              });
            });
          } catch (err) {
            it(`${t} - embed ??`, () => {
              throw new Error('Failed to get streams: ' + err);
            });
          }
        }
      });
    });
  });
}
