import AddOutlined from '@mui/icons-material/AddOutlined';
import BookmarkBorderOutlined from '@mui/icons-material/BookmarkBorderOutlined';
import CheckOutlined from '@mui/icons-material/CheckOutlined';
import ShuffleOutlined from '@mui/icons-material/ShuffleOutlined';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import Skeleton from '@mui/material/Skeleton';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { AnimatePresence, motion } from 'motion/react';
import { useId, useState } from 'react';
import cx from '@/components/common/cx';
import DialogHeader from '@/components/common/DialogHeader';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import OccasionToggle from '@/components/common/OccasionToggle';
import OutfitPreview from '@/components/common/OutfitPreview';
import ResponsiveDialog from '@/components/common/ResponsiveDialog';
import WeatherIcon from '@/components/common/WeatherIcon';
import { useAuth } from '@/context/AuthContext';
import { occasionLabel } from '@/data/taxonomy';
import { useOutfits, useRecommendation, useWeather } from '@/hooks/api';
import { dayjs } from '@/lib/dates';
import { formatTemp } from '@/lib/format';
import { useOutfitsPage } from './OutfitsContext';
import useLatched from './useLatched';
import useOutfitActions from './useOutfitActions';
import { conditionPhrase, ideaTitle, laundryFlag, validOccasion, weatherForDate, wearSummary } from './outfitUtils';
import './PlanDialog.scss';

/**
 * Plans an outfit for one day: pick a saved outfit or generate an idea for that day's forecast.
 * Props: open, date ('YYYY-MM-DD'), plan (the existing plan or null), onClose
 */
export default function PlanDialog({ open, date, plan, onClose }) {
  const [shown, clear] = useLatched(open && Boolean(date), { date, plan }, `${date}:${plan?.id ?? ''}`);
  return (
    <ResponsiveDialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      className="plan-dialog"
      slotProps={{ transition: { onExited: clear } }}
    >
      {shown?.date ? <PlanForm key={shown.date} date={shown.date} plan={shown.plan} onClose={onClose} /> : null}
    </ResponsiveDialog>
  );
}

