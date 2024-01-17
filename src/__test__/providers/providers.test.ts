import { describe, expect, it } from "vitest";
import { testSource } from "./providerUtils";
import { lookmovieScraper } from "@/providers/sources/lookmovie";
import { testMedia } from "./testMedia";
import { showboxScraper } from "@/providers/sources/showbox";

testSource({
  source: lookmovieScraper,
  testSuite: [testMedia.arcane, testMedia.hamilton],
  types: ['ip:standard'],
  expect: {
    streams: 1,
  }
})

testSource({
  source: showboxScraper,
  testSuite: [testMedia.arcane, testMedia.hamilton],
  types: ['standard'],
  expect: {
    embeds: 1,
  }
})