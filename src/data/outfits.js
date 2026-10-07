/**
 * Saved outfits for the demo user. Items are referenced by sample wardrobe key
 * and resolved to item ids when the database is seeded.
 */
export const SEED_OUTFITS = [
  {
    key: 'monday-meetings',
    name: 'Monday meetings',
    occasion: 'work',
    favorite: true,
    itemKeys: [
      'black-blazer',
      'white-jacquard-shirt',
      'black-check-trousers',
      'navy-velvet-loafers',
      'tan-leather-messenger',
    ],
  },
  {
    key: 'saturday-errands',
    name: 'Saturday errands',
    occasion: 'casual',
    favorite: false,
    itemKeys: ['white-oversized-tee', 'mid-blue-jeans', 'white-running-trainers', 'washed-charcoal-cap'],
  },
  {
    key: 'friday-drinks',
    name: 'Friday drinks',
    occasion: 'party',
    favorite: true,
    itemKeys: [
      'black-leather-biker',
      'black-graphic-tee',
      'black-check-trousers',
      'burgundy-platform-derbies',
      'black-curb-chain',
    ],
  },
  {
    key: 'gym-session',
    name: 'Gym session',
    occasion: 'sport',
    favorite: false,
    itemKeys: ['yellow-mesh-tank', 'sloth-sweat-shorts', 'white-running-trainers', 'camo-running-cap'],
  },
  {
    key: 'sunday-lunch',
    name: 'Sunday lunch',
    occasion: 'date',
    favorite: false,
    itemKeys: ['rugby-stripe-polo', 'mid-blue-jeans', 'navy-velvet-loafers', 'black-square-sunglasses'],
  },
  {
    key: 'cold-front-layers',
    name: 'Cold front layers',
    occasion: 'casual',
    favorite: false,
    itemKeys: ['burgundy-overcoat', 'ivory-cable-knit', 'olive-cargo-pants', 'wheat-work-boots'],
  },
];
