import { ScrapeMedia } from "@/entrypoint/utils/media";
import { Sourcerer } from "@/providers/base";
import { buildProviders } from "@/entrypoint/builder";
import { describe, expect, it } from "vitest";
import { makeStandardFetcher } from "@/fetchers/standardFetch";
import { ProviderControls } from "@/entrypoint/controls";
import { NotFoundError } from "@/utils/errors";
import { targets } from "@/entrypoint/utils/targets";
import { getAllEmbedMetaSorted } from "@/entrypoint/utils/meta";
import { getBuiltinEmbeds } from "@/entrypoint/providers";

export type TestTypes = 'standard' | 'ip:standard';

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
  }
}

// TODO add proxy support

function makeBaseProviders() {
  const builder = buildProviders()
    .setTarget(targets.ANY)
    .setFetcher(makeStandardFetcher(fetch));
  const embeds = getBuiltinEmbeds();
  embeds.forEach(embed => builder.addEmbed(embed));
  return builder;
}

export function testSource(ops: TestSourceOptions) {
  if (ops.testSuite.length === 0) throw new Error("Test suite must have at least one test");
  describe(`source:${ops.source.id}`, () => {
    ops.testSuite.forEach((test, i) => {
      async function runTest(providers: ProviderControls) {
        let hasNotFound = false;
        let hasError = false;
        let streamCount = 0;
        let embedCount = 0;
        try {
          const result = await providers.runSourceScraper({
            id: ops.source.id,
            media: test,
          })
          if (ops.debug) console.log(result);
          streamCount = (result.stream ?? []).length;
          embedCount = result.embeds.length;
        } catch (err) {
          if (ops.debug) console.log(err);
          if (err instanceof NotFoundError)
            hasNotFound = true;
          else
            hasError = true;
        }
        expect(ops.expect.error ?? false).toBe(hasError);
        expect(ops.expect.notfound ?? false).toBe(hasNotFound);
        expect(ops.expect.streams ?? 0).toBe(streamCount);
        expect(ops.expect.embeds ?? 0).toBe(embedCount);
      }

      if (ops.types.includes('standard')) {
        it(`Should pass test ${i} - standard`, async () => {
          const providers = makeBaseProviders()
            .addSource(ops.source)
            .build();
          await runTest(providers);
        })
      }

      if (ops.types.includes('ip:standard')) {
        it(`Should pass test ${i} - standard:ip`, async () => {
          const providers = makeBaseProviders()
            .addSource(ops.source)
            .enableConsistentIpForRequests()
            .build();
          await runTest(providers);
        })
      }
    })
  })
}
