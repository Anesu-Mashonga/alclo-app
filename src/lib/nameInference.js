/**
 * Infers category, type and colours from an item name so the item form can offer
 * one-click suggestions: "navy chinos" -> bottom / chinos / [navy].
 */
import { TYPE_TO_CATEGORY } from '@/data/taxonomy';

/** Words people use for each type id. Longer phrases win over shorter ones. */
const TYPE_SYNONYMS = {
  't-shirt': ['t-shirt', 't-shirts', 't shirt', 'tshirt', 'tee', 'tees', 'graphic tee'],
  shirt: ['shirt', 'shirts', 'dress shirt', 'button-down', 'button down', 'oxford', 'oxford shirt', 'overshirt', 'blouse', 'flannel'],
  polo: ['polo', 'polos', 'polo shirt', 'rugby shirt'],
  tank: ['tank', 'tank top', 'vest top', 'vest', 'singlet', 'camisole', 'cami', 'basketball jersey'],
  'long-sleeve': ['long sleeve', 'long-sleeve', 'longsleeve', 'henley', 'turtleneck', 'roll neck', 'rollneck'],
  sweatshirt: ['sweatshirt', 'crewneck', 'crew neck', 'sweat top'],
  hoodie: ['hoodie', 'hoody', 'hoodies', 'hooded sweatshirt', 'zip hoodie'],
  sweater: ['sweater', 'jumper', 'pullover', 'knit', 'knitwear', 'cable-knit', 'cable knit'],
  jeans: ['jeans', 'jean', 'denims'],
  chinos: ['chinos', 'chino'],
  trousers: ['trousers', 'trouser', 'pants', 'slacks', 'dress pants'],
  'cargo pants': ['cargo pants', 'cargos', 'cargo trousers', 'cargo'],
  shorts: ['shorts', 'bermudas', 'bermuda shorts'],
  sweatpants: ['sweatpants', 'joggers', 'jogger', 'track pants', 'trackies', 'tracksuit bottoms'],
  leggings: ['leggings', 'tights', 'compression tights'],
  skirt: ['skirt', 'skirts', 'midi skirt', 'mini skirt'],
  jacket: ['jacket', 'jackets', 'puffer', 'puffer jacket', 'shacket', 'fleece'],
  bomber: ['bomber', 'bomber jacket', 'varsity jacket'],
  'denim jacket': ['denim jacket', 'jean jacket', 'trucker jacket'],
  'leather jacket': ['leather jacket', 'biker jacket', 'biker'],
  windbreaker: ['windbreaker', 'rain jacket', 'rain shell', 'shell jacket', 'anorak', 'cagoule'],
  blazer: ['blazer', 'sport coat', 'suit jacket', 'sports jacket'],
  cardigan: ['cardigan', 'cardi'],
  coat: ['coat', 'overcoat', 'trench', 'trench coat', 'peacoat', 'pea coat', 'topcoat', 'mac'],
  parka: ['parka', 'down jacket', 'rain parka'],
  sneakers: ['sneakers', 'sneaker', 'high-tops', 'high tops', 'kicks'],
  trainers: ['trainers', 'trainer', 'running shoes', 'runners'],
  boots: ['boots', 'boot', 'chelsea boots', 'work boots'],
  loafers: ['loafers', 'loafer', 'slip-ons', 'moccasins'],
  derbies: ['derbies', 'derby', 'oxfords', 'brogues', 'dress shoes'],
  sandals: ['sandals', 'sandal', 'slides', 'sliders', 'flip flops', 'flip-flops'],
  heels: ['heels', 'heel', 'pumps', 'stilettos'],
  bag: ['bag', 'backpack', 'tote', 'messenger', 'messenger bag', 'crossbody', 'cross-body', 'satchel', 'handbag', 'clutch', 'body bag', 'bodybag'],
  'belt bag': ['belt bag', 'fanny pack', 'fannypack', 'bum bag', 'waist bag', 'sling bag'],
  cap: ['cap', 'baseball cap', 'snapback', 'trucker cap', 'dad hat', 'running cap'],
  hat: ['hat', 'fedora', 'cowboy hat', 'panama'],
  'bucket hat': ['bucket hat', 'bucket'],
  beanie: ['beanie', 'toque', 'skullcap', 'skull cap', 'woolly hat'],
  scarf: ['scarf', 'snood'],
  sunglasses: ['sunglasses', 'sunnies', 'shades'],
  glasses: ['glasses', 'spectacles', 'frames', 'specs'],
  necklace: ['necklace', 'chain', 'pendant'],
};

/** Words that only tell us the category. */
const CATEGORY_HINTS = {
  top: ['top', 'tops'],
  bottom: ['bottoms'],
  outerwear: ['outerwear', 'layer'],
  footwear: ['shoes', 'shoe', 'footwear'],
  accessory: ['accessory', 'jewellery', 'jewelry', 'watch', 'belt', 'bracelet', 'ring', 'earrings'],
};

