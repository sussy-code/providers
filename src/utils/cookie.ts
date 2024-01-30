import cookie from 'cookie';
import setCookieParser from 'set-cookie-parser';

export interface Cookie {
  name: string;
  value: string;
}

export function makeCookieHeader(cookies: Record<string, string>): string {
  return Object.entries(cookies)
    .map(([name, value]) => cookie.serialize(name, value))
    .join('; ');
}

export function parseSetCookie(headerValue: string): Record<string, Cookie> {
  const parsedCookies = setCookieParser.parse(headerValue, {
    map: true,
  });
  return parsedCookies;
}
