import FormData from 'form-data';

import { FetcherOptions } from '@/fetchers/types';
import { isReactNative } from '@/utils/native';

export interface SeralizedBody {
  headers: Record<string, string>;
  body: FormData | URLSearchParams | string | undefined;
}

export function serializeBody(body: FetcherOptions['body']): SeralizedBody {
  if (body === undefined || typeof body === 'string' || body instanceof URLSearchParams || body instanceof FormData) {
    if (body instanceof URLSearchParams && isReactNative()) {
      return {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      };
    }
    return {
      headers: {},
      body,
    };
  }

  // serialize as JSON
  return {
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  };
}
