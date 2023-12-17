/**
 * This file is a very relaxed definition of the fetch api
 * Only containing what we need for it to function.
 */

export type FetchOps = {
  headers: Record<string, string>;
  method: string;
  body: any;
};

export type FetchHeaders = {
  get(key: string): string | null;
};

export type FetchReply = {
  text(): Promise<string>;
  json(): Promise<any>;
  headers: FetchHeaders;
};

export type FetchLike = (url: string, ops?: FetchOps | undefined) => Promise<FetchReply>;
