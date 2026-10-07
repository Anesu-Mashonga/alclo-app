/**
 * Query key factory. Every key starts with its domain so a whole domain can be
 * invalidated at once (e.g. queryKeys.items.all).
 */

/** Drops empty values and sorts keys/arrays so equal filters produce equal keys. */
export function normalizeParams(params = {}) {
  const out = {};
  for (const key of Object.keys(params ?? {}).sort()) {
    const value = params[key];
    if (value === undefined || value === null || value === '' || value === 'all') continue;
    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      out[key] = [...value].sort();
    } else if (typeof value === 'object') {
      out[key] = normalizeParams(value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

/** The parts of a weather object that affect recommendations. */
export function weatherKey(weather) {
  if (!weather) return null;
  return {
    city: weather.city ?? null,
    t: weather.tempC ?? null,
    h: weather.highC ?? null,
    l: weather.lowC ?? null,
    c: weather.condition ?? null,
    p: weather.precipChance ?? null,
    w: weather.windKph ?? null,
  };
}

export const queryKeys = {
  items: {
    all: ['items'],
    lists: () => ['items', 'list'],
    list: (filters) => ['items', 'list', normalizeParams(filters)],
    detail: (id) => ['items', 'detail', id],
    history: (id) => ['items', 'history', id],
  },
  outfits: {
    all: ['outfits'],
    list: () => ['outfits', 'list'],
    detail: (id) => ['outfits', 'detail', id],
  },
  recommendation: {
    all: ['recommendation'],
    detail: (params) => ['recommendation', params],
  },
  alternatives: {
    all: ['alternatives'],
    detail: (params) => ['alternatives', params],
  },
  suggestions: {
    all: ['suggestions'],
    detail: (params) => ['suggestions', params],
  },
  wear: {
    all: ['wear'],
    today: (date) => ['wear', 'today', date],
    logs: (range) => ['wear', 'logs', normalizeParams(range)],
  },
  laundry: {
    all: ['laundry'],
    overview: () => ['laundry', 'overview'],
  },
  plans: {
    all: ['plans'],
    list: (range) => ['plans', 'list', normalizeParams(range)],
  },
  weather: {
    all: ['weather'],
    current: (params) => ['weather', 'current', normalizeParams(params)],
    cities: () => ['weather', 'cities'],
  },
  insights: {
    all: ['insights'],
    detail: (rangeDays) => ['insights', rangeDays],
  },
  dev: {
    all: ['dev'],
    settings: () => ['dev', 'settings'],
  },
};
