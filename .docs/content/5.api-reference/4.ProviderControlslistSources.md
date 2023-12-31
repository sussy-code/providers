# `ProviderControls.listSources`

List all source scrapers that are applicable for the target.
They are sorted by rank; highest first

## Example

```ts
const sourceScrapers = providers.listSources();
// Guaranteed to only return the type: 'source'
```

## Type

```ts
function listSources(): MetaOutput[];

type MetaOutput = {
  type: 'embed' | 'source';
  id: string;
  rank: number;
  name: string;
  mediaTypes?: Array<MediaTypes>;
};
```
