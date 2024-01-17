import { febboxMp4Scraper } from "@/providers/embeds/febbox/mp4";
import { testEmbed } from "./providerUtils";
import dotenv from 'dotenv';

dotenv.config();

testEmbed({
  embed: febboxMp4Scraper,
  testUrls: [
    '/show/16448/1/1',
    '/movie/27769//'
  ],
  types: ['standard', 'proxied'],
  expect: {
    streams: 1,
  }
})
