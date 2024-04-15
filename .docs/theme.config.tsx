import { defineTheme, directory, group, link, social } from '@neato/guider/theme';
import { Logo } from './components/Logo';
import { NextSeo } from 'next-seo';
import coverUrl from "./public/cover.png";
import faviconUrl from "./public/favicon.ico";

export default defineTheme({
  github: "movie-web/providers",
  contentFooter: {
    text: "Made with 💜",
    editRepositoryBase: "https://github.com/movie-web/providers",
    socials: [
      social.github("https://github.com/movie-web/providers"),
      social.discord("https://movie-web.github.io/links/discord"),
    ]
  },
  meta: (pageMeta) => (
    <NextSeo {...{
      title: `${pageMeta.title ?? "For all your media scraping needs"} | movie-web`,
      description: pageMeta.description ?? "movie-web/providers : Easily scrape all sorts of media sites for content.",
      openGraph: {
        images: [{
          url: coverUrl.src,
        }],
        title: `${pageMeta.title ?? "For all your media scraping needs"} | movie-web`,
        description: pageMeta.description ?? "movie-web/providers : Easily scrape all sorts of media sites for content.",
      },
      twitter: {
        cardType: 'summary_large_image',
      },
      additionalLinkTags: [
        {
          href: faviconUrl.src,
          rel: "icon",
          type: "image/x-icon",
        }
      ]
    }} />
  ),
  settings: {
    logo: () => <Logo />,
    colors: {
      primary: "#E67070",
      primaryLighter: "#E59595",
      primaryDarker: "#D21818",
      background: "#000000",
      backgroundLighter: "#141414",
      backgroundLightest: "#292929",
      backgroundDarker: "#000000",
      line: "#404040",
      text: "#B3B3B3",
      textLighter: "#CCCCCC",
      textHighlight: "#cccccc",

      codeWarning: '#222D20',
      codeError: '#2B1B1F',
      codeGreen: '#0B2823',
      codeHighlight: '#0E2429',
      codeWordHighlight: '#365C68',

      semanticTip: '#39B864',
      semanticTipLighter: '#75F2B6',
      semanticNote: '#817EF3',
      semanticNoteLighter: '#B9B8FC',
      semanticImportant: '#A958E8',
      semanticImportantLighter: '#D3A2F9',
      semanticWarning: '#fff708',
      semanticWarningLighter: '#faf8b1',
      semanticCaution: '#FC6359',
      semanticCautionLighter: '#FFA59F',
    },
    backgroundPattern: 'flare',
  },
  directories: [
    directory("main", {
      sidebar: [
        group("Get Started", [
          link("Introduction", "/get-started/introduction"),
          link("Quickstart", "/get-started/quick-start"),
          link("Examples", "/get-started/examples"),
          link("Changelog", "/get-started/changelog"),
        ]),
        group("Essentials", [
          link("Usage on X", "/essentials/usage-on-x"),
          link("Targets", "/essentials/targets"),
          link("Fetchers", "/essentials/fetchers"),
          link("Customize Providers", "/essentials/customize-providers"),
          link("Using Streams", "/essentials/using-streams"),
        ]),
        group("In Depth", [
          link("Sources vs Embeds", "/in-depth/sources-vs-embeds"),
          link("New Providers", "/in-depth/new-providers"),
          link("Flags", "/in-depth/flags"),
        ]),
        group("Extra Topics", [
          link("Development and Contributing", "/extra-topics/development"),
        ]),
        group("Api Reference", [
          link("makeProviders", "/api-reference/makeProviders"),
          link("ProviderControls.runAll", "/api-reference/ProviderControlsRunAll"),
          link("ProviderControls.runSourceScraper", "/api-reference/ProviderControlsrunSourceScraper"),
          link("ProviderControls.runEmbedScraper", "/api-reference/ProviderControlsrunEmbedScraper"),
          link("ProviderControls.listSources", "/api-reference/ProviderControlslistSources"),
          link("ProviderControls.listEmbeds", "/api-reference/ProviderControlslistEmbeds"),
          link("ProviderControls.getMetadata", "/api-reference/ProviderControlsgetMetadata"),
          link("makeStandardFetcher", "/api-reference/makeStandardFetcher"),
          link("makeSimpleProxyFetcher", "/api-reference/makeSimpleProxyFetcher"),
        ])
      ]
    })
  ],
});
