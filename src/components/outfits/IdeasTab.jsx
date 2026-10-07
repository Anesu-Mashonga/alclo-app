import AddOutlined from '@mui/icons-material/AddOutlined';
import AutoAwesomeOutlined from '@mui/icons-material/AutoAwesomeOutlined';
import Bookmark from '@mui/icons-material/Bookmark';
import BookmarkBorderOutlined from '@mui/icons-material/BookmarkBorderOutlined';
import CheckOutlined from '@mui/icons-material/CheckOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import EventOutlined from '@mui/icons-material/EventOutlined';
import LocalLaundryServiceOutlined from '@mui/icons-material/LocalLaundryServiceOutlined';
import RefreshOutlined from '@mui/icons-material/RefreshOutlined';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Tooltip from '@mui/material/Tooltip';
import { AnimatePresence, motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import Kbd from '@/components/common/Kbd';
import OccasionToggle from '@/components/common/OccasionToggle';
import WeatherIcon from '@/components/common/WeatherIcon';
import { useAuth } from '@/context/AuthContext';
import { occasionLabel } from '@/data/taxonomy';
import { useUI } from '@/context/UIContext';
import { useItems, useOutfits, useSuggestions, useWeather } from '@/hooks/api';
import useHotkeys from '@/hooks/useHotkeys';
import useLoadSampleWardrobe from '@/hooks/useLoadSampleWardrobe';
import { formatTemp } from '@/lib/format';
import OutfitCard, { OutfitCardSkeleton } from './OutfitCard';
import { useOutfitsPage } from './OutfitsContext';
import SaveOutfitDialog from './SaveOutfitDialog';
import useOutfitActions from './useOutfitActions';
import { conditionPhrase, defaultOutfitName, ideaTitle, itemSetKey, laundryFlag } from './outfitUtils';
import './IdeasTab.scss';

const IDEA_COUNT = 6;
const EMPTY_BATCH = { seed: 0, avoid: [] };

/**
 * "Ideas" tab: outfit suggestions for the chosen occasion and today's weather.
 * Props: occasion (id), onOccasionChange(id), active (tab is visible; enables the R shortcut)
 */
export default function IdeasTab({ occasion, onOccasionChange, active = true }) {
  const { user } = useAuth();
  const unit = user?.preferences?.tempUnit ?? 'C';
  const weatherQuery = useWeather();
  const weather = weatherQuery.data;
  const weatherSettled = weatherQuery.isSuccess || weatherQuery.isError;

  // Batch state is tied to the occasion it was made for, so switching occasion starts fresh.
  const [batchState, setBatchState] = useState({ occasion, ...EMPTY_BATCH });
  const batch = batchState.occasion === occasion ? batchState : EMPTY_BATCH;

  const suggestions = useSuggestions(
    { occasion, weather, count: IDEA_COUNT, seed: batch.seed, avoid: batch.avoid },
    { enabled: weatherSettled },
  );
  const ideas = useMemo(() => suggestions.data ?? [], [suggestions.data]);
  const loadingMore = suggestions.isFetching && suggestions.isPlaceholderData;

  const { data: savedOutfits } = useOutfits();
  const savedKeys = useMemo(
    () => new Set((savedOutfits ?? []).map((outfit) => itemSetKey(outfit.itemIds))),
    [savedOutfits],
  );

  const [savedNow, setSavedNow] = useState(() => new Set());
  const [saving, setSaving] = useState(null); // idea being named
  const [wearing, setWearing] = useState(null); // idea key being logged
  const actions = useOutfitActions();
  const { openBuilder } = useOutfitsPage();

  const moreIdeas = () => {
    if (suggestions.isFetching) return;
    setBatchState({
      occasion,
      seed: batch.seed + 1,
      avoid: [...new Set(ideas.flatMap((idea) => idea.itemIds))],
    });
  };

  useHotkeys({ r: moreIdeas }, { enabled: active && ideas.length > 0, ignoreInOverlays: true });

  const contextRec = ideas[0];
  const contextTemp = contextRec?.tempC ?? weather?.tempC;

  return (
    <div className="ideas-tab">
      <div className="ideas-tab__toolbar">
        <OccasionToggle value={occasion} onChange={onOccasionChange} className="ideas-tab__occasions" />
        <Tooltip
          title={
            <span>
              Shuffle for a new set <Kbd>R</Kbd>
            </span>
          }
        >
          <span className="ideas-tab__more-wrap">
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<RefreshOutlined />}
              loading={loadingMore}
              loadingPosition="start"
              disabled={ideas.length === 0}
              onClick={moreIdeas}
              aria-keyshortcuts="R"
              className="ideas-tab__more"
            >
              More ideas
            </Button>
          </span>
        </Tooltip>
      </div>

      <p className="ideas-tab__context" aria-live="polite">
        {weather && contextTemp !== undefined ? (
          <>
            <WeatherIcon condition={weather.condition} className="ideas-tab__context-icon" />
            <span>
              Based on {formatTemp(contextTemp, unit)} and {conditionPhrase(weather.condition)} in {weather.city}
            </span>
          </>
        ) : weatherQuery.isError ? (
          <span>Weather is unavailable, so these ideas use typical weather for your city.</span>
        ) : (
          <Skeleton variant="text" className="ideas-tab__context-skeleton" />
        )}
      </p>

      <IdeasBody
        query={suggestions}
        ideas={ideas}
        renderIdea={(idea, index) => {
          const key = itemSetKey(idea.itemIds);
          const items = idea.itemIds.map((id) => findItem(idea, id)).filter(Boolean);
          const title = ideaTitle(items);
          const isSaved = savedKeys.has(key) || savedNow.has(key);
          const flags = [];
          const dirty = laundryFlag(items);
          if (dirty) flags.push({ tone: 'warning', text: dirty });
          if (idea.warnings?.[0]) flags.push({ tone: 'muted', text: idea.warnings[0] });
          return (
            <motion.div
              key={`${batch.seed}:${key}`}
              className="ideas-tab__cell"
              layout="position"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.28, delay: index * 0.04, ease: [0.2, 0, 0, 1] } }}
              exit={{ opacity: 0, transition: { duration: 0.12 } }}
            >
              <OutfitCard
                title={title}
                occasion={idea.occasion}
                items={items}
                reasons={idea.reasons.slice(0, 2)}
                flags={flags}
                busy={loadingMore}
                onPlanFor={(day) =>
                  actions.plan({
                    date: day.date,
                    itemIds: idea.itemIds,
                    occasion: idea.occasion,
                    name: title,
                    previous: day.previous,
                  })
                }
                menuItems={[
                  { label: 'Plan for', icon: EventOutlined, planFor: true },
                  {
                    label: 'Edit before saving',
                    icon: EditOutlined,
                    onClick: () => openBuilder({ mode: 'create', itemIds: idea.itemIds, occasion: idea.occasion }),
                  },
                ]}
                actions={
                  <>
                    <Button
                      variant="outlined"
                      color="inherit"
                      size="small"
                      startIcon={<CheckOutlined />}
                      loading={wearing === key}
                      loadingPosition="start"
                      onClick={async () => {
                        setWearing(key);
                        await actions.wear({ itemIds: idea.itemIds, occasion: idea.occasion, weather });
                        setWearing(null);
                      }}
                    >
                      Wear today
                    </Button>
                    <Button
                      variant="outlined"
                      color="inherit"
                      size="small"
                      startIcon={isSaved ? <Bookmark /> : <BookmarkBorderOutlined />}
                      disabled={isSaved}
                      onClick={() => setSaving({ key, items, itemIds: idea.itemIds, occasion: idea.occasion })}
                      aria-label={isSaved ? `${title} is saved` : `Save ${title}`}
                    >
                      {isSaved ? 'Saved' : 'Save'}
                    </Button>
                  </>
                }
              />
            </motion.div>
          );
        }}
      />

      {ideas.length > 0 ? (
        <div className="ideas-tab__footer">
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<RefreshOutlined />}
            loading={loadingMore}
            loadingPosition="start"
            onClick={moreIdeas}
            className="ideas-tab__more-bottom"
          >
            More ideas
          </Button>
        </div>
      ) : null}

      <SaveOutfitDialog
        open={Boolean(saving)}
        items={saving?.items ?? []}
        defaultName={saving ? defaultOutfitName(saving.occasion) : ''}
        onClose={() => setSaving(null)}
        onSave={async (name) => {
          await actions.save({ name, itemIds: saving.itemIds, occasion: saving.occasion });
          setSavedNow((prev) => new Set(prev).add(saving.key));
          setSaving(null);
        }}
      />
    </div>
  );
}

