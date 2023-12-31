# `ProviderControls.listEmbeds`

List all embed scrapers that are applicable for the target.
They are sorted by rank; highest first

## Example

```ts
const embedScrapers = providers.listEmbeds();
// Guaranteed to only return the type: 'embed'
```

## Type

```ts
function listEmbeds(): MetaOutput[];

type MetaOutput = {
  type: 'embed' | 'source';
  id: string;
  rank: number;
  name: string;
  mediaTypes?: Array<MediaTypes>;
};
```
