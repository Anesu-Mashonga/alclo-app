const normalise = (text) =>
  String(text ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

const wordsOf = (texts) =>
  texts
    .flat()
    .flatMap((text) => normalise(text).split(/[^a-z0-9%]+/))
    .filter(Boolean);

/** Query terms: "Mid blue" -> ['mid', 'blue']. */
export const termsOf = (query) => normalise(query).split(/[^a-z0-9%]+/).filter(Boolean);

/**
 * Simple word-prefix matching: every query term must start some word of the label or keywords.
 * "lau" matches "Laundry", "st lo" matches "Start a load", "jea" matches "Mid-blue jeans".
 * @param {string[]} terms from termsOf(query)
 * @param {...(string|string[])} texts
 */
export function matchesTerms(terms, ...texts) {
  if (terms.length === 0) return true;
  const words = wordsOf(texts);
  return terms.every((term) => words.some((word) => word.startsWith(term)));
}

/**
 * Ranks a match: labels that start with the query come first, then label-word matches,
 * then keyword-only matches. Lower is better.
 */
export function matchRank(terms, label) {
  if (terms.length === 0) return 0;
  const text = normalise(label);
  if (text.startsWith(terms.join(' '))) return 0;
  return matchesTerms(terms, label) ? 1 : 2;
}
