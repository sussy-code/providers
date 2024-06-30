import { flags } from '@/entrypoint/utils/targets';
import { Stream } from '@/providers/streams';

export function requiresProxy(stream: Stream): boolean {
  if (!stream.flags.includes('cors-allowed') && !!(stream.headers && Object.keys(stream.headers).length > 0))
    return true;
  return false;
}

export function setupProxy(stream: Stream): Stream {
  // todo

  // stream.headers = {};
  stream.flags = [flags.CORS_ALLOWED];
  return stream;
}
