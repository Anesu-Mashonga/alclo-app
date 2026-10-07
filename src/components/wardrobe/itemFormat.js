import { CATEGORY_BY_ID, WARMTH_LEVELS, typeLabel } from '@/data/taxonomy';
import { formatCurrency } from '@/lib/format';

/** "Not worn yet", "Worn once", "Worn 12 times". */
export function wearCountLabel(count) {
  const n = Number(count) || 0;
  if (n === 0) return 'Not worn yet';
  if (n === 1) return 'Worn once';
  return `Worn ${n.toLocaleString('en-US')} times`;
}

/** "Chinos" or the category's singular name when the type is unknown. */
export function itemKind(item) {
  return item?.type ? typeLabel(item.type) : (CATEGORY_BY_ID[item?.category]?.singular ?? 'Piece');
}

/** Warmth label for a 1..5 value ("Medium"). */
export function warmthLabel(value) {
  return WARMTH_LEVELS.find((level) => level.value === Number(value))?.label ?? 'Medium';
}

/**
 * Cost per wear: price divided by wears (the full price until it is worn).
 * Returns null when there is no price.
 */
export function costPerWear(item) {
  if (item?.price === null || item?.price === undefined) return null;
  const wears = Math.max(1, Number(item.wearCount) || 0);
  return item.price / wears;
}

/** "$4.25" or "--". */
export function formatCostPerWear(item) {
  const value = costPerWear(item);
  return value === null ? '--' : formatCurrency(Math.round(value * 100) / 100);
}

/** Hex luminance check, used to pick a readable check mark on top of a swatch. */
export function isLightColor(hex) {
  const value = String(hex ?? '').replace('#', '');
  if (value.length !== 6) return true;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.6;
}
