import BookmarkBorderOutlined from '@mui/icons-material/BookmarkBorderOutlined';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import ShoppingBasketOutlined from '@mui/icons-material/ShoppingBasketOutlined';
import UndoOutlined from '@mui/icons-material/UndoOutlined';
import Button from '@mui/material/Button';
import { useId, useState } from 'react';
import { useToast } from '@/context/ToastContext';
import { occasionLabel } from '@/data/taxonomy';
import { useUndoWear, useWearItems } from '@/hooks/api';
import useItemDrawer from '@/hooks/useItemDrawer';
import { formatTime } from '@/lib/dates';
import { formatTemp, joinList, lowerFirst } from '@/lib/format';
import OutfitBoard from './OutfitBoard';
import SaveOutfitDialog from './SaveOutfitDialog';
import ViewToggle from './ViewToggle';
import { conditionWord, slotsFromItems } from './todayUtils';
import './OutfitCard.scss';

/**
 * Worn state of the outfit card: what was logged today, when, and a way back to suggestions.
 */
export default function WornOutfit({ log, view, onViewChange, unit = 'C' }) {
  const headingId = useId();
  const toast = useToast();
  const { openItem } = useItemDrawer();
  const undoWear = useUndoWear();
  const wear = useWearItems();
  const [saveKey, setSaveKey] = useState(0);
  const [saveOpen, setSaveOpen] = useState(false);

  const items = log.items ?? [];
  const slots = slotsFromItems(items);
  const inHamper = items.filter((item) => item.laundry?.status === 'hamper');
  const loggedAt = formatTime(log.wornAt ?? log.createdAt);
  const occasion = log.occasion ?? 'casual';
  const weatherText = log.weather
    ? `, ${formatTemp(log.weather.tempC, unit)} and ${conditionWord(log.weather.condition)}`
    : '';

  const changeOutfit = async () => {
    try {
      await undoWear.mutateAsync(log.id);
      toast.show({
        message: "Removed today's log. Pick another outfit.",
        action: {
          label: 'Undo',
          onClick: () =>
            wear
              .mutateAsync({ itemIds: log.itemIds, outfitId: log.outfitId ?? null, occasion, weather: log.weather ?? null })
              .catch((error) => toast.error(error?.message ?? 'Could not log the outfit again.')),
        },
      });
    } catch (error) {
      toast.error(error?.message ?? 'Could not change the outfit. Try again.');
    }
  };

  return (
    <section className="today-outfit today-outfit--worn" aria-labelledby={headingId}>
      <header className="today-outfit__header">
        <div className="today-outfit__titles">
          <span className="today-outfit__worn-badge">
            <CheckCircleOutlined aria-hidden />
            Logged at {loggedAt}
          </span>
          <h2 id={headingId} className="today-outfit__title">
            You&apos;re wearing this today
          </h2>
          <p className="today-outfit__context">
            <span>
              {log.outfit?.name ? `${log.outfit.name}, for ` : 'For '}
              {lowerFirst(occasionLabel(occasion))}
              {weatherText}
            </span>
          </p>
        </div>
        <ViewToggle value={view} onChange={onViewChange} />
      </header>

      {inHamper.length > 0 ? (
        <p className="today-outfit__note">
          <ShoppingBasketOutlined aria-hidden />
          {inHamper.length === 1
            ? `${inHamper[0].name} reached its wash limit and is in the hamper now.`
            : `${joinList(inHamper.map((item) => item.name))} reached their wash limit and are in the hamper now.`}
        </p>
      ) : null}

      <OutfitBoard slots={slots} view={view} readOnly onOpen={openItem} />

      <footer className="today-outfit__actions">
        <div className="today-outfit__secondary">
          {log.outfitId ? null : (
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<BookmarkBorderOutlined />}
              onClick={() => {
                setSaveKey((key) => key + 1);
                setSaveOpen(true);
              }}
            >
              Save outfit
            </Button>
          )}
        </div>
        <Button
          variant="outlined"
          color="inherit"
          startIcon={<UndoOutlined />}
          loading={undoWear.isPending}
          loadingPosition="start"
          onClick={changeOutfit}
          className="today-outfit__change"
        >
          Change outfit
        </Button>
      </footer>

      <SaveOutfitDialog key={saveKey} open={saveOpen} items={items} occasion={occasion} onClose={() => setSaveOpen(false)} />
    </section>
  );
}
