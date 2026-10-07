import AddOutlined from '@mui/icons-material/AddOutlined';
import BookmarkBorderOutlined from '@mui/icons-material/BookmarkBorderOutlined';
import CheckOutlined from '@mui/icons-material/CheckOutlined';
import CheckroomOutlined from '@mui/icons-material/CheckroomOutlined';
import CloseOutlined from '@mui/icons-material/CloseOutlined';
import LocalLaundryServiceOutlined from '@mui/icons-material/LocalLaundryServiceOutlined';
import ShuffleOutlined from '@mui/icons-material/ShuffleOutlined';
import ThermostatOutlined from '@mui/icons-material/ThermostatOutlined';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import { useEffect, useId, useRef, useState } from 'react';
import { Link as RouterLink } from 'react-router';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import Kbd from '@/components/common/Kbd';
import WeatherIcon from '@/components/common/WeatherIcon';
import cx from '@/components/common/cx';
import { useToast } from '@/context/ToastContext';
import { useUI } from '@/context/UIContext';
import { useWearItems } from '@/hooks/api';
import useHotkeys from '@/hooks/useHotkeys';
import useLoadSampleWardrobe from '@/hooks/useLoadSampleWardrobe';
import useItemDrawer from '@/hooks/useItemDrawer';
import { formatTemp, joinList, lowerFirst } from '@/lib/format';
import { occasionLabel } from '@/data/taxonomy';
import AlternativesPicker from './AlternativesPicker';
import OutfitBoard from './OutfitBoard';
import OutfitCardSkeleton from './OutfitCardSkeleton';
import SaveOutfitDialog from './SaveOutfitDialog';
import ViewToggle from './ViewToggle';
import { CORE_SLOTS, conditionPhrase, previewLabel } from './todayUtils';
import './OutfitCard.scss';

const LAUNDRY_HINT = /clean|laundry|hamper|wash/i;

function hamperMessage(moved) {
  if (!moved?.length) return '';
  if (moved.length === 1) return ` ${moved[0].name} moved to the hamper.`;
  if (moved.length <= 3) return ` ${joinList(moved.map((item) => item.name))} moved to the hamper.`;
  return ` ${moved.length} pieces moved to the hamper.`;
}

function EmptyWardrobe() {
  const ui = useUI();
  const sample = useLoadSampleWardrobe();

  return (
    <section className="today-outfit today-outfit--empty" aria-label="Today's outfit">
      <EmptyState
        icon={CheckroomOutlined}
        title="Add a few pieces to get outfit ideas"
        description="Alclo builds outfits from clothes you own, matched to the weather and what is clean. Start with a top, a bottom and a pair of shoes."
        action={
          <Button variant="contained" startIcon={<AddOutlined />} onClick={() => ui.openItemForm({ mode: 'create' })}>
            Add item
          </Button>
        }
        secondaryAction={
          <Button variant="outlined" color="inherit" loading={sample.isPending} onClick={sample.load}>
            Load sample wardrobe
          </Button>
        }
      />
    </section>
  );
}

/**
 * Main card on Today: the recommended outfit with lock, swap, shuffle, save and wear.
 * `today` is the object returned by useTodayOutfit().
 */
