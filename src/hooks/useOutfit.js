import { useState, useCallback, useEffect } from 'react';
import { outfitService } from '../services/outfitService.js';
import { useSnackbar } from '../contexts/SnackbarContext.jsx';

export function useOutfit({ weather, occasion, wardrobe }) {
  const [outfit, setOutfit] = useState(null);
  const [loading, setLoading] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const { show } = useSnackbar();

  const generate = useCallback(async () => {
    if (!wardrobe) return;
    setLoading(true);
    setAccepted(false);
    const res = await outfitService.generateOutfit({ weather, occasion, wardrobe });
    if (res.success) setOutfit(res.data.outfit);
    setLoading(false);
  }, [weather, occasion, wardrobe]);

  useEffect(() => {
    if (wardrobe && wardrobe.length > 0 && weather) generate();
  }, [weather, occasion]); // eslint-disable-line

  const accept = async () => {
    if (!outfit) return;
    const res = await outfitService.acceptOutfit(outfit);
    if (res.success) {
      setAccepted(true);
      setOutfit(res.data);
      show('Outfit saved! Great choice 👔', 'success');
    }
  };

  return { outfit, loading, accepted, generate, accept };
}
