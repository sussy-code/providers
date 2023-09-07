export type UpdateEventStatus = 'success' | 'failure' | 'notfound' | 'pending';

export type UpdateEvent = {
  id: string; // id presented in start event
  percentage: number;
  status: UpdateEventStatus;
  error?: unknown; // set when status is failure
  reason?: string; // set when status is not-found
};

export type InitEvent = {
  sourceIds: string[]; // list of source ids
};

export type DiscoverEmbedsEvent = {
  sourceId: string;

  // list of embeds that will be scraped in order
  embeds: Array<{
    id: string;
    embedScraperId: string;
  }>;
};

export type SingleScraperEvents = {
  update?: (evt: UpdateEvent) => void;
};

export type FullScraperEvents = {
  // update progress percentage and status of the currently scraping item
  update?: (evt: UpdateEvent) => void;

  // initial list of scrapers its running, only triggers once per run.
  init?: (evt: InitEvent) => void;

  // list of embeds are discovered for the currently running source scraper
  // triggers once per source scraper
  discoverEmbeds?: (evt: DiscoverEmbedsEvent) => void;

  // start scraping an item.
  start?: (id: string) => void;
};

export type IndividualScraperEvents = {
  // update progress percentage and status of the currently scraping item
  update?: (evt: UpdateEvent) => void;
};
