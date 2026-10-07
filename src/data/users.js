/**
 * Seed accounts for the mock backend.
 *
 * DEMO DATA ONLY: these plaintext passwords exist so the demo can be signed into.
 * They are hashed (SHA-256 with a per-user salt) when the local database is seeded
 * and are never stored or returned in plaintext.
 *
 * `wardrobe`: 'full' seeds the whole sample wardrobe plus wear history,
 * an array of sample keys seeds just those items, [] seeds nothing.
 * `createdDaysAgo` is relative to the day the database is seeded.
 */
export const DEMO_EMAIL = 'demo@alclo.app';
export const DEMO_PASSWORD = 'closet2026';

export const SEED_USERS = [
  {
    key: 'anesu',
    name: 'Anesu Mashonga',
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    avatar: { type: 'initials', value: 'AM' },
    onboarded: true,
    createdDaysAgo: 128,
    preferences: {
      tempUnit: 'C',
      city: 'Harare',
      weatherSource: 'simulated',
      defaultOccasion: 'work',
      urgentAfterDays: 3,
      occasions: ['work', 'casual'],
    },
    wardrobe: 'full',
  },
  {
    key: 'tariro',
    name: 'Tariro Moyo',
    email: 'tariro.moyo@example.com',
    password: 'kopje-sunrise7',
    avatar: { type: 'initials', value: 'TM' },
    onboarded: true,
    createdDaysAgo: 41,
    preferences: {
      tempUnit: 'C',
      city: 'Bulawayo',
      weatherSource: 'simulated',
      defaultOccasion: 'casual',
      urgentAfterDays: 4,
      occasions: ['casual', 'sport'],
    },
    wardrobe: [
      'white-oversized-tee',
      'red-graphic-hoodie',
      'mid-blue-jeans',
      'white-joggers',
      'white-running-trainers',
      'olive-sport-sandals',
      'light-wash-denim-jacket',
      'white-bucket-hat',
    ],
  },
  {
    key: 'kudzai',
    name: 'Kudzai Ncube',
    email: 'kudzai.ncube@example.com',
    password: 'harare-jacaranda4',
    avatar: { type: 'initials', value: 'KN' },
    onboarded: false,
    createdDaysAgo: 2,
    preferences: {
      tempUnit: 'C',
      city: 'Harare',
      weatherSource: 'simulated',
      defaultOccasion: 'casual',
      urgentAfterDays: 3,
      occasions: ['casual'],
    },
    wardrobe: [],
  },
];

/** Preferences every new account starts with. */
export const DEFAULT_PREFERENCES = {
  tempUnit: 'C',
  city: 'Harare',
  weatherSource: 'simulated',
  defaultOccasion: 'casual',
  urgentAfterDays: 3,
  occasions: ['casual'],
};
