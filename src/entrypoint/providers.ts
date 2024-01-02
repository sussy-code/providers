import { gatherAllEmbeds, gatherAllSources } from '@/providers/all';
import { Embed, Sourcerer } from '@/providers/base';

export function getBuiltinSources(): Sourcerer[] {
  return gatherAllSources().filter((v) => !v.disabled);
}

export function getBuiltinEmbeds(): Embed[] {
  return gatherAllEmbeds().filter((v) => !v.disabled);
}
