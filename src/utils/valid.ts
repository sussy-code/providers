import { Stream } from '@/providers/streams';
import { IndividualEmbedRunnerOptions } from '@/runners/individualRunner';
import { ProviderRunnerOptions } from '@/runners/runner';

export function isValidStream(stream: Stream | undefined): boolean {
  if (!stream) return false;
  if (stream.type === 'hls') {
    if (!stream.playlist) return false;
    return true;
  }
  if (stream.type === 'file') {
    const validQualities = Object.values(stream.qualities).filter((v) => v.url.length > 0);
    if (validQualities.length === 0) return false;
    return true;
  }

  // unknown file type
  return false;
}

export async function validatePlayableStream(
  stream: Stream,
  ops: ProviderRunnerOptions | IndividualEmbedRunnerOptions,
): Promise<Stream | null> {
  const fetcher = stream.flags.length === 1 && stream.flags.includes('cors-allowed') ? ops.fetcher : ops.proxiedFetcher;
  if (stream.type === 'hls') {
    const headResult = await fetcher.full(stream.playlist, {
      method: 'HEAD',
      headers: {
        ...stream.preferredHeaders,
        ...stream.headers,
      },
    });
    if (headResult.statusCode !== 200) return null;
    return stream;
  }
  if (stream.type === 'file') {
    const validQualitiesResults = await Promise.all(
      Object.values(stream.qualities).map((quality) =>
        fetcher.full(quality.url, {
          method: 'HEAD',
          headers: {
            ...stream.preferredHeaders,
            ...stream.headers,
          },
        }),
      ),
    );
    // remove invalid qualities from the stream
    const validQualities = stream.qualities;
    Object.keys(stream.qualities).forEach((quality, index) => {
      if (validQualitiesResults[index].statusCode !== 200) {
        delete validQualities[quality as keyof typeof stream.qualities];
      }
    });

    if (Object.keys(validQualities).length === 0) return null;
    return { ...stream, qualities: validQualities };
  }
  return null;
}

export async function validatePlayableStreams(
  streams: Stream[],
  ops: ProviderRunnerOptions | IndividualEmbedRunnerOptions,
): Promise<Stream[]> {
  return (await Promise.all(streams.map((stream) => validatePlayableStream(stream, ops)))).filter(
    (v) => v !== null,
  ) as Stream[];
}