export default function OutfitCard({ today, wardrobeEmpty = false, loading = false }) {
  const headingId = useId();
  const toast = useToast();
  const { openItem } = useItemDrawer();
  const wear = useWearItems();
  const [picker, setPicker] = useState(null);
  const [saveKey, setSaveKey] = useState(0);
  const [saveOpen, setSaveOpen] = useState(false);

  const { rec, recQuery, occasion, view, preview, unit, weather, locked, lockCount, isShuffling } = today;
  const items = rec ? [...CORE_SLOTS.map((slot) => rec.slots[slot]), ...(rec.slots.accessory ?? [])].filter(Boolean) : [];
  const ready = Boolean(rec) && !loading && !wardrobeEmpty;

  useHotkeys({ r: () => today.shuffleOutfit() }, { enabled: ready && items.length > 0, ignoreInOverlays: true });

  // Tell people when a shuffle had nothing else to offer, instead of silently showing the same pieces.
  const stuckSeen = useRef(today.stuckCount);
  useEffect(() => {
    if (today.stuckCount === stuckSeen.current) return;
    stuckSeen.current = today.stuckCount;
    toast.info(
      lockCount > 0
        ? `No other clean combination for ${lowerFirst(occasionLabel(occasion))} with these locks. Unlock a piece to see more.`
        : `This is the only clean combination for ${lowerFirst(occasionLabel(occasion))} right now.`,
    );
  }, [today.stuckCount, lockCount, occasion, toast]);

  if (wardrobeEmpty) return <EmptyWardrobe />;

  if (recQuery.isError && !rec) {
    return (
      <section className="today-outfit" aria-labelledby={headingId}>
        <h2 id={headingId} className="today-outfit__title">
          Today&apos;s outfit
        </h2>
        <ErrorState title="Could not build today's outfit" error={recQuery.error} onRetry={() => recQuery.refetch()} />
      </section>
    );
  }

  if (!ready) return <OutfitCardSkeleton />;

  const handleWear = async () => {
    try {
      const result = await wear.mutateAsync({
        itemIds: rec.itemIds,
        occasion,
        weather: weather ? { tempC: weather.tempC, condition: weather.condition } : null,
      });
      toast.show({
        message: `Logged today's outfit.${hamperMessage(result.movedToHamper)}`,
        severity: 'success',
        action: {
          label: 'Undo',
          onClick: async () => {
            try {
              await wear.undo(result.log.id);
              toast.info("Removed today's log");
            } catch (error) {
              toast.error(error?.message ?? 'Could not undo. Try again.');
            }
          },
        },
      });
    } catch (error) {
      toast.error(error?.message ?? 'Could not log this outfit. Try again.');
    }
  };

  const handlePick = (item) => {
    const before = locked;
    const replaced = picker?.item;
    today.placeItem(item, { replacingId: picker?.slot === 'accessory' ? replaced?.id : null });
    setPicker(null);
    toast.show({
      message: `Swapped in ${item.name}`,
      action: { label: 'Undo', onClick: () => today.setLocked(before) },
    });
  };

  const warnings = rec.warnings ?? [];
  const reasons = (rec.reasons ?? []).slice(0, 3);
  const city = weather?.city ?? today.realWeather?.city;
  const condition = weather?.condition;

  return (
    <section className={cx('today-outfit', preview && 'today-outfit--preview')} aria-labelledby={headingId}>
      <header className="today-outfit__header">
        <div className="today-outfit__titles">
          <h2 id={headingId} className="today-outfit__title">
            Today&apos;s outfit
          </h2>
          <p className="today-outfit__context">
            {condition ? <WeatherIcon condition={condition} className="today-outfit__context-icon" /> : null}
            <span>
              {preview
                ? `Built for ${formatTemp(rec.tempC, unit)} and ${conditionPhrase(condition)}`
                : `Built for about ${formatTemp(rec.tempC, unit)} over the day and ${conditionPhrase(condition)}${city ? ` in ${city}` : ''}`}
            </span>
          </p>
        </div>
        <ViewToggle value={view} onChange={today.setView} />
      </header>

      {preview ? (
        <div className="today-outfit__preview" role="status">
          <span className="today-outfit__preview-chip">
            <ThermostatOutlined aria-hidden />
            Previewing {previewLabel(preview, unit)}
          </span>
          <Button size="small" color="inherit" startIcon={<CloseOutlined />} onClick={() => today.setPreview(null)}>
            Back to today&apos;s weather
          </Button>
        </div>
      ) : null}

      {reasons.length > 0 ? (
        <ul className="today-outfit__reasons" aria-label="Why this outfit">
          {reasons.map((reason) => (
            <li key={reason} className="today-outfit__reason">
              <CheckOutlined aria-hidden />
              {reason}
            </li>
          ))}
        </ul>
      ) : null}

      {warnings.length > 0 ? (
        <Alert
          severity="warning"
          className="today-outfit__alert"
          action={
            warnings.some((warning) => LAUNDRY_HINT.test(warning)) ? (
              <Button
                component={RouterLink}
                to="/laundry"
                size="small"
                color="inherit"
                startIcon={<LocalLaundryServiceOutlined />}
              >
                Open laundry
              </Button>
            ) : null
          }
        >
          {warnings.length === 1 ? (
            warnings[0]
          ) : (
            <ul className="today-outfit__warnings">
              {warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          )}
        </Alert>
      ) : null}

      <div className={cx('today-outfit__board', isShuffling && 'today-outfit__board--busy')} aria-busy={isShuffling}>
        <OutfitBoard
          slots={rec.slots}
          needsOuterwear={rec.needsOuterwear}
          locked={locked}
          view={view}
          onOpen={openItem}
          onToggleLock={today.toggleLock}
          onSwap={setPicker}
        />
      </div>

      <footer className="today-outfit__actions">
        <div className="today-outfit__secondary">
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<ShuffleOutlined />}
            loading={isShuffling}
            loadingPosition="start"
            onClick={today.shuffleOutfit}
            aria-keyshortcuts="R"
            className="today-outfit__shuffle"
          >
            Shuffle
            <Kbd className="today-outfit__kbd" aria-hidden>
              R
            </Kbd>
          </Button>
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
          {lockCount > 0 ? (
            <Button variant="text" color="inherit" className="today-outfit__unlock" onClick={today.clearLocks}>
              Unlock all ({lockCount})
            </Button>
          ) : null}
        </div>
        <Button
          variant="contained"
          startIcon={<CheckOutlined />}
          loading={wear.isPending}
          loadingPosition="start"
          onClick={handleWear}
          className="today-outfit__wear"
        >
          Wear this
        </Button>
      </footer>

      <AlternativesPicker
        open={Boolean(picker)}
        anchorEl={picker?.anchor ?? null}
        slot={picker?.slot}
        current={picker?.item}
        occasion={occasion}
        weather={weather ?? undefined}
        pickedIds={rec.itemIds}
        onPick={handlePick}
        onClose={() => setPicker(null)}
      />
      <SaveOutfitDialog
        key={saveKey}
        open={saveOpen}
        items={items}
        occasion={occasion}
        onClose={() => setSaveOpen(false)}
      />
    </section>
  );
}
