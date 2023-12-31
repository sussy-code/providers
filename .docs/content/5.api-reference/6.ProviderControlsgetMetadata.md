# `ProviderControls.getMetadata`

Get meta data for a scraper, can be either source or embed scraper.
Returns `null` if the `id` is not recognized.

## Example

```ts
const flixhqSource = providers.getMetadata('flixhq');
```

## Type

```ts
function getMetadata(id: string): MetaOutput | null;

type MetaOutput = {
  type: 'embed' | 'source';
  id: string;
  rank: number;
  name: string;
  mediaTypes?: Array<MediaTypes>;
};
```
