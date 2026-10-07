import AddOutlined from '@mui/icons-material/AddOutlined';
import BookmarkBorderOutlined from '@mui/icons-material/BookmarkBorderOutlined';
import CheckOutlined from '@mui/icons-material/CheckOutlined';
import ContentCopyOutlined from '@mui/icons-material/ContentCopyOutlined';
import DeleteOutlineOutlined from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import EventOutlined from '@mui/icons-material/EventOutlined';
import Button from '@mui/material/Button';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { AnimatePresence, motion } from 'motion/react';
import { useId, useMemo, useState } from 'react';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import { useToast } from '@/context/ToastContext';
import { useOutfits, useUpdateOutfit, useWeather } from '@/hooks/api';
import { formatCount } from '@/lib/format';
import OutfitCard, { OutfitCardSkeleton } from './OutfitCard';
import { useOutfitsPage } from './OutfitsContext';
import useOutfitActions from './useOutfitActions';
import { SAVED_SORTS, laundryFlag, sortOutfits, wearSummary } from './outfitUtils';
import './SavedTab.scss';

/**
 * "Saved" tab: the user's saved outfits with wear stats and quick actions.
 * Props: sort ('recent' | 'most' | 'name'), onSortChange(id)
 */
export default function SavedTab({ sort, onSortChange }) {
  const outfitsQuery = useOutfits();
  const { data: weather } = useWeather();
  const updateOutfit = useUpdateOutfit();
  const toast = useToast();
  const actions = useOutfitActions();
  const { openBuilder, goToTab } = useOutfitsPage();
  const [wearing, setWearing] = useState(null);
  const sortLabelId = useId();

  const outfits = useMemo(() => sortOutfits(outfitsQuery.data ?? [], sort), [outfitsQuery.data, sort]);

  if (outfitsQuery.isPending) {
    return (
      <div className="saved-tab">
        <div className="saved-tab__toolbar saved-tab__toolbar--loading" aria-hidden />
        <div className="saved-tab__grid" aria-busy="true" aria-label="Loading saved outfits">
          {Array.from({ length: 6 }, (_, index) => (
            <OutfitCardSkeleton key={index} reasons={1} />
          ))}
        </div>
      </div>
    );
  }

  if (outfitsQuery.isError && !outfitsQuery.data) {
    return (
      <ErrorState
        title="Could not load your saved outfits"
        error={outfitsQuery.error}
        onRetry={() => outfitsQuery.refetch()}
        className="saved-tab__state"
      />
    );
  }

  if (outfits.length === 0) {
    return (
      <EmptyState
        icon={BookmarkBorderOutlined}
        title="No saved outfits yet"
        description="Save an idea you like, or put one together from your own pieces. Saved outfits are quick to wear again or plan for the week."
        className="saved-tab__state"
        action={
          <Button variant="contained" startIcon={<AddOutlined />} onClick={() => openBuilder({ mode: 'create' })}>
            New outfit
          </Button>
        }
        secondaryAction={
          <Button variant="outlined" color="inherit" onClick={() => goToTab('ideas')}>
            Browse ideas
          </Button>
        }
      />
    );
  }

  const toggleFavorite = (outfit, value) =>
    updateOutfit.mutate(
      { id: outfit.id, patch: { favorite: value } },
      { onError: (error) => toast.error(error.message || 'Could not update this outfit.') },
    );

  const wear = async (outfit) => {
    setWearing(outfit.id);
    await actions.wear({
      itemIds: outfit.items.map((item) => item.id),
      outfitId: outfit.id,
      occasion: outfit.occasion,
      weather,
    });
    setWearing(null);
  };

  return (
    <div className="saved-tab">
      <div className="saved-tab__toolbar">
        <p className="saved-tab__count">{formatCount(outfits.length, 'saved outfit')}</p>
        <div className="saved-tab__sort">
          <span className="saved-tab__sort-label" id={sortLabelId}>
            Sort
          </span>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={sort}
            onChange={(_event, value) => value && onSortChange(value)}
            aria-labelledby={sortLabelId}
          >
            {SAVED_SORTS.map((option) => (
              <ToggleButton key={option.id} value={option.id}>
                {option.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </div>
      </div>

      <div className="saved-tab__grid">
        <AnimatePresence initial={false} mode="popLayout">
          {outfits.map((outfit) => {
            const usable = outfit.items.length >= 2;
            const flags = [];
            const dirty = laundryFlag(outfit.items);
            if (dirty) flags.push({ tone: 'warning', text: dirty });
            if (outfit.missingCount > 0) {
              flags.push({
                tone: usable ? 'muted' : 'error',
                text: usable
                  ? `${formatCount(outfit.missingCount, 'piece')} no longer in your wardrobe`
                  : 'Needs at least 2 pieces. Edit it to add more.',
              });
            }
            const edit = () => openBuilder({ mode: 'edit', outfitId: outfit.id });
            return (
              <motion.div
                key={outfit.id}
                layout
                className="saved-tab__cell"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1, transition: { duration: 0.2, ease: [0.2, 0, 0, 1] } }}
                exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.16, ease: [0.3, 0, 1, 1] } }}
                transition={{ layout: { duration: 0.28, ease: [0.2, 0, 0, 1] } }}
              >
                <OutfitCard
                  title={outfit.name}
                  occasion={outfit.occasion}
                  items={outfit.items}
                  meta={wearSummary(outfit)}
                  flags={flags}
                  favorite={{ value: Boolean(outfit.favorite), onToggle: (value) => toggleFavorite(outfit, value) }}
                  onPlanFor={(day) =>
                    actions.plan({
                      date: day.date,
                      outfitId: outfit.id,
                      occasion: outfit.occasion,
                      name: outfit.name,
                      previous: day.previous,
                    })
                  }
                  menuItems={[
                    ...(usable ? [{ label: 'Wear today', icon: CheckOutlined, onClick: () => wear(outfit) }] : []),
                    { label: 'Edit', icon: EditOutlined, onClick: edit },
                    { label: 'Duplicate', icon: ContentCopyOutlined, onClick: () => actions.duplicate(outfit) },
                    ...(usable ? [{ label: 'Plan for', icon: EventOutlined, planFor: true }] : []),
                    {
                      label: 'Delete',
                      icon: DeleteOutlineOutlined,
                      destructive: true,
                      dividerBefore: true,
                      onClick: () => actions.remove(outfit),
                    },
                  ]}
                  actions={
                    <>
                      <Button
                        variant="outlined"
                        color="inherit"
                        size="small"
                        startIcon={<CheckOutlined />}
                        disabled={!usable}
                        loading={wearing === outfit.id}
                        loadingPosition="start"
                        onClick={() => wear(outfit)}
                        aria-label={`Wear ${outfit.name} today`}
                      >
                        Wear today
                      </Button>
                      <Button
                        variant="outlined"
                        color="inherit"
                        size="small"
                        startIcon={<EditOutlined />}
                        onClick={edit}
                        aria-label={`Edit ${outfit.name}`}
                      >
                        Edit
                      </Button>
                    </>
                  }
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
