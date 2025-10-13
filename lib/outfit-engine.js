import dayjs from 'dayjs';

export function sampleOutfitForDay(wardrobe, weather, event) {
  // Enhanced outfit engine that ensures all categories are represented
  // 1) prefer items not recently worn (7+ days)
  // 2) match weather (temp threshold)
  // 3) basic event mapping
  // 4) ensure all main categories (TOP, OUTER, BOTTOM, SHOES) are filled

  const now = dayjs();
  const candidates = wardrobe.slice();

  // score items
  const scored = candidates.map((it) => {
    const last = it.lastWorn ? dayjs(it.lastWorn) : dayjs('1970-01-01');
    const daysAgo = now.diff(last, 'day');
    let score = daysAgo; // more days = higher score

    // weather heuristics
    if (it.type === 'outer' && weather.tempC < 20) score += 10; // Increased priority for cold weather
    if (it.type === 'shoes' && weather.condition.toLowerCase().includes('rain')) score -= 5;

    // event mapping - enhanced
    if (event === 'Work') {
      if (it.type === 'top' && (it.name.toLowerCase().includes('shirt') || it.name.toLowerCase().includes('blazer'))) score += 8;
      if (it.type === 'bottom' && (it.name.toLowerCase().includes('chino') || it.name.toLowerCase().includes('trouser'))) score += 5;
      if (it.type === 'shoes' && (it.name.toLowerCase().includes('loafer') || it.name.toLowerCase().includes('boot'))) score += 5;
    }

    // Casual event preferences
    if (event === 'Casual') {
      if (it.type === 'top' && (it.name.toLowerCase().includes('t-shirt') || it.name.toLowerCase().includes('polo'))) score += 8;
      if (it.type === 'bottom' && (it.name.toLowerCase().includes('jean') || it.name.toLowerCase().includes('short'))) score += 5;
    }

    return { ...it, score };
  });

  // Get best items for each category
  const getBestItem = (type) => {
    const items = scored.filter((s) => s.type === type).sort((a, b) => b.score - a.score);
    return items.length > 0 ? items[0] : null;
  };

  // Always try to get items for main categories
  const top = getBestItem('top');
  const bottom = getBestItem('bottom');
  const shoes = getBestItem('shoes');
  const outer = getBestItem('outer');

  // Build main outfit items (ensure we have at least 3 core items)
  const mainItems = [top, bottom, shoes].filter(Boolean);

  // Add outerwear based on temperature (more flexible threshold)
  if (outer && weather.tempC < 25) {
    mainItems.push(outer);
  }

  // Add 1-2 accessories if available and weather permits
  const accessories = scored
    .filter((s) => s.type === 'accessories')
    .sort((a, b) => b.score - a.score)
    .slice(0, 2); // Take top 2 accessories

  const allItems = [...mainItems, ...accessories];

  // Ensure minimum outfit completeness
  if (allItems.length < 3) {
    console.warn('Limited wardrobe options available for outfit generation');
  }

  const reason = `Suggested for ${event} • ${weather.condition}, ${Math.round(weather.tempC)}°C`;

  return {
    items: allItems,
    reason,
    mainItems: mainItems.length, // For debugging
    accessoryCount: accessories.length // For debugging
  };
}
