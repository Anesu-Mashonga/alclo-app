import AddOutlined from '@mui/icons-material/AddOutlined';
import CheckroomOutlined from '@mui/icons-material/CheckroomOutlined';
import CloseOutlined from '@mui/icons-material/CloseOutlined';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import Skeleton from '@mui/material/Skeleton';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import DialogHeader from '@/components/common/DialogHeader';
import ErrorState from '@/components/common/ErrorState';
import ItemThumb from '@/components/common/ItemThumb';
import OccasionToggle from '@/components/common/OccasionToggle';
import OutfitPreview from '@/components/common/OutfitPreview';
import ResponsiveDialog from '@/components/common/ResponsiveDialog';
import StatusBadge from '@/components/common/StatusBadge';
import { useAuth } from '@/context/AuthContext';
import { useConfirm } from '@/context/ConfirmContext';
import { useToast } from '@/context/ToastContext';
import { isApiError, useItems, useOutfit, useUpdateOutfit } from '@/hooks/api';
import ItemPicker from './ItemPicker';
import useLatched from './useLatched';
import { useOutfitsPage } from './OutfitsContext';
import useOutfitActions from './useOutfitActions';
import { BUILDER_SLOTS, validOccasion } from './outfitUtils';
import './OutfitBuilderDialog.scss';

const EMPTY_SLOTS = { outerwear: null, top: null, bottom: null, footwear: null, accessory: [] };

function slotsFromIds(ids, itemsById) {
  const slots = { ...EMPTY_SLOTS, accessory: [] };
  for (const id of ids ?? []) {
    const item = itemsById.get(id);
    if (!item) continue;
    if (item.category === 'accessory') {
      if (slots.accessory.length < 3) slots.accessory.push(id);
    } else if (item.category in slots && !slots[item.category]) {
      slots[item.category] = id;
    }
  }
  return slots;
}

function idsFromSlots(slots) {
  return [slots.outerwear, slots.top, slots.bottom, slots.footwear, ...slots.accessory].filter(Boolean);
}

function snapshot(state) {
  return JSON.stringify({ name: state.name.trim(), occasion: state.occasion, ids: idsFromSlots(state.slots) });
}

/**
 * Create or edit a saved outfit: one piece per slot (up to 3 accessories), name and occasion,
 * with a live flat lay preview and an unsaved-changes guard.
 *
 * Props: open, mode ('create' | 'edit'), outfitId (edit), initial ({ itemIds, occasion, name }) for create,
 * onClose()
 */
export default function OutfitBuilderDialog({ open, mode = 'create', outfitId = null, initial = null, onClose }) {
  const guardRef = useRef(null);
  const key = `${mode}:${outfitId ?? ''}:${initial?.itemIds?.join(',') ?? ''}`;
  const [shown, clear] = useLatched(open, { mode, outfitId, initial, key }, key);
  const handleClose = async (_event, reason) => {
    if (guardRef.current && (await guardRef.current(reason)) === false) return;
    onClose();
  };

  return (
    <ResponsiveDialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      className="outfit-builder"
      slotProps={{ transition: { onExited: clear } }}
    >
      {shown ? (
        <BuilderLoader
          key={shown.key}
          mode={shown.mode}
          outfitId={shown.outfitId}
          initial={shown.initial}
          guardRef={guardRef}
          onClose={onClose}
        />
      ) : null}
    </ResponsiveDialog>
  );
}