function findItem(idea, id) {
  const { slots } = idea;
  for (const slot of ['outerwear', 'top', 'bottom', 'footwear']) {
    if (slots[slot]?.id === id) return slots[slot];
  }
  return slots.accessory?.find((item) => item.id === id) ?? null;
}

function IdeasBody({ query, ideas, renderIdea }) {
  if (query.isPending) {
    return (
      <div className="ideas-tab__grid" aria-busy="true" aria-label="Loading outfit ideas">
        {Array.from({ length: IDEA_COUNT }, (_, index) => (
          <OutfitCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (query.isError && ideas.length === 0) {
    return (
      <ErrorState
        title="Could not load outfit ideas"
        error={query.error}
        onRetry={() => query.refetch()}
        className="ideas-tab__state"
      />
    );
  }

  if (ideas.length === 0) return <NoIdeas />;

  return (
    <div className="ideas-tab__grid">
      <AnimatePresence initial={false} mode="popLayout">
        {ideas.map((idea, index) => renderIdea(idea, index))}
        {ideas.length < 4 && !query.isPlaceholderData ? (
          <motion.div
            key="few-ideas"
            className="ideas-tab__cell"
            layout="position"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.2, delay: 0.1 } }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
          >
            <FewIdeasHint count={ideas.length} occasion={ideas[0]?.occasion} />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/** Explains a short list of ideas, which happens when few clean pieces suit the occasion. */
function FewIdeasHint({ count, occasion }) {
  const ui = useUI();
  const label = occasionLabel(occasion)?.toLowerCase() ?? 'this occasion';
  return (
    <div className="ideas-tab__hint">
      <span className="ideas-tab__hint-icon" aria-hidden>
        <AutoAwesomeOutlined fontSize="inherit" />
      </span>
      <h3 className="ideas-tab__hint-title">
        {count === 1 ? 'One strong match' : `${count} strong matches`} for {label} today
      </h3>
      <p className="ideas-tab__hint-text">
        Few clean pieces suit {label} right now. Try More ideas, pick another occasion, or add pieces you wear for{' '}
        {label}.
      </p>
      <Button
        variant="outlined"
        color="inherit"
        size="small"
        startIcon={<AddOutlined />}
        onClick={() => ui.openItemForm({ mode: 'create' })}
      >
        Add item
      </Button>
    </div>
  );
}

/** Empty wardrobe or nothing clean: say which and offer the next step. */
function NoIdeas() {
  const ui = useUI();
  const { data, isPending } = useItems({});
  const sample = useLoadSampleWardrobe();

  if (isPending) return null;

  if ((data?.total ?? 0) === 0) {
    return (
      <EmptyState
        icon={AutoAwesomeOutlined}
        title="Add a few pieces to get outfit ideas"
        description="Ideas are built from the clothes you own, the weather and the occasion."
        className="ideas-tab__state"
        action={
          <Button variant="contained" startIcon={<AddOutlined />} onClick={() => ui.openItemForm({ mode: 'create' })}>
            Add item
          </Button>
        }
        secondaryAction={
          <Button
            variant="outlined"
            color="inherit"
            loading={sample.isPending}
            onClick={sample.load}
          >
            Load sample wardrobe
          </Button>
        }
      />
    );
  }

  return (
    <EmptyState
      icon={LocalLaundryServiceOutlined}
      title="Nothing clean to put together"
      description="Most of your tops, bottoms or shoes are in the laundry. Finish a load to get ideas again."
      className="ideas-tab__state"
      action={
        <Button component={RouterLink} to="/laundry" variant="contained" color="ink">
          Open laundry
        </Button>
      }
    />
  );
}