function PlanForm({ date, plan, onClose }) {
  const { user } = useAuth();
  const unit = user?.preferences?.tempUnit ?? 'C';
  const outfitsQuery = useOutfits();
  const { data: weather } = useWeather();
  const actions = useOutfitActions();
  const { openBuilder } = useOutfitsPage();
  const noteId = useId();

  const savedOutfits = outfitsQuery.data ?? [];
  const usable = savedOutfits.filter((outfit) => outfit.items.length >= 2);
  const [mode, setMode] = useState(() => (plan && !plan.outfitId ? 'idea' : 'saved'));
  const [outfitId, setOutfitId] = useState(plan?.outfitId ?? null);
  const [occasion, setOccasion] = useState(() =>
    validOccasion(plan?.occasion, user?.preferences?.defaultOccasion ?? 'casual'),
  );
  const [seed, setSeed] = useState(0);
  const [note, setNote] = useState(plan?.note ?? '');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const dayWeather = weatherForDate(weather, date);
  const recommendation = useRecommendation(
    { occasion, weather: dayWeather ?? weather, seed },
    { enabled: mode === 'idea' && Boolean(weather) },
  );
  const idea = recommendation.data;
  const ideaItems = idea
    ? [idea.slots.outerwear, idea.slots.top, idea.slots.bottom, idea.slots.footwear, ...(idea.slots.accessory ?? [])].filter(
        Boolean,
      )
    : [];

  const day = dayjs(date);
  const title = `Plan ${day.format('dddd D MMMM')}`;
  const forecast = weather?.forecast?.find((entry) => entry.date === date);
  const subtitle = forecast
    ? `${formatTemp(forecast.highC, unit)} high, ${formatTemp(forecast.lowC, unit)} low, ${conditionPhrase(forecast.condition)}`
    : 'No forecast for this day yet, so ideas use the current weather.';

  const submit = async (event) => {
    event.preventDefault();
    setError(null);
    if (note.trim().length > 140) {
      setError('Keep the note under 140 characters.');
      return;
    }
    let values;
    if (mode === 'saved') {
      const outfit = usable.find((entry) => entry.id === outfitId);
      if (!outfit) {
        setError('Pick a saved outfit, or switch to a new idea.');
        return;
      }
      values = { outfitId: outfit.id, occasion: outfit.occasion, name: outfit.name };
    } else {
      if (!idea || idea.itemIds.length === 0) {
        setError('There is no idea to plan yet. Try another occasion.');
        return;
      }
      values = { itemIds: idea.itemIds, occasion, name: ideaTitle(ideaItems) };
    }
    setSubmitting(true);
    const result = await actions.plan({ date, note: note.trim(), previous: plan, ...values });
    setSubmitting(false);
    if (result) onClose();
  };

  return (
    <form onSubmit={submit} noValidate className="plan-dialog__form">
      <DialogHeader
        title={title}
        subtitle={
          <span className="plan-dialog__subtitle">
            {forecast ? <WeatherIcon condition={forecast.condition} className="plan-dialog__subtitle-icon" /> : null}
            {subtitle}
          </span>
        }
        onClose={onClose}
      />
      <DialogContent className="plan-dialog__content">
        <ToggleButtonGroup
          exclusive
          fullWidth
          value={mode}
          onChange={(_event, value) => {
            if (value) {
              setMode(value);
              setError(null);
            }
          }}
          aria-label="What to plan"
          className="plan-dialog__mode"
        >
          <ToggleButton value="saved">Saved outfit</ToggleButton>
          <ToggleButton value="idea">New idea</ToggleButton>
        </ToggleButtonGroup>

        {mode === 'saved' ? (
          <SavedPicker
            query={outfitsQuery}
            outfits={usable}
            value={outfitId}
            onChange={(id) => {
              setOutfitId(id);
              setError(null);
            }}
            onCreate={() => {
              onClose();
              openBuilder({ mode: 'create' });
            }}
          />
        ) : (
          <div className="plan-dialog__idea">
            <OccasionToggle value={occasion} onChange={setOccasion} size="sm" className="plan-dialog__occasion" />
            {recommendation.isError && !idea ? (
              <ErrorState compact error={recommendation.error} onRetry={() => recommendation.refetch()} />
            ) : !idea ? (
              <div className="plan-dialog__idea-card" aria-busy="true">
                <Skeleton variant="rounded" className="plan-dialog__idea-sk-preview" />
                <div className="plan-dialog__idea-text">
                  <Skeleton variant="rounded" className="plan-dialog__idea-sk-line" />
                  <Skeleton variant="rounded" className="plan-dialog__idea-sk-line plan-dialog__idea-sk-line--short" />
                </div>
              </div>
            ) : ideaItems.length === 0 ? (
              <p className="plan-dialog__hint">Nothing clean fits this day yet. Try another occasion or finish a load.</p>
            ) : (
              <div className={cx('plan-dialog__idea-card', recommendation.isPlaceholderData && 'plan-dialog__idea-card--busy')}>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={idea.itemIds.join('|')}
                    className="plan-dialog__idea-preview"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, transition: { duration: 0.2 } }}
                    exit={{ opacity: 0, transition: { duration: 0.12 } }}
                  >
                    <OutfitPreview items={ideaItems} layout="flatlay" size="sm" />
                  </motion.div>
                </AnimatePresence>
                <div className="plan-dialog__idea-text">
                  <p className="plan-dialog__idea-title">{ideaTitle(ideaItems)}</p>
                  <ul className="plan-dialog__reasons">
                    {idea.reasons.slice(0, 3).map((reason) => (
                      <li key={reason}>
                        <CheckOutlined aria-hidden className="plan-dialog__reason-icon" />
                        {reason}
                      </li>
                    ))}
                  </ul>
                  {idea.warnings?.[0] ? <p className="plan-dialog__hint">{idea.warnings[0]}</p> : null}
                  <Button
                    variant="outlined"
                    color="inherit"
                    size="small"
                    startIcon={<ShuffleOutlined />}
                    onClick={() => setSeed((value) => value + 1)}
                    loading={recommendation.isFetching}
                    loadingPosition="start"
                    className="plan-dialog__shuffle"
                  >
                    Another idea
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        <TextField
          id={noteId}
          label="Note (optional)"
          placeholder="Budget review at 10:00"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          fullWidth
          size="small"
          slotProps={{ htmlInput: { maxLength: 160 } }}
          helperText={note.length > 100 ? `${140 - note.trim().length} characters left` : ' '}
          error={note.trim().length > 140}
        />

        {error ? (
          <Alert severity="error" role="alert" className="plan-dialog__error">
            {error}
          </Alert>
        ) : null}
      </DialogContent>
      <DialogActions className="plan-dialog__actions">
        <Button variant="text" color="inherit" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="contained" loading={submitting}>
          {plan ? 'Save plan' : 'Plan outfit'}
        </Button>
      </DialogActions>
    </form>
  );
}

function SavedPicker({ query, outfits, value, onChange, onCreate }) {
  const name = useId();

  if (query.isPending) {
    return (
      <div className="plan-dialog__list" aria-busy="true">
        {[0, 1, 2].map((index) => (
          <div key={index} className="plan-dialog__option plan-dialog__option--skeleton">
            <Skeleton variant="rounded" className="plan-dialog__option-sk-strip" />
            <Skeleton variant="rounded" className="plan-dialog__option-sk-line" />
          </div>
        ))}
      </div>
    );
  }
  if (query.isError && !query.data) {
    return <ErrorState compact error={query.error} onRetry={() => query.refetch()} />;
  }
  if (outfits.length === 0) {
    return (
      <EmptyState
        compact
        icon={BookmarkBorderOutlined}
        title="No saved outfits yet"
        description="Switch to New idea, or put an outfit together first."
        titleComponent="h3"
        action={
          <Button variant="outlined" color="inherit" size="small" startIcon={<AddOutlined />} onClick={onCreate}>
            New outfit
          </Button>
        }
      />
    );
  }

  return (
    <div className="plan-dialog__list" role="radiogroup" aria-label="Saved outfits">
      {outfits.map((outfit) => {
        const checked = outfit.id === value;
        const flag = laundryFlag(outfit.items);
        return (
          <label key={outfit.id} className={cx('plan-dialog__option', checked && 'plan-dialog__option--checked')}>
            <input
              type="radio"
              name={name}
              value={outfit.id}
              checked={checked}
              onChange={() => onChange(outfit.id)}
              className="plan-dialog__radio"
              aria-labelledby={`${name}-${outfit.id}-name`}
              aria-describedby={`${name}-${outfit.id}-meta`}
            />
            <OutfitPreview items={outfit.items} layout="strip" size="sm" max={3} className="plan-dialog__option-strip" />
            <span className="plan-dialog__option-text">
              <span className="plan-dialog__option-name" id={`${name}-${outfit.id}-name`}>{outfit.name}</span>
              <span className="plan-dialog__option-meta" id={`${name}-${outfit.id}-meta`}>
                {occasionLabel(outfit.occasion)}, {wearSummary(outfit).toLowerCase()}
              </span>
              {flag ? <span className="plan-dialog__option-flag">{flag}</span> : null}
            </span>
            <span className="plan-dialog__check" aria-hidden>
              {checked ? <CheckOutlined fontSize="small" /> : null}
            </span>
          </label>
        );
      })}
    </div>
  );
}
