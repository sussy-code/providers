import { reorderOnIdList } from '@/utils/list';
import { describe, it, expect } from 'vitest';

function list(def: string) {
  return def.split(',').map((v) => ({
    rank: parseInt(v),
    id: v,
  }));
}

function expectListToEqual(l1: ReturnType<typeof list>, l2: ReturnType<typeof list>) {
  function flatten(l: ReturnType<typeof list>) {
    return l.map((v) => v.id).join(',');
  }
  expect(flatten(l1)).toEqual(flatten(l2));
}

describe('reorderOnIdList()', () => {
  it('should reorder based on rank', () => {
    const l = list('2,1,4,3');
    const sortedList = list('4,3,2,1');
    expectListToEqual(reorderOnIdList([], l), sortedList);
  });

  it('should work with empty input', () => {
    expectListToEqual(reorderOnIdList([], []), []);
  });

  it('should reorder based on id list', () => {
    const l = list('4,2,1,3');
    const sortedList = list('4,3,2,1');
    expectListToEqual(reorderOnIdList(['4', '3', '2', '1'], l), sortedList);
  });

  it('should reorder based on id list and rank second', () => {
    const l = list('4,2,1,3');
    const sortedList = list('4,3,2,1');
    expectListToEqual(reorderOnIdList(['4', '3'], l), sortedList);
  });

  it('should work with only one item', () => {
    const l = list('1');
    const sortedList = list('1');
    expectListToEqual(reorderOnIdList(['1'], l), sortedList);
    expectListToEqual(reorderOnIdList([], l), sortedList);
  });

  it('should not affect original list', () => {
    const l = list('4,3,2,1');
    const unsortedList = list('4,3,2,1');
    reorderOnIdList([], l);
    expectListToEqual(l, unsortedList);
  });
});