function BuilderLoader({ mode, outfitId, initial, guardRef, onClose }) {
  const itemsQuery = useItems({});
  const outfitQuery = useOutfit(mode === 'edit' ? outfitId : null);
  const title = mode === 'edit' ? 'Edit outfit' : 'New outfit';

  const failed = (itemsQuery.isError && !itemsQuery.data) || (mode === 'edit' && outfitQuery.isError);
  const loading = itemsQuery.isPending || (mode === 'edit' && outfitQuery.isPending);

  if (failed) {
    const error = outfitQuery.error ?? itemsQuery.error;
    return (
      <>
        <DialogHeader title={title} onClose={onClose} />
        <DialogContent>
          <ErrorState
            compact
            title={error?.status === 404 ? 'This outfit no longer exists' : 'Could not load your pieces'}
            error={error}
            onRetry={error?.status === 404 ? undefined : () => Promise.all([itemsQuery.refetch(), outfitQuery.refetch()])}
          />
        </DialogContent>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <DialogHeader title={title} onClose={onClose} />
        <DialogContent className="outfit-builder__content" aria-busy="true">
          <div className="outfit-builder__layout">
            <div className="outfit-builder__fields">
              <Skeleton variant="rounded" className="outfit-builder__sk-field" />
              <Skeleton variant="rounded" className="outfit-builder__sk-field outfit-builder__sk-field--short" />
              {BUILDER_SLOTS.map((slot) => (
                <Skeleton key={slot.id} variant="rounded" className="outfit-builder__sk-slot" />
              ))}
            </div>
            <Skeleton variant="rounded" className="outfit-builder__sk-preview" />
          </div>
        </DialogContent>
      </>
    );
  }

  const outfit = mode === 'edit' ? outfitQuery.data : null;
  return (
    <BuilderForm
      key={outfit?.id ?? 'new'}
      mode={mode}
      outfit={outfit}
      initial={initial}
      items={itemsQuery.data?.items ?? []}
      guardRef={guardRef}
      onClose={onClose}
    />
  );
}

