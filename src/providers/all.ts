import { Embed, Sourcerer } from '@/providers/base';
import { AnimekaiScraper } from './embeds/animekai';
import { animekaiScraper } from './sources/animekai';
import { vidkingEmbedScraper } from './embeds/vidking';
import { vidkingScraper } from './sources/vidKing';
import { FedAPIScraper } from './sources/fed/fedapi';
//import { FedAPIDBScraper } from './sources/fed/fedapidb';
import { FEDIAPIScraper } from './sources/test';
import { coitusScraper } from './sources/disabled/coitus'
import { xprimeScraper } from './sources/fed/xprime';
import { movielairScrape } from './sources/florence/movielair'
import { doodScraper } from '@/providers/embeds/dood';
import { filemoonScraper } from '@/providers/embeds/filemoon';
import { mixdropScraper } from '@/providers/embeds/mixdrop';
import { serverMirrorEmbed } from '@/providers/embeds/server-mirrors';
import { turbovidScraper } from '@/providers/embeds/turbovid';
import { upcloudScraper } from '@/providers/embeds/upcloud';
import { autoembedScraper } from '@/providers/sources/disabled/autoembed';
import { dopeboxEmbeds, dopeboxScraper } from '@/providers/sources/disabled/dopebox/index';
import { ee3Scraper } from '@/providers/sources/ee3';
import { bludclartScraper } from '@/providers/sources/florence/bludclart';
import { thunderleafScraper } from '@/providers/sources/florence/thunderleaf';
import { fsharetvScraper } from '@/providers/sources/disabled/fsharetv';
import { fsOnlineEmbeds, fsOnlineScraper } from '@/providers/sources/fsonline/index';
import { insertunitScraper } from '@/providers/sources/disabled/insertunit';
import { movieboxScraper } from '@/providers/sources/disabled/moviebox';
import { flixerScraper } from '@/providers/sources/Moviebox/flixerz';
import { hdmovieScraper } from '@/providers/sources/Moviebox/hdmovie';
import { zyonScraper } from './sources/Moviebox/zyon';
import { smashyScraper } from '@/providers/sources/florence/smashy';
import { mp4hydraScraper } from '@/providers/sources/disabled/mp4hydra';
import { pirxcyScraper } from '@/providers/sources/disabled/pirxcy';
import { tugaflixScraper } from '@/providers/sources/tugaflix';
import { vidsrcvipScraper } from '@/providers/sources/disabled/vidsrcvip';
import { zoechipScraper } from '@/providers/sources/disabled/zoechip';

import { AnimetsuEmbeds } from './embeds/animetsu';
import {
  autoembedBengaliScraper,
  autoembedEnglishScraper,
  autoembedHindiScraper,
  autoembedTamilScraper,
  autoembedTeluguScraper,
} from './embeds/autoembed';
import { cinemaosEmbeds } from './embeds/cinemaos';
import { closeLoadScraper } from './embeds/closeload';
import { droploadScraper } from './embeds/dropload';
import { filelionsScraper } from './embeds/filelions';
import { mp4hydraServer1Scraper, mp4hydraServer2Scraper } from './embeds/mp4hydra';
import { myanimedubScraper } from './embeds/myanimedub';
import { myanimesubScraper } from './embeds/myanimesub';
import { ridooScraper } from './embeds/ridoo';
import { streamtapeLatinoScraper, streamtapeScraper } from './embeds/streamtape';
import { streamvidScraper } from './embeds/streamvid';
import {
  streamwishEnglishScraper,
  streamwishJapaneseScraper,
  streamwishLatinoScraper,
  streamwishSpanishScraper,
} from './embeds/streamwish';
import { supervideoScraper } from './embeds/supervideo';
import { vidCloudScraper } from './embeds/vidcloud';
import { vidhideEnglishScraper, vidhideLatinoScraper, vidhideSpanishScraper } from './embeds/vidhide';
import { vidifyEmbeds } from './embeds/vidify';
import { vidnestAllmoviesEmbed, vidnestHollymoviehdEmbed } from './embeds/vidnest';
import {
  VidsrcsuServer10Scraper,
  VidsrcsuServer11Scraper,
  VidsrcsuServer12Scraper,
  VidsrcsuServer1Scraper,
  VidsrcsuServer20Scraper,
  VidsrcsuServer2Scraper,
  VidsrcsuServer3Scraper,
  VidsrcsuServer4Scraper,
  VidsrcsuServer5Scraper,
  VidsrcsuServer6Scraper,
  VidsrcsuServer7Scraper,
  VidsrcsuServer8Scraper,
  VidsrcsuServer9Scraper,
} from './embeds/vidsrcsu';
import { viperScraper } from './embeds/viper';
import { voeScraper } from './embeds/voe';
import { warezcdnembedHlsScraper } from './embeds/warezcdn/hls';
import { warezcdnembedMp4Scraper } from './embeds/warezcdn/mp4';
import { warezPlayerScraper } from './embeds/warezcdn/warezplayer';
import { zunimeEmbeds } from './embeds/zunime';
import { EightStreamScraper } from './sources/disabled/8stream';
import { animeflvScraper } from './sources/animeflv';
import { animetsuScraper } from './sources/animetsu';
import { cinehdplusScraper } from './sources/cinehdplus-es';
import { cuevana3Scraper } from './sources/cuevana3';
import { debridScraper } from './sources/debrid';
import { embedsuScraper } from './sources/disabled/embedsu';
import { fullhdfilmizleScraper } from './sources/fullhdfilmizle';
import { hdRezkaScraper } from './sources/hdrezka';
import { movies4fScraper } from './sources/movies4f';
import { myanimeScraper } from './sources/myanime';
import { nunflixScraper } from './sources/disabled/nunflix';
import { pelisplushdScraper } from './sources/pelisplushd';
import { primewireScraper } from './sources/disabled/primewire';
import { rgshowsScraper } from './sources/rgshows';
import { ridooMoviesScraper } from './sources/ridomovies';
import { slidemoviesScraper } from './sources/disabled/slidemovies';
import { soaperTvScraper } from './sources/disabled/soapertv';
import { streamboxScraper } from './sources/disabled/streambox';
import { turbovidSourceScraper } from './sources/disabled/turbovid';
import { vidapiClickScraper } from './sources/disabled/vidapiclick';
import { vidifyScraper } from './sources/disabled/vidify';
import vidnestScraper from './sources/vidnest';
import { warezcdnScraper } from './sources/disabled/warezcdn';
import { wecimaScraper } from './sources/wecima';
import { zunimeScraper } from './sources/disabled/zunime';