/** Colour words mapped to taxonomy colour ids. */
const COLOR_SYNONYMS = {
  black: ['black', 'jet', 'onyx'],
  charcoal: ['charcoal', 'graphite', 'anthracite', 'dark grey', 'dark gray'],
  grey: ['grey', 'gray', 'heather', 'ash', 'light grey', 'light gray'],
  white: ['white', 'optic white', 'snow'],
  cream: ['cream', 'ivory', 'off-white', 'off white', 'ecru', 'oatmeal', 'bone'],
  beige: ['beige', 'stone', 'sand', 'camel', 'taupe'],
  khaki: ['khaki'],
  brown: ['brown', 'chocolate', 'tan', 'cognac', 'mocha', 'espresso', 'chestnut', 'wheat'],
  navy: ['navy', 'navy blue', 'midnight'],
  denim: ['denim', 'indigo', 'acid-wash', 'acid wash'],
  olive: ['olive', 'army green', 'khaki green', 'military green'],
  blue: ['blue', 'cobalt', 'royal blue', 'electric blue'],
  'light-blue': ['light blue', 'light-blue', 'sky blue', 'baby blue', 'pale blue', 'powder blue'],
  green: ['green', 'forest green', 'emerald', 'bottle green', 'kelly green', 'sage'],
  lime: ['lime', 'neon green', 'chartreuse'],
  yellow: ['yellow', 'mustard', 'lemon'],
  orange: ['orange', 'rust', 'burnt orange', 'terracotta'],
  red: ['red', 'scarlet', 'crimson', 'cherry'],
  burgundy: ['burgundy', 'maroon', 'wine', 'oxblood', 'claret'],
  pink: ['pink', 'rose', 'blush', 'fuchsia'],
  lilac: ['lilac', 'lavender', 'mauve'],
  purple: ['purple', 'violet', 'plum'],
  silver: ['silver', 'metallic silver'],
  gold: ['gold', 'golden', 'brass'],
  camo: ['camo', 'camouflage'],
  multi: ['multicolour', 'multicolor', 'multi-colour', 'multi-color', 'multi', 'rainbow', 'print', 'patterned', 'geometric'],
};

function buildPhraseList(map) {
  return Object.entries(map)
    .flatMap(([id, phrases]) => phrases.map((phrase) => ({ id, phrase })))
    .sort((a, b) => b.phrase.length - a.phrase.length);
}

const TYPE_PHRASES = buildPhraseList(TYPE_SYNONYMS);
const COLOR_PHRASES = buildPhraseList(COLOR_SYNONYMS);
const CATEGORY_PHRASES = buildPhraseList(CATEGORY_HINTS);

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function normalise(name) {
  return ` ${String(name ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()} `;
}

/**
 * Finds phrase matches in `text`, longest phrases first. Matched spans are blanked
 * so shorter phrases cannot match inside them ("light blue" beats "blue").
 * Returns matches with their position and the remaining text.
 */
function scan(text, phrases) {
  let remaining = text;
  const matches = [];
  for (const { id, phrase } of phrases) {
    const re = new RegExp(`(?<=\\s)${escapeRegExp(phrase)}(?=\\s)`, 'g');
    let result = re.exec(remaining);
    while (result) {
      matches.push({ id, index: result.index });
      remaining = remaining.slice(0, result.index) + ' '.repeat(phrase.length) + remaining.slice(result.index + phrase.length);
      re.lastIndex = result.index + phrase.length;
      result = re.exec(remaining);
    }
  }
  return { matches, remaining };
}

/**
 * Suggests category, type and colours for an item name.
 * Unknown parts come back as null or an empty array.
 * @param {string} name
 * @returns {{ category: string|null, type: string|null, colors: string[] }}
 */
export function inferFromName(name) {
  const text = normalise(name);
  if (text.trim() === '') return { category: null, type: null, colors: [] };

  const typeScan = scan(text, TYPE_PHRASES);
  // In English the garment noun usually comes last ("denim shirt" is a shirt).
  const typeMatch = [...typeScan.matches].sort((a, b) => b.index - a.index)[0];
  const type = typeMatch?.id ?? null;

  let category = type ? TYPE_TO_CATEGORY[type] : null;
  if (!category) {
    const hint = scan(typeScan.remaining, CATEGORY_PHRASES).matches.sort((a, b) => b.index - a.index)[0];
    category = hint?.id ?? null;
  }

  const colorScan = scan(typeScan.remaining, COLOR_PHRASES);
  const colors = [];
  for (const match of [...colorScan.matches].sort((a, b) => a.index - b.index)) {
    if (!colors.includes(match.id)) colors.push(match.id);
  }
  if (colors.length === 0 && (type === 'jeans' || type === 'denim jacket')) colors.push('denim');

  return { category, type, colors: colors.slice(0, 3) };
}
