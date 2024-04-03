import dotenv from 'dotenv';
import { febboxMp4Scraper } from '@/providers/embeds/febbox/mp4';
import { testEmbed } from './embedUtils';
import { showboxScraper } from '@/providers/sources/showbox';
import { testMedia } from './testMedia';
import { flixhqScraper } from '@/providers/sources/flixhq';
import { upcloudScraper } from '@/providers/embeds/upcloud';
import { goMoviesScraper } from '@/providers/sources/gomovies';
import { smashyStreamScraper } from '@/providers/sources/smashystream';
import { smashyStreamDScraper } from '@/providers/embeds/smashystream/dued';
import { vidsrcembedScraper } from '@/providers/embeds/vidsrc';
import { vidsrcScraper } from '@/providers/sources/vidsrc';
import { vidSrcToScraper } from '@/providers/sources/vidsrcto';
import { vidplayScraper } from '@/providers/embeds/vidplay';
import { fileMoonScraper } from '@/providers/embeds/filemoon';
import { zoechipScraper } from '@/providers/sources/zoechip';
import { mixdropScraper } from '@/providers/embeds/mixdrop';

dotenv.config();

testEmbed({
  embed: febboxMp4Scraper,
  source: showboxScraper,
  testSuite: [testMedia.arcane, testMedia.hamilton],
  types: ['standard', 'proxied'],
  expect: {
    embeds: 1,
    streams: 1,
  },
});

testEmbed({
  embed: upcloudScraper,
  source: flixhqScraper,
  testSuite: [testMedia.arcane, testMedia.hamilton],
  types: ['standard', 'proxied'],
  expect: {
    embeds: 1,
    streams: 1,
  },
});

testEmbed({
  embed: upcloudScraper,
  source: goMoviesScraper,
  testSuite: [testMedia.arcane, testMedia.hamilton],
  types: ['standard', 'proxied'],
  expect: {
    embeds: 1,
    streams: 1,
  },
});

testEmbed({
  embed: smashyStreamDScraper,
  source: smashyStreamScraper,
  testSuite: [testMedia.arcane, testMedia.hamilton],
  types: ['standard', 'proxied'],
  expect: {
    embeds: 1,
    streams: 1,
  },
});

testEmbed({
  embed: vidsrcembedScraper,
  source: vidsrcScraper,
  testSuite: [testMedia.arcane, testMedia.hamilton],
  types: ['standard', 'proxied'],
  expect: {
    embeds: 1,
    streams: 1,
  },
});

testEmbed({
  embed: vidplayScraper,
  source: vidSrcToScraper,
  testSuite: [testMedia.arcane, testMedia.hamilton],
  types: ['standard', 'proxied'],
  expect: {
    embeds: 1,
    streams: 1,
  },
});

testEmbed({
  embed: fileMoonScraper,
  source: vidSrcToScraper,
  testSuite: [testMedia.arcane, testMedia.hamilton],
  types: ['standard', 'proxied'],
  expect: {
    embeds: 1,
    streams: 1,
  },
});

testEmbed({
  embed: upcloudScraper,
  source: zoechipScraper,
  testSuite: [testMedia.arcane, testMedia.hamilton],
  types: ['standard', 'proxied'],
  expect: {
    embeds: 2,
    streams: 1,
  },
});

testEmbed({
  embed: mixdropScraper,
  source: zoechipScraper,
  testSuite: [testMedia.arcane, testMedia.hamilton],
  types: ['standard', 'proxied'],
  expect: {
    embeds: 2,
    streams: 1,
  },
});
