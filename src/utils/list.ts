export function reorderOnIdList<T extends { rank: number; id: string }[]>(order: string[], list: T): T {
  const copy = [...list] as T;
  copy.sort((a, b) => {
    const aIndex = order.indexOf(a.id);
    const bIndex = order.indexOf(b.id);

    // both in order list
    if (aIndex >= 0 && bIndex >= 0) return aIndex - bIndex;

    // only one in order list
    // negative means order [a,b]
    // positive means order [b,a]
    if (bIndex >= 0) return 1; // A isnt in list but B is, so A goes later on the list
    if (aIndex >= 0) return -1; // B isnt in list but A is, so B goes later on the list

    // both not in list, sort on rank
    return b.rank - a.rank;
  });
  return copy;
}