function BuilderForm({ mode, outfit, initial, items, guardRef, onClose }) {
  const { user } = useAuth();
  const confirm = useConfirm();
  const toast = useToast();
  const actions = useOutfitActions();
  const updateOutfit = useUpdateOutfit();
  const { goToTab } = useOutfitsPage();
  const nameId = useId();
  const itemsById = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);

  const [state, setState] = useState(() => ({
    name: outfit?.name ?? initial?.name ?? '',
    occasion: validOccasion(outfit?.occasion ?? initial?.occasion, user?.preferences?.defaultOccasion ?? 'casual'),
    slots: slotsFromIds(outfit?.itemIds ?? initial?.itemIds, itemsById),
  }));
  const [baseline] = useState(() => snapshot(state));
  const [picker, setPicker] = useState(null); // slot id while choosing
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const missingCount = outfit?.missingCount ?? 0;

  const chosenIds = idsFromSlots(state.slots);
  const chosenItems = chosenIds.map((id) => itemsById.get(id)).filter(Boolean);
  const dirty = snapshot(state) !== baseline;

  const clientErrors = {};
  const trimmed = state.name.trim();
  if (!trimmed) clientErrors.name = 'Give this outfit a name.';
  else if (trimmed.length > 50) clientErrors.name = 'Keep the name under 50 characters.';
  if (chosenIds.length < 2) clientErrors.itemIds = 'Pick at least 2 pieces, for example a top and a bottom.';
  const errors = submitted ? { ...clientErrors, ...serverErrors } : serverErrors;

  // Close guard used by the dialog (Escape, backdrop), Cancel and the close button.
  const guard = async (reason) => {
    if (picker && reason === 'escapeKeyDown') {
      setPicker(null);
      return false;
    }
    if (!dirty || saving) return !saving;
    return confirm({
      title: 'Discard changes?',
      description: mode === 'edit' ? 'Your changes to this outfit will be lost.' : 'This outfit has not been saved yet.',
      confirmLabel: 'Discard',
      cancelLabel: 'Keep editing',
      destructive: true,
    });
  };

  useEffect(() => {
    guardRef.current = guard;
  });
  useEffect(
    () => () => {
      guardRef.current = null;
    },
    [guardRef],
  );

  const requestClose = async () => {
    if ((await guard('closeButton')) === false) return;
    onClose();
  };

  const update = (patch) => {
    setState((prev) => ({ ...prev, ...patch }));
    setServerErrors((prev) => {
      const next = { ...prev };
      if ('name' in patch) delete next.name;
      if ('slots' in patch) delete next.itemIds;
      if ('occasion' in patch) delete next.occasion;
      return next;
    });
  };

  const setSlot = (slot, value) => update({ slots: { ...state.slots, [slot]: value } });

  const pick = (item) => {
    if (picker === 'accessory') {
      const current = state.slots.accessory;
      const next = current.includes(item.id)
        ? current.filter((id) => id !== item.id)
        : current.length < 3
          ? [...current, item.id]
          : current;
      setSlot('accessory', next);
      return;
    }
    setSlot(picker, item.id);
    setPicker(null);
  };

  const submit = async (event) => {
    event.preventDefault();
    setSubmitted(true);
    if (Object.keys(clientErrors).length > 0) {
      const field = clientErrors.name ? document.getElementById(nameId) : null;
      field?.focus();
      return;
    }
    setSaving(true);
    try {
      const values = { name: trimmed, itemIds: chosenIds, occasion: state.occasion };
      if (mode === 'edit') {
        const saved = await updateOutfit.mutateAsync({ id: outfit.id, patch: values });
        toast.show({ message: `Saved changes to ${saved.name}` });
      } else {
        await actions.save(values, { notify: false });
        toast.show({
          message: `Saved ${trimmed}`,
          action: { label: 'View', onClick: () => goToTab('saved') },
          duration: 6000,
        });
      }
      onClose();
    } catch (error) {
      setSaving(false);
      if (isApiError(error) && error.fieldErrors) setServerErrors(error.fieldErrors);
      else toast.error(error?.message || 'Could not save this outfit. Try again.');
    }
  };

  const title = mode === 'edit' ? 'Edit outfit' : 'New outfit';

  return (
    <form onSubmit={submit} noValidate className="outfit-builder__form">
      <DialogHeader
        title={title}
        subtitle={picker ? null : 'Pick one piece per slot. Two pieces is the minimum.'}
        onClose={requestClose}
      />
      <DialogContent className="outfit-builder__content">
        {picker ? (
          <ItemPicker
            slot={picker}
            items={items}
            selectedIds={picker === 'accessory' ? state.slots.accessory : [state.slots[picker]].filter(Boolean)}
            multiple={picker === 'accessory'}
            max={3}
            onPick={pick}
            onBack={() => setPicker(null)}
          />
        ) : (
          <div className="outfit-builder__layout">
            <div className="outfit-builder__fields">
              <TextField
                id={nameId}
                label="Name"
                required
                value={state.name}
                placeholder="Monday meetings"
                onChange={(event) => update({ name: event.target.value })}
                error={Boolean(errors.name)}
                helperText={errors.name ?? ' '}
                fullWidth
                autoFocus={mode === 'create' && !initial?.itemIds}
                slotProps={{ htmlInput: { maxLength: 60 } }}
              />
              <div className="outfit-builder__field">
                <span className="outfit-builder__label" aria-hidden>
                  Occasion
                </span>
                <OccasionToggle
                  value={state.occasion}
                  onChange={(occasion) => update({ occasion })}
                  size="sm"
                  label="Occasion"
                />
                {errors.occasion ? <p className="outfit-builder__error">{errors.occasion}</p> : null}
              </div>

              <div className="outfit-builder__field">
                <span className="outfit-builder__label">Pieces</span>
                {missingCount > 0 ? (
                  <p className="outfit-builder__note">
                    {missingCount === 1 ? '1 piece was' : `${missingCount} pieces were`} deleted from your wardrobe and
                    removed from this outfit.
                  </p>
                ) : null}
                <ul className="outfit-builder__slots" aria-describedby={errors.itemIds ? `${nameId}-items-error` : undefined}>
                  {BUILDER_SLOTS.map((slot) =>
                    slot.id === 'accessory' ? (
                      <AccessoryRows
                        key={slot.id}
                        ids={state.slots.accessory}
                        itemsById={itemsById}
                        onAdd={() => setPicker('accessory')}
                        onRemove={(id) => setSlot('accessory', state.slots.accessory.filter((entry) => entry !== id))}
                      />
                    ) : (
                      <SlotRow
                        key={slot.id}
                        label={slot.label}
                        item={itemsById.get(state.slots[slot.id]) ?? null}
                        onChoose={() => setPicker(slot.id)}
                        onRemove={() => setSlot(slot.id, null)}
                      />
                    ),
                  )}
                </ul>
                {errors.itemIds ? (
                  <Alert severity="error" id={`${nameId}-items-error`} className="outfit-builder__items-error">
                    {errors.itemIds}
                  </Alert>
                ) : null}
              </div>
            </div>

            <aside className="outfit-builder__preview" aria-label="Preview">
              <p className="outfit-builder__label">Preview</p>
              <div className="outfit-builder__preview-frame">
                <OutfitPreview
                  items={chosenItems}
                  layout="flatlay"
                  size="md"
                  label={chosenItems.length ? undefined : 'No pieces chosen yet'}
                />
              </div>
              <p className="outfit-builder__preview-count">
                {chosenItems.length === 0
                  ? 'Choose pieces to see the outfit come together.'
                  : `${chosenItems.length} ${chosenItems.length === 1 ? 'piece' : 'pieces'}`}
              </p>
            </aside>
          </div>
        )}
      </DialogContent>
      <DialogActions className="outfit-builder__actions">
        {picker ? (
          <Button variant="contained" color="ink" onClick={() => setPicker(null)}>
            {picker === 'accessory' ? 'Done' : 'Back to outfit'}
          </Button>
        ) : (
          <>
            <Button variant="text" color="inherit" onClick={requestClose}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" loading={saving}>
              {mode === 'edit' ? 'Save changes' : 'Save outfit'}
            </Button>
          </>
        )}
      </DialogActions>
    </form>
  );
}

