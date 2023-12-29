import { gatherAllEmbeds, gatherAllSources } from '@/providers/all';
import { Embed, Sourcerer } from '@/providers/base';

export function getBuiltinSources(): Sourcerer[] {
  return gatherAllSources();
}

export function getBuiltinEmbeds(): Embed[] {
  return gatherAllEmbeds();
}
