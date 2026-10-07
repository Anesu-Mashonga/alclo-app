/**
 * Planned days for the demo user, relative to the day the database is seeded
 * (dayOffset 1 = tomorrow). Each plan references a saved outfit by key or
 * sample items by key.
 */
export const SEED_PLANS = [
  {
    dayOffset: 1,
    outfitKey: 'monday-meetings',
    occasion: 'work',
    note: 'Budget review at 10:00',
  },
  {
    dayOffset: 3,
    itemKeys: ['grey-bomber', 'rugby-stripe-polo', 'black-check-trousers', 'burgundy-platform-derbies'],
    occasion: 'date',
    note: 'Dinner in Avondale at 19:30',
  },
  {
    dayOffset: 4,
    outfitKey: 'gym-session',
    occasion: 'sport',
    note: 'Five-a-side after work',
  },
];
