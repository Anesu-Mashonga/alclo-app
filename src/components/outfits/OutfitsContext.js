import { createContext, useContext } from 'react';

/**
 * Page-level actions shared by the Outfits tabs:
 * { openBuilder({ mode, outfitId?, itemIds?, occasion?, name? }), openPlan({ date, plan? }), goToTab(tab) }
 */
export const OutfitsContext = createContext({
  openBuilder: () => {},
  openPlan: () => {},
  goToTab: () => {},
});

export function useOutfitsPage() {
  return useContext(OutfitsContext);
}