export function gatherAllSources(): Array<Sourcerer> {
  return [
    fsOnlineScraper,
    dopeboxScraper,
    bludclartScraper,
    cuevana3Scraper,
    ridooMoviesScraper,
    hdRezkaScraper,
    warezcdnScraper,
    insertunitScraper,
    zyonScraper,
    soaperTvScraper,
    FEDIAPIScraper,
    smashyScraper,
    autoembedScraper,
    myanimeScraper,
    tugaflixScraper,
    ee3Scraper,
    fsharetvScraper,
    zoechipScraper,
    thunderleafScraper,
    movielairScrape,
    mp4hydraScraper,
    embedsuScraper,
    slidemoviesScraper,
    vidapiClickScraper,
    hdmovieScraper,
    flixerScraper,
    coitusScraper,
    streamboxScraper,
    nunflixScraper,
    EightStreamScraper,
    xprimeScraper,
    movieboxScraper,
    wecimaScraper,
    animeflvScraper,
    pirxcyScraper,
    vidsrcvipScraper,
    rgshowsScraper,
    vidifyScraper,
    zunimeScraper,
    vidnestScraper,
    animetsuScraper,
    turbovidSourceScraper,
    pelisplushdScraper,
    primewireScraper,
    movies4fScraper,
    debridScraper,
    cinehdplusScraper,
    fullhdfilmizleScraper,
    animekaiScraper,
    FedAPIScraper,
    //FedAPIDBScraper,
    vidkingScraper,
  ];
}

export function gatherAllEmbeds(): Array<Embed> {
  return [
    ...fsOnlineEmbeds,
    ...dopeboxEmbeds,
    serverMirrorEmbed,
    upcloudScraper,
    vidCloudScraper,
    mixdropScraper,
    ridooScraper,
    closeLoadScraper,
    doodScraper,
    streamvidScraper,
    streamtapeScraper,
    warezcdnembedHlsScraper,
    warezcdnembedMp4Scraper,
    warezPlayerScraper,
    autoembedEnglishScraper,
    autoembedHindiScraper,
    autoembedBengaliScraper,
    autoembedTamilScraper,
    autoembedTeluguScraper,
    turbovidScraper,
    mp4hydraServer1Scraper,
    mp4hydraServer2Scraper,
    VidsrcsuServer1Scraper,
    VidsrcsuServer2Scraper,
    VidsrcsuServer3Scraper,
    VidsrcsuServer4Scraper,
    VidsrcsuServer5Scraper,
    VidsrcsuServer6Scraper,
    VidsrcsuServer7Scraper,
    VidsrcsuServer8Scraper,
    VidsrcsuServer9Scraper,
    VidsrcsuServer10Scraper,
    VidsrcsuServer11Scraper,
    VidsrcsuServer12Scraper,
    VidsrcsuServer20Scraper,
    viperScraper,
    streamwishJapaneseScraper,
    streamwishLatinoScraper,
    streamwishSpanishScraper,
    streamwishEnglishScraper,
    streamtapeLatinoScraper,
    ...cinemaosEmbeds,
    // ...cinemaosHexaEmbeds,
    // vidsrcNovaEmbed,
    // vidsrcCometEmbed,
    // vidsrcPulsarEmbed,
    ...vidifyEmbeds,
    ...zunimeEmbeds,
    ...AnimetsuEmbeds,
    vidnestHollymoviehdEmbed,
    vidnestAllmoviesEmbed,
    myanimesubScraper,
    myanimedubScraper,
    filemoonScraper,
    vidhideLatinoScraper,
    vidhideSpanishScraper,
    vidhideEnglishScraper,
    filelionsScraper,
    droploadScraper,
    supervideoScraper,
    voeScraper,
    AnimekaiScraper,
    vidkingEmbedScraper,
  ];
}
