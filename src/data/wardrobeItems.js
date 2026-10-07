/**
 * Sample wardrobe: one entry per product photo in src/assets/wardrobe, plus two
 * items without a photo to exercise the no-image fallback.
 * Seeded for the demo user and offered to new users during onboarding.
 *
 * `key` is stable across reseeds and is used by saved outfits and plans.
 * Prices are in USD. `washAfter` follows DEFAULT_WASH_AFTER (null = not laundered).
 */
import { DEFAULT_WASH_AFTER } from '@/lib/laundry';

import blackBlazer from '@/assets/wardrobe/black-blazer.jpg';
import blackBodyBag from '@/assets/wardrobe/black-body-bag.jpg';
import blackChinos from '@/assets/wardrobe/black-chinos.jpg';
import blackCurbChain from '@/assets/wardrobe/black-curb-chain-necklace.jpg';
import blackLeatherJacket from '@/assets/wardrobe/black-leather-jacket.jpg';
import blackPearlPendant from '@/assets/wardrobe/black-pearl-pendant.jpg';
import blackSnapback from '@/assets/wardrobe/black-snapback.jpg';
import blackSneakers from '@/assets/wardrobe/black-sneakers.jpg';
import blackTShirt from '@/assets/wardrobe/black-t-shirt.jpg';
import blueDenimJacket from '@/assets/wardrobe/blue-denim-jacket.jpg';
import blueDenimShorts from '@/assets/wardrobe/blue-denim-shorts.jpg';
import blueJeans from '@/assets/wardrobe/blue-jeans.avif';
import blueLoafers from '@/assets/wardrobe/blue-loafers.jpg';
import bluePolarizedSunglasses from '@/assets/wardrobe/blue-polarized-sunglasses.jpg';
import bluePolo from '@/assets/wardrobe/blue-polo.jpg';
import blueWindbreaker from '@/assets/wardrobe/blue-windbreaker.jpg';
import brownBodyBag from '@/assets/wardrobe/brown-body-bag.jpg';
import brownBoots from '@/assets/wardrobe/brown-boots.jpg';
import brownCowboyHat from '@/assets/wardrobe/brown-cowboy-hat.jpg';
import burgundyPlatformDerbies from '@/assets/wardrobe/burgundy-platform-derbies.jpg';
import camoBeanie from '@/assets/wardrobe/camo-beanie.jpg';
import darkSunglasses from '@/assets/wardrobe/dark-sunglasses.jpg';
import greenCargoPants from '@/assets/wardrobe/green-cargo-pants.jpg';
import greenSandals from '@/assets/wardrobe/green-sandals.jpg';
import greenSweater from '@/assets/wardrobe/green-sweater.jpg';
import greyBeltBag from '@/assets/wardrobe/grey-belt-bag.jpg';
import greyCap from '@/assets/wardrobe/grey-cap.jpg';
import greyJacket from '@/assets/wardrobe/grey-jacket.jpg';
import greyLongSleeve from '@/assets/wardrobe/grey-long-sleeve.jpg';
import greySweatpants from '@/assets/wardrobe/grey-sweatpants.jpg';
import khakiShorts from '@/assets/wardrobe/khaki-shorts.jpg';
import redCoat from '@/assets/wardrobe/red-coat.jpg';
import redHoodie from '@/assets/wardrobe/red-hoodie.jpg';
import redLeggings from '@/assets/wardrobe/red-leggings.jpg';
import silverArrowheadNecklace from '@/assets/wardrobe/silver-arrowhead-necklace.jpg';
import stripedShirt from '@/assets/wardrobe/striped-shirt.jpg';
import whiteBucketHat from '@/assets/wardrobe/white-bucket-hat.jpg';
import whiteCardigan from '@/assets/wardrobe/white-cardigan.jpg';
import whiteFrameGlasses from '@/assets/wardrobe/white-frame-glasses.jpg';
import whiteShirt from '@/assets/wardrobe/white-shirt.jpg';
import whiteShorts from '@/assets/wardrobe/white-shorts.jpg';
import whiteTrainers from '@/assets/wardrobe/white-trainers.jpg';
import yellowTank from '@/assets/wardrobe/yellow-tank.png';

const UNLAUNDERED = new Set(['footwear', 'accessory']);

/** Fills in the defaults every sample item shares. */
function sample(entry) {
  return {
    brand: null,
    notes: '',
    waterproof: false,
    favorite: false,
    ...entry,
    washAfter: UNLAUNDERED.has(entry.category) ? null : (DEFAULT_WASH_AFTER[entry.type] ?? null),
  };
}

