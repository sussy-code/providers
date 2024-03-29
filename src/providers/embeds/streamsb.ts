import { load } from 'cheerio';
import Base64 from 'crypto-js/enc-base64';
import Utf8 from 'crypto-js/enc-utf8';
import FormData from 'form-data';

import { flags } from '@/entrypoint/utils/targets';
import { makeEmbed } from '@/providers/base';
import { StreamFile } from '@/providers/streams';
import { EmbedScrapeContext } from '@/utils/context';

async function fetchCaptchaToken(ctx: EmbedScrapeContext, domain: string, recaptchaKey: string) {
  const domainHash = Base64.stringify(Utf8.parse(domain)).replace(/=/g, '.');

  const recaptchaRender = await ctx.proxiedFetcher<string>(`https://www.google.com/recaptcha/api.js`, {
    query: {
      render: recaptchaKey,
    },
  });

  const vToken = recaptchaRender.substring(
    recaptchaRender.indexOf('/releases/') + 10,
    recaptchaRender.indexOf('/recaptcha__en.js'),
  );

  const recaptchaAnchor = await ctx.proxiedFetcher<string>(
    `https://www.google.com/recaptcha/api2/anchor?cb=1&hl=en&size=invisible&cb=flicklax`,
    {
      query: {
        k: recaptchaKey,
        co: domainHash,
        v: vToken,
      },
    },
  );

  const cToken = load(recaptchaAnchor)('#recaptcha-token').attr('value');
  if (!cToken) throw new Error('Unable to find cToken');

  const tokenData = await ctx.proxiedFetcher<string>(`https://www.google.com/recaptcha/api2/reload`, {
    query: {
      v: vToken,
      reason: 'q',
      k: recaptchaKey,
      c: cToken,
      sa: '',
      co: domain,
    },
    headers: { referer: 'https://www.google.com/recaptcha/api2/' },
    method: 'POST',
  });

  const token = tokenData.match('rresp","(.+?)"');
  return token ? token[1] : null;
}

/* Url variations
  - domain.com/{id}?.html
  - domain.com/{id}
  - domain.com/embed-{id}
  - domain.com/d/{id}
  - domain.com/e/{id}
  - domain.com/e/{id}-embed
  */
export const streamsbScraper = makeEmbed({
  id: 'streamsb',
  name: 'StreamSB',
  rank: 150,
  async scrape(ctx) {
    const streamsbUrl = ctx.url.replace('.html', '').replace('embed-', '').replace('e/', '').replace('d/', '');
    const parsedUrl = new URL(streamsbUrl);
    const base = await ctx.proxiedFetcher<string>(`${parsedUrl.origin}/d${parsedUrl.pathname}`);
    ctx.progress(20);

    const pageDoc = load(base);

    const dlDetails: any[] = [];
    pageDoc('[onclick^=download_video]').each((i, el) => {
      const $el = pageDoc(el);

      const funcContents = $el.attr('onclick');
      const regExpFunc = /download_video\('(.+?)','(.+?)','(.+?)'\)/;
      const matchesFunc = regExpFunc.exec(funcContents ?? '');
      if (!matchesFunc) return;

      const quality = $el.find('span').text();
      const regExpQuality = /(.+?) \((.+?)\)/;
      const matchesQuality = regExpQuality.exec(quality ?? '');
      if (!matchesQuality) return;

      dlDetails.push({
        parameters: [matchesFunc[1], matchesFunc[2], matchesFunc[3]],
        quality: {
          label: matchesQuality[1].trim(),
          size: matchesQuality[2],
        },
      });
    });

    ctx.progress(40);

    let dls = await Promise.all(
      dlDetails.map(async (dl) => {
        const query = {
          op: 'download_orig',
          id: dl.parameters[0],
          mode: dl.parameters[1],
          hash: dl.parameters[2],
        };

        const getDownload = await ctx.proxiedFetcher<string>(`/dl`, {
          query,
          baseUrl: parsedUrl.origin,
        });

        const downloadDoc = load(getDownload);

        const recaptchaKey = downloadDoc('.g-recaptcha').attr('data-sitekey');
        if (!recaptchaKey) throw new Error('Unable to get captcha key');

        const captchaToken = await fetchCaptchaToken(ctx, parsedUrl.origin, recaptchaKey);
        if (!captchaToken) throw new Error('Unable to get captcha token');

        const dlForm = new FormData();
        dlForm.append('op', 'download_orig');
        dlForm.append('id', dl.parameters[0]);
        dlForm.append('mode', dl.parameters[1]);
        dlForm.append('hash', dl.parameters[2]);
        dlForm.append('g-recaptcha-response', captchaToken);

        const download = await ctx.proxiedFetcher<string>(`/dl`, {
          method: 'POST',
          baseUrl: parsedUrl.origin,
          body: dlForm,
          query,
        });

        const dlLink = load(download)('.btn.btn-light.btn-lg').attr('href');

        return {
          quality: dl.quality.label,
          url: dlLink,
        };
      }),
    );
    dls = dls.filter((d) => !!d.url);

    ctx.progress(80);

    const qualities = dls.reduce(
      (a, v) => {
        a[v.quality] = {
          type: 'mp4',
          url: v.url as string,
        };
        return a;
      },
      {} as Record<string, StreamFile>,
    );

    return {
      stream: [
        {
          id: 'primary',
          type: 'file',
          flags: [flags.CORS_ALLOWED],
          qualities,
          captions: [],
        },
      ],
    };
  },
});
