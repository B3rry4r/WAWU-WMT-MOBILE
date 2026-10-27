import { LIST } from '../__helpers__/prices';
import { atOrAbove, earnOf, nearestOf, popularOf, stepOf, stopOf } from '../model';

describe('price list rules', () => {
  it('earns 85% of the list price, rounded down to the naira', () => {
    expect(earnOf(2500)).toBe(2125);
    expect(earnOf(100)).toBe(85);
    expect(earnOf(333)).toBe(283);
    expect(earnOf(1_000_000)).toBe(850_000);
  });

  it('finds the nearest list price, the lower one on a tie', () => {
    expect(nearestOf(LIST, 1200)).toBe(1000);
    expect(nearestOf(LIST, 1250)).toBe(1000);
    expect(nearestOf(LIST, 1251)).toBe(1500);
    expect(nearestOf(LIST, 50)).toBe(100);
    expect(nearestOf(LIST, 9_999_999)).toBe(1_000_000);
    expect(nearestOf([], 100)).toBeNull();
  });

  it('opens on 2,500, or the nearest to it, or the person\'s own price', () => {
    expect(stopOf(LIST, null)).toBe(2500);
    expect(stopOf([100, 1000, 9000], null)).toBe(1000);
    expect(stopOf(LIST, 5000)).toBe(5000);
    expect(stopOf(LIST, 5100)).toBe(5000);
  });

  it('raises to the lowest list price at or above a figure, holding at the top', () => {
    expect(atOrAbove(LIST, 1200)).toBe(1500);
    expect(atOrAbove(LIST, 1500)).toBe(1500);
    expect(atOrAbove(LIST, 9_999_999)).toBe(1_000_000);
  });

  it('keeps the popular shortcuts that are on the list, and steps along it', () => {
    expect(popularOf(LIST)).toEqual([1000, 2500, 5000, 10_000]);
    expect(popularOf([1000, 5000])).toEqual([1000, 5000]);
    expect(stepOf(LIST, 2500, 1)).toBe(3000);
    expect(stepOf(LIST, 100, -1)).toBe(100);
    expect(stepOf(LIST, 1_000_000, 1)).toBe(1_000_000);
  });
});