function SlotRow({ label, item, onChoose, onRemove, removeLabel }) {
  const status = item?.laundry?.status ?? 'clean';
  return (
    <li className="outfit-builder__slot">
      {item ? (
        <ItemThumb item={item} size="sm" ratio="1/1" />
      ) : (
        <span className="outfit-builder__slot-empty" aria-hidden>
          <CheckroomOutlined fontSize="small" />
        </span>
      )}
      <span className="outfit-builder__slot-text">
        <span className="outfit-builder__slot-label">{label}</span>
        <span className={item ? 'outfit-builder__slot-name' : 'outfit-builder__slot-placeholder'}>
          {item ? item.name : 'Not chosen'}
        </span>
        {item && status !== 'clean' ? <StatusBadge status={status} size="sm" className="outfit-builder__slot-status" /> : null}
      </span>
      <span className="outfit-builder__slot-actions">
        <Button
          variant="outlined"
          color="inherit"
          size="small"
          onClick={onChoose}
          aria-label={item ? `Change ${label.toLowerCase()}` : `Choose ${label.toLowerCase()}`}
        >
          {item ? 'Change' : 'Choose'}
        </Button>
        {item ? (
          <Tooltip title="Remove">
            <IconButton
              size="small"
              className="outfit-builder__remove"
              aria-label={removeLabel ?? `Remove ${item.name}`}
              onClick={onRemove}
            >
              <CloseOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        ) : null}
      </span>
    </li>
  );
}

function AccessoryRows({ ids, itemsById, onAdd, onRemove }) {
  const chosen = ids.map((id) => itemsById.get(id)).filter(Boolean);
  return (
    <li className="outfit-builder__slot outfit-builder__slot--group">
      <div className="outfit-builder__group-head">
        <span className="outfit-builder__slot-label">Accessories</span>
        <span className="outfit-builder__slot-hint">{chosen.length} of 3</span>
      </div>
      {chosen.length > 0 ? (
        <ul className="outfit-builder__accessories">
          {chosen.map((item) => (
            <li key={item.id} className="outfit-builder__accessory">
              <ItemThumb item={item} size="xs" ratio="1/1" />
              <span className="outfit-builder__slot-name">{item.name}</span>
              <Tooltip title="Remove">
                <IconButton
                  size="small"
                  className="outfit-builder__remove"
                  aria-label={`Remove ${item.name}`}
                  onClick={() => onRemove(item.id)}
                >
                  <CloseOutlined fontSize="small" />
                </IconButton>
              </Tooltip>
            </li>
          ))}
        </ul>
      ) : null}
      {chosen.length < 3 ? (
        <Button
          variant="text"
          color="inherit"
          size="small"
          startIcon={<AddOutlined />}
          onClick={onAdd}
          className="outfit-builder__add-accessory"
        >
          {chosen.length === 0 ? 'Add accessories' : 'Add another'}
        </Button>
      ) : null}
    </li>
  );
}
