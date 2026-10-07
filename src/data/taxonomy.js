/**
 * Shared vocabulary for the wardrobe: categories, garment types, colours,
 * occasions, weather conditions and laundry states. Ids are lowercase and stable;
 * labels are display copy in sentence case.
 */

export const CATEGORIES = [
  { id: 'top', label: 'Tops', singular: 'Top' },
  { id: 'bottom', label: 'Bottoms', singular: 'Bottom' },
  { id: 'outerwear', label: 'Outerwear', singular: 'Outerwear' },
  { id: 'footwear', label: 'Footwear', singular: 'Footwear' },
  { id: 'accessory', label: 'Accessories', singular: 'Accessory' },
];

/** Garment types per category. Ids are lowercase and may contain spaces or hyphens. */
export const TYPES = {
  top: ['t-shirt', 'shirt', 'polo', 'tank', 'long-sleeve', 'sweatshirt', 'hoodie', 'sweater'],
  bottom: ['jeans', 'chinos', 'trousers', 'cargo pants', 'shorts', 'sweatpants', 'leggings', 'skirt'],
  outerwear: [
    'jacket',
    'bomber',
    'denim jacket',
    'leather jacket',
    'windbreaker',
    'blazer',
    'cardigan',
    'coat',
    'parka',
  ],
  footwear: ['sneakers', 'trainers', 'boots', 'loafers', 'derbies', 'sandals', 'heels'],
  accessory: [
    'bag',
    'belt bag',
    'cap',
    'hat',
    'bucket hat',
    'beanie',
    'scarf',
    'sunglasses',
    'glasses',
    'necklace',
  ],
};

/**
 * Garment colours. `hex` is a representative swatch (garment data, not UI palette).
 * `neutral` colours pair with anything in the outfit engine's harmony rules.
 */
export const COLORS = [
  { id: 'black', label: 'Black', hex: '#1C1C1E', neutral: true },
  { id: 'charcoal', label: 'Charcoal', hex: '#3F4247', neutral: true },
  { id: 'grey', label: 'Grey', hex: '#9EA2A8', neutral: true },
  { id: 'white', label: 'White', hex: '#FAFAF7', neutral: true },
  { id: 'cream', label: 'Cream', hex: '#EFE6D2', neutral: true },
  { id: 'beige', label: 'Beige', hex: '#D6C2A1', neutral: true },
  { id: 'khaki', label: 'Khaki', hex: '#B9A77D', neutral: true },
  { id: 'brown', label: 'Brown', hex: '#7A4E2D', neutral: true },
  { id: 'navy', label: 'Navy', hex: '#1F2B4A', neutral: true },
  { id: 'denim', label: 'Denim', hex: '#4D6E9E', neutral: true },
  { id: 'olive', label: 'Olive', hex: '#65673E', neutral: true },
  { id: 'blue', label: 'Blue', hex: '#2F6BD0', neutral: false },
  { id: 'light-blue', label: 'Light blue', hex: '#A9C8EC', neutral: false },
  { id: 'green', label: 'Green', hex: '#2F7D4E', neutral: false },
  { id: 'lime', label: 'Lime', hex: '#C8DE3C', neutral: false },
  { id: 'yellow', label: 'Yellow', hex: '#F1C232', neutral: false },
  { id: 'orange', label: 'Orange', hex: '#E5772D', neutral: false },
  { id: 'red', label: 'Red', hex: '#CF2E2E', neutral: false },
  { id: 'burgundy', label: 'Burgundy', hex: '#73203A', neutral: false },
  { id: 'pink', label: 'Pink', hex: '#EFA3C0', neutral: false },
  { id: 'lilac', label: 'Lilac', hex: '#C6B3DA', neutral: false },
  { id: 'purple', label: 'Purple', hex: '#6E4A9E', neutral: false },
  { id: 'silver', label: 'Silver', hex: '#BFC3C9', neutral: true },
  { id: 'gold', label: 'Gold', hex: '#C9A23A', neutral: true },
  { id: 'camo', label: 'Camo', hex: '#6B7058', neutral: false },
  { id: 'multi', label: 'Multicolour', hex: '#D9724B', neutral: false },
];

