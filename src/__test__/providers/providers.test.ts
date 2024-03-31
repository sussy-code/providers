import { testSource } from './providerUtils';
import { lookmovieScraper } from '@/providers/sources/lookmovie';
import { testMedia } from './testMedia';
import { showboxScraper } from '@/providers/sources/showbox';
import dotenv from 'dotenv';
import { flixhqScraper } from '@/providers/sources/flixhq';
import { goMoviesScraper } from '@/providers/sources/gomovies';
import { smashyStreamScraper } from '@/providers/sources/smashystream';
import { vidsrcScraper } from '@/providers/sources/vidsrc';
import { vidSrcToScraper } from '@/providers/sources/vidsrcto';
import { zoechipScraper } from '@/providers/sources/zoechip';
import { remotestreamScraper } from '@/providers/sources/remotestream';

dotenv.config();

testSource({
  source: lookmovieScraper,
  testSuite: [testMedia.arcane, testMedia.hamilton],
  types: ['ip:standard'],
  expect: {
    streams: 1,
  },
});

testSource({
  source: showboxScraper,
  testSuite: [testMedia.arcane, testMedia.hamilton],
  types: ['standard', 'proxied'],
  expect: {
    embeds: 1,
  },
});

testSource({
  source: flixhqScraper,
  testSuite: [testMedia.arcane, testMedia.hamilton],
  types: ['standard', 'proxied'],
  expect: {
    embeds: 1,
  },
});

testSource({
  source: goMoviesScraper,
  testSuite: [testMedia.arcane, testMedia.hamilton],
  types: ['standard', 'proxied'],
  expect: {
    embeds: 1,
  },
});

testSource({
  source: smashyStreamScraper,
  testSuite: [testMedia.arcane, testMedia.hamilton],
  types: ['standard', 'proxied'],
  expect: {
    embeds: 1,
  },
});

testSource({
  source: vidsrcScraper,
  testSuite: [testMedia.arcane, testMedia.hamilton],
  types: ['standard', 'proxied'],
  expect: {
    embeds: 1,
  },
});

testSource({
  source: vidSrcToScraper,
  testSuite: [testMedia.arcane, testMedia.hamilton],
  types: ['standard', 'proxied'],
  expect: {
    embeds: 2,
  },
});

testSource({
  source: zoechipScraper,
  testSuite: [testMedia.arcane, testMedia.hamilton],
  types: ['standard', 'proxied'],
  expect: {
    embeds: 3,
  },
});

testSource({
  source: remotestreamScraper,
  testSuite: [testMedia.arcane, testMedia.hamilton],
  types: ['standard', 'proxied'],
  expect: {
    streams: 1,
  },
});
