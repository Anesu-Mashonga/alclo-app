import { useState, useEffect, useCallback } from 'react';
import { wardrobeService } from '../services/wardrobeService.js';
import { useSnackbar } from '../contexts/SnackbarContext.jsx';

export function useWardrobe() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { show } = useSnackbar();

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await wardrobeService.getAllItems();
    if (res.success) setItems(res.data);
    else setError(res.error.message);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createItem = async (payload) => {
    const res = await wardrobeService.createItem(payload);
    if (res.success) {
      setItems((prev) => [...prev, res.data]);
      show('Item added to wardrobe!', 'success');
    } else {
      show(res.error.message, 'error');
    }
    return res;
  };

  const updateItem = async (id, payload) => {
    const res = await wardrobeService.updateItem(id, payload);
    if (res.success) {
      setItems((prev) => prev.map((i) => (i.id === id ? res.data : i)));
      show('Item updated!', 'success');
    } else {
      show(res.error.message, 'error');
    }
    return res;
  };

  const deleteItem = async (id) => {
    const res = await wardrobeService.deleteItem(id);
    if (res.success) {
      setItems((prev) => prev.filter((i) => i.id !== id));
      show('Item removed from wardrobe.', 'info');
    } else {
      show(res.error.message, 'error');
    }
    return res;
  };

  const toggleFavorite = async (id) => {
    const res = await wardrobeService.toggleFavorite(id);
    if (res.success) {
      setItems((prev) => prev.map((i) => (i.id === id ? res.data : i)));
    }
    return res;
  };

  const markItemsClean = async (ids) => {
    const res = await wardrobeService.bulkUpdate(ids, { inLaundry: false });
    if (res.success) {
      await refresh();
      show(`${ids.length} item${ids.length > 1 ? 's' : ''} marked as clean!`, 'success');
    }
    return res;
  };

  // Analytics
  const stats = {
    total: items.length,
    favorites: items.filter((i) => i.favorite).length,
    inLaundry: items.filter((i) => i.inLaundry).length,
    wornThisWeek: items.filter((i) => {
      const days = (Date.now() - new Date(i.lastWorn)) / (1000 * 60 * 60 * 24);
      return days <= 7;
    }).length,
  };

  return { items, loading, error, refresh, createItem, updateItem, deleteItem, toggleFavorite, markItemsClean, stats };
}