export const SAMPLE_WARDROBE = [
  // Tops
  sample({
    key: 'black-graphic-tee',
    name: 'Black lumberjack graphic tee',
    category: 'top',
    type: 't-shirt',
    colors: ['black', 'white'],
    warmth: 1,
    occasions: ['casual', 'party'],
    price: 24,
    image: blackTShirt,
  }),
  sample({
    key: 'rugby-stripe-polo',
    name: 'Light blue rugby stripe polo',
    category: 'top',
    type: 'polo',
    colors: ['light-blue', 'white'],
    warmth: 2,
    occasions: ['work', 'casual', 'date'],
    price: 46,
    favorite: true,
    image: bluePolo,
  }),
  sample({
    key: 'lime-ombre-sweatshirt',
    name: 'Lime ombre crewneck sweatshirt',
    category: 'top',
    type: 'sweatshirt',
    colors: ['lime', 'white'],
    warmth: 3,
    occasions: ['casual', 'sport'],
    price: 39,
    image: greenSweater,
  }),
  sample({
    key: 'white-jacquard-shirt',
    name: 'White leaf jacquard dress shirt',
    category: 'top',
    type: 'shirt',
    colors: ['white'],
    warmth: 2,
    occasions: ['work', 'date', 'party'],
    price: 58,
    favorite: true,
    image: greyLongSleeve,
  }),
  sample({
    key: 'red-graphic-hoodie',
    name: 'Red graphic hoodie',
    category: 'top',
    type: 'hoodie',
    colors: ['red', 'grey'],
    warmth: 3,
    occasions: ['casual', 'sport'],
    price: 52,
    image: redHoodie,
  }),
  sample({
    key: 'geometric-print-tee',
    name: 'Geometric print tee',
    category: 'top',
    type: 't-shirt',
    colors: ['multi'],
    warmth: 1,
    occasions: ['casual', 'party'],
    price: 29,
    image: stripedShirt,
  }),
  sample({
    key: 'ivory-cable-knit',
    name: 'Ivory cable-knit shawl collar sweater',
    category: 'top',
    type: 'sweater',
    colors: ['cream'],
    warmth: 4,
    occasions: ['work', 'casual', 'date'],
    price: 74,
    image: whiteCardigan,
  }),
  sample({
    key: 'white-oversized-tee',
    name: 'White oversized tee',
    category: 'top',
    type: 't-shirt',
    colors: ['white'],
    warmth: 1,
    occasions: ['casual', 'sport'],
    price: 21,
    favorite: true,
    image: whiteShirt,
  }),
  sample({
    key: 'yellow-mesh-tank',
    name: 'Yellow mesh basketball tank',
    category: 'top',
    type: 'tank',
    colors: ['yellow', 'white'],
    warmth: 1,
    occasions: ['sport', 'casual'],
    price: 27,
    image: yellowTank,
  }),

  // Bottoms
  sample({
    key: 'black-check-trousers',
    name: 'Black windowpane check trousers',
    category: 'bottom',
    type: 'trousers',
    colors: ['black', 'grey'],
    warmth: 2,
    occasions: ['work', 'party', 'date'],
    price: 64,
    favorite: true,
    image: blackChinos,
  }),
  sample({
    key: 'acid-wash-denim-shorts',
    name: 'Acid-wash ripped denim shorts',
    category: 'bottom',
    type: 'shorts',
    colors: ['denim', 'white'],
    warmth: 1,
    occasions: ['casual'],
    price: 33,
    image: blueDenimShorts,
  }),
  sample({
    key: 'mid-blue-jeans',
    name: 'Mid-blue straight jeans',
    category: 'bottom',
    type: 'jeans',
    colors: ['denim'],
    warmth: 3,
    occasions: ['casual', 'date', 'party'],
    price: 68,
    favorite: true,
    image: blueJeans,
  }),
  sample({
    key: 'olive-cargo-pants',
    name: 'Olive cargo pants',
    category: 'bottom',
    type: 'cargo pants',
    colors: ['olive'],
    warmth: 3,
    occasions: ['casual'],
    price: 49,
    image: greenCargoPants,
  }),
  sample({
    key: 'white-joggers',
    name: 'White joggers with yellow drawcord',
    category: 'bottom',
    type: 'sweatpants',
    colors: ['white', 'yellow'],
    warmth: 3,
    occasions: ['casual', 'sport'],
    price: 42,
    image: greySweatpants,
  }),
  sample({
    key: 'sloth-sweat-shorts',
    name: 'Blue sloth graphic sweat shorts',
    category: 'bottom',
    type: 'shorts',
    colors: ['blue', 'grey'],
    warmth: 1,
    occasions: ['sport', 'casual'],
    price: 26,
    image: khakiShorts,
  }),
  sample({
    key: 'red-compression-tights',
    name: 'Red compression tights',
    category: 'bottom',
    type: 'leggings',
    colors: ['red'],
    warmth: 2,
    occasions: ['sport'],
    price: 31,
    image: redLeggings,
  }),
  sample({
    key: 'white-fleece-shorts',
    name: 'White fleece drawstring shorts',
    category: 'bottom',
    type: 'shorts',
    colors: ['white'],
    warmth: 1,
    occasions: ['casual', 'sport'],
    price: 28,
    image: whiteShorts,
  }),

  // Outerwear
  sample({
    key: 'black-blazer',
    name: 'Black two-button blazer',
    category: 'outerwear',
    type: 'blazer',
    colors: ['black'],
    warmth: 3,
    occasions: ['work', 'party', 'date'],
    price: 119,
    image: blackBlazer,
  }),
  sample({
    key: 'black-leather-biker',
    name: 'Black leather biker jacket',
    category: 'outerwear',
    type: 'leather jacket',
    colors: ['black', 'silver'],
    warmth: 4,
    occasions: ['casual', 'party', 'date'],
    price: 189,
    favorite: true,
    image: blackLeatherJacket,
  }),
  sample({
    key: 'light-wash-denim-jacket',
    name: 'Light-wash distressed denim jacket',
    category: 'outerwear',
    type: 'denim jacket',
    colors: ['denim', 'light-blue'],
    warmth: 3,
    occasions: ['casual', 'date'],
    price: 72,
    image: blueDenimJacket,
  }),
  sample({
    key: 'blue-bomber',
    name: 'Blue bomber with striped trim',
    category: 'outerwear',
    type: 'bomber',
    colors: ['blue', 'white'],
    warmth: 2,
    occasions: ['casual', 'sport'],
    price: 56,
    image: blueWindbreaker,
  }),
  sample({
    key: 'grey-bomber',
    name: 'Grey bomber jacket',
    category: 'outerwear',
    type: 'bomber',
    colors: ['grey'],
    warmth: 3,
    occasions: ['casual', 'work'],
    price: 61,
    image: greyJacket,
  }),
  sample({
    key: 'burgundy-overcoat',
    name: 'Burgundy wool overcoat',
    category: 'outerwear',
    type: 'coat',
    colors: ['burgundy', 'black'],
    warmth: 4,
    occasions: ['work', 'date', 'party'],
    price: 147,
    image: redCoat,
  }),
  sample({
    key: 'olive-rain-parka',
    name: 'Olive hooded rain parka',
    category: 'outerwear',
    type: 'parka',
    colors: ['olive'],
    warmth: 4,
    occasions: ['casual', 'work'],
    waterproof: true,
    price: 129,
    image: null,
  }),

  // Footwear
  sample({
    key: 'black-high-top-sneakers',
    name: 'Black leather high-top sneakers',
    category: 'footwear',
    type: 'sneakers',
    colors: ['black'],
    warmth: 3,
    occasions: ['casual', 'sport', 'party'],
    price: 74,
    image: blackSneakers,
  }),
  sample({
    key: 'navy-velvet-loafers',
    name: 'Navy velvet loafers',
    category: 'footwear',
    type: 'loafers',
    colors: ['navy'],
    warmth: 2,
    occasions: ['work', 'date', 'party'],
    price: 88,
    image: blueLoafers,
  }),
  sample({
    key: 'wheat-work-boots',
    name: 'Wheat nubuck work boots',
    category: 'footwear',
    type: 'boots',
    colors: ['brown'],
    warmth: 4,
    occasions: ['casual', 'work'],
    waterproof: true,
    price: 97,
    image: brownBoots,
  }),
  sample({
    key: 'burgundy-platform-derbies',
    name: 'Burgundy patent platform derbies',
    category: 'footwear',
    type: 'derbies',
    colors: ['burgundy', 'black'],
    warmth: 2,
    occasions: ['party', 'date', 'work'],
    price: 112,
    image: burgundyPlatformDerbies,
  }),
  sample({
    key: 'olive-sport-sandals',
    name: 'Olive sport sandals',
    category: 'footwear',
    type: 'sandals',
    colors: ['olive'],
    warmth: 1,
    occasions: ['casual', 'sport'],
    price: 43,
    image: greenSandals,
  }),
  sample({
    key: 'white-running-trainers',
    name: 'White running trainers',
    category: 'footwear',
    type: 'trainers',
    colors: ['white'],
    warmth: 2,
    occasions: ['casual', 'sport'],
    brand: 'Nike',
    price: 69,
    favorite: true,
    image: whiteTrainers,
  }),

  // Accessories
  sample({
    key: 'black-crossbody-bag',
    name: 'Black nylon crossbody bag',
    category: 'accessory',
    type: 'bag',
    colors: ['black'],
    warmth: 2,
    occasions: ['work', 'casual'],
    price: 34,
    image: blackBodyBag,
  }),
  sample({
    key: 'tan-leather-messenger',
    name: 'Tan leather messenger bag',
    category: 'accessory',
    type: 'bag',
    colors: ['brown'],
    warmth: 2,
    occasions: ['work', 'casual', 'date'],
    price: 79,
    image: brownBodyBag,
  }),
  sample({
    key: 'lilac-suede-belt-bag',
    name: 'Lilac suede belt bag',
    category: 'accessory',
    type: 'belt bag',
    colors: ['lilac'],
    warmth: 2,
    occasions: ['casual', 'date'],
    brand: 'Aquatalia',
    price: 238,
    image: greyBeltBag,
  }),
  sample({
    key: 'nasa-snapback',
    name: 'Black NASA patch snapback',
    category: 'accessory',
    type: 'cap',
    colors: ['black', 'blue'],
    warmth: 2,
    occasions: ['casual'],
    price: 28,
    image: blackSnapback,
  }),
  sample({
    key: 'washed-charcoal-cap',
    name: 'Washed charcoal baseball cap',
    category: 'accessory',
    type: 'cap',
    colors: ['charcoal'],
    warmth: 2,
    occasions: ['casual', 'sport'],
    price: 18,
    image: greyCap,
  }),
  sample({
    key: 'camo-running-cap',
    name: 'Blue camo running cap',
    category: 'accessory',
    type: 'cap',
    colors: ['camo', 'navy'],
    warmth: 2,
    occasions: ['sport'],
    price: 19,
    image: camoBeanie,
  }),
  sample({
    key: 'white-bucket-hat',
    name: 'White cotton bucket hat',
    category: 'accessory',
    type: 'bucket hat',
    colors: ['white'],
    warmth: 2,
    occasions: ['casual'],
    price: 23,
    image: whiteBucketHat,
  }),
  sample({
    key: 'brown-cowboy-hat',
    name: 'Brown felt cowboy hat',
    category: 'accessory',
    type: 'hat',
    colors: ['brown', 'black'],
    warmth: 3,
    occasions: ['party', 'casual'],
    price: 45,
    image: brownCowboyHat,
  }),
  sample({
    key: 'charcoal-ribbed-beanie',
    name: 'Charcoal ribbed beanie',
    category: 'accessory',
    type: 'beanie',
    colors: ['charcoal'],
    warmth: 5,
    occasions: ['casual', 'sport'],
    price: 16,
    image: null,
  }),
  sample({
    key: 'black-square-sunglasses',
    name: 'Black square sunglasses',
    category: 'accessory',
    type: 'sunglasses',
    colors: ['black'],
    warmth: 1,
    occasions: ['casual', 'date', 'party'],
    price: 32,
    image: darkSunglasses,
  }),
  sample({
    key: 'blue-mirrored-sunglasses',
    name: 'Blue mirrored sunglasses',
    category: 'accessory',
    type: 'sunglasses',
    colors: ['black', 'blue'],
    warmth: 1,
    occasions: ['casual', 'sport'],
    price: 38,
    image: bluePolarizedSunglasses,
  }),
  sample({
    key: 'clear-audio-glasses',
    name: 'Clear frame audio glasses',
    category: 'accessory',
    type: 'glasses',
    colors: ['white'],
    warmth: 1,
    occasions: ['work', 'casual'],
    price: 149,
    image: whiteFrameGlasses,
  }),
  sample({
    key: 'black-curb-chain',
    name: 'Black curb chain necklace',
    category: 'accessory',
    type: 'necklace',
    colors: ['black'],
    warmth: 1,
    occasions: ['party', 'date'],
    price: 22,
    image: blackCurbChain,
  }),
  sample({
    key: 'black-pearl-pendant',
    name: 'Black pearl pendant',
    category: 'accessory',
    type: 'necklace',
    colors: ['black', 'silver'],
    warmth: 1,
    occasions: ['date', 'party'],
    price: 86,
    image: blackPearlPendant,
  }),
  sample({
    key: 'arrowhead-pendant',
    name: 'Arrowhead pendant on black cord',
    category: 'accessory',
    type: 'necklace',
    colors: ['silver', 'black'],
    warmth: 1,
    occasions: ['party', 'casual'],
    price: 17,
    image: silverArrowheadNecklace,
  }),
];

/** Sample entries by key. */
export const SAMPLE_BY_KEY = Object.fromEntries(SAMPLE_WARDROBE.map((entry) => [entry.key, entry]));
