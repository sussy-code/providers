export interface Cookie {
  name: string;
  value: string;
}

export function makeCookieHeader(cookies: Record<string, string>): string {
  return Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
}

export function parseSetCookie(headerValue: string): Record<string, Cookie> {
  const cookies: Record<string, Cookie> = {};
  const parts = headerValue.split(/; */);
  for (const part of parts) {
    const [name, value] = part.split('=');
    if (name && value) {
      cookies[name] = { name, value };
    }
  }
  return cookies;
}
