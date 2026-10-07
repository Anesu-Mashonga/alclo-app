import { useCallback } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';

/** Search param that holds the open item: /wardrobe?item=itm_123 */
export const ITEM_PARAM = 'item';

// Marks history entries this hook pushed, so closing can pop them instead of adding another.
const PUSHED_FLAG = 'alcloItemDrawer';

/**
 * URL-driven item drawer. Works on every app page and keeps the other search params.
 * Opening pushes a history entry (Back closes the drawer); switching between items while the
 * drawer is open replaces it, so Back still returns to the page underneath.
 *
 * @returns {{ itemId: string | null, isOpen: boolean, openItem: (id: string) => void, closeItem: () => void }}
 */
export default function useItemDrawer() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const itemId = searchParams.get(ITEM_PARAM);
  const locationState = location.state;

  const openItem = useCallback(
    (id) => {
      if (!id) return;
      const alreadyOpen = Boolean(itemId);
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          next.set(ITEM_PARAM, id);
          return next;
        },
        {
          replace: alreadyOpen,
          preventScrollReset: true,
          state: alreadyOpen ? locationState : { ...(locationState ?? {}), [PUSHED_FLAG]: true },
        },
      );
    },
    [itemId, locationState, setSearchParams],
  );

  const closeItem = useCallback(() => {
    if (!itemId) return;
    if (locationState?.[PUSHED_FLAG]) {
      navigate(-1);
      return;
    }
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.delete(ITEM_PARAM);
        return next;
      },
      { replace: true, preventScrollReset: true },
    );
  }, [itemId, locationState, navigate, setSearchParams]);

  return { itemId, isOpen: Boolean(itemId), openItem, closeItem };
}
