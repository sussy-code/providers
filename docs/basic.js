async function example() {
  const providers = makeProviders({
    fetcher: makeStandardFetcher(fetch),
  });

  const source = await providers.runAll({
    media: {
      title: 'Spider-Man: Across the Spider-Verse',
      releaseYear: 2023,
      imbdId: 'tt9362722',
      tmdbId: '569094',
      type: 'movie',
    },
  });

  if (!source) throw new Error("Couldn't find a stream");
  if (source.stream.type === 'file') return source.stream.qualities['1080']?.url;
  if (source.stream.type === 'hls') return source.stream.playlist;
}