export const OCCASIONS = [
  { id: 'work', label: 'Work' },
  { id: 'casual', label: 'Casual' },
  { id: 'party', label: 'Party' },
  { id: 'date', label: 'Date' },
  { id: 'sport', label: 'Sport' },
];

export const CONDITIONS = [
  { id: 'clear', label: 'Clear' },
  { id: 'clouds', label: 'Cloudy' },
  { id: 'rain', label: 'Rain' },
  { id: 'drizzle', label: 'Drizzle' },
  { id: 'storm', label: 'Thunderstorm' },
  { id: 'snow', label: 'Snow' },
  { id: 'wind', label: 'Windy' },
];

export const LAUNDRY_STATUSES = [
  { id: 'clean', label: 'Clean' },
  { id: 'hamper', label: 'In hamper' },
  { id: 'washing', label: 'In the wash' },
];

/** Outfit slots in the order they are composed and displayed. */
export const SLOTS = ['outerwear', 'top', 'bottom', 'footwear', 'accessory'];

/** Warmth scale used by item forms and the outfit engine (1 = lightest). */
export const WARMTH_LEVELS = [
  { value: 1, label: 'Very light' },
  { value: 2, label: 'Light' },
  { value: 3, label: 'Medium' },
  { value: 4, label: 'Warm' },
  { value: 5, label: 'Very warm' },
];

/** Typical warmth per type, used as a smart default in the item form. */
export const DEFAULT_WARMTH = {
  't-shirt': 1,
  tank: 1,
  shirt: 2,
  polo: 2,
  'long-sleeve': 2,
  sweatshirt: 3,
  hoodie: 3,
  sweater: 4,
  jeans: 3,
  chinos: 2,
  trousers: 3,
  'cargo pants': 3,
  shorts: 1,
  sweatpants: 3,
  leggings: 2,
  skirt: 2,
  jacket: 3,
  bomber: 3,
  'denim jacket': 3,
  'leather jacket': 3,
  windbreaker: 2,
  blazer: 3,
  cardigan: 3,
  coat: 4,
  parka: 5,
  sneakers: 2,
  trainers: 2,
  boots: 4,
  loafers: 2,
  derbies: 2,
  sandals: 1,
  heels: 2,
  bag: 2,
  'belt bag': 2,
  cap: 2,
  hat: 2,
  'bucket hat': 2,
  beanie: 5,
  scarf: 5,
  sunglasses: 1,
  glasses: 2,
  necklace: 2,
};

const byId = (list) => Object.fromEntries(list.map((entry) => [entry.id, entry]));

export const CATEGORY_BY_ID = byId(CATEGORIES);
export const COLOR_BY_ID = byId(COLORS);
export const OCCASION_BY_ID = byId(OCCASIONS);
export const CONDITION_BY_ID = byId(CONDITIONS);
export const LAUNDRY_STATUS_BY_ID = byId(LAUNDRY_STATUSES);

/** Every type id mapped to its category id. */
export const TYPE_TO_CATEGORY = Object.fromEntries(
  Object.entries(TYPES).flatMap(([category, types]) => types.map((type) => [type, category])),
);

/** Category entry for an id, or undefined. */
export function getCategory(id) {
  return CATEGORY_BY_ID[id];
}

/** Colour entry for an id, or undefined. */
export function getColor(id) {
  return COLOR_BY_ID[id];
}

/** Occasion entry for an id, or undefined. */
export function getOccasion(id) {
  return OCCASION_BY_ID[id];
}

/** True when the colour id is a neutral (unknown ids count as neutral). */
export function isNeutralColor(id) {
  const color = COLOR_BY_ID[id];
  return color ? color.neutral : true;
}

/** Display label for a type id: 'cargo pants' -> 'Cargo pants', 't-shirt' -> 'T-shirt'. */
export function typeLabel(type) {
  if (!type) return '';
  return type.charAt(0).toUpperCase() + type.slice(1);
}

/** Display label for a colour id (falls back to the id). */
export function colorLabel(id) {
  return COLOR_BY_ID[id]?.label ?? id;
}

/** Display label for an occasion id (falls back to the id). */
export function occasionLabel(id) {
  return OCCASION_BY_ID[id]?.label ?? id;
}

/** Display label for a condition id (falls back to the id). */
export function conditionLabel(id) {
  return CONDITION_BY_ID[id]?.label ?? id;
}
