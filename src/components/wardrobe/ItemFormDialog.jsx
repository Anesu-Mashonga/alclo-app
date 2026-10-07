import CloseOutlined from '@mui/icons-material/CloseOutlined';
import ExpandMoreOutlined from '@mui/icons-material/ExpandMoreOutlined';
import LightbulbOutlined from '@mui/icons-material/LightbulbOutlined';
import SearchOffOutlined from '@mui/icons-material/SearchOffOutlined';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Skeleton from '@mui/material/Skeleton';
import Slider from '@mui/material/Slider';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import { useId, useMemo, useState } from 'react';
import cx from '@/components/common/cx';
import DialogHeader from '@/components/common/DialogHeader';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import ResponsiveDialog from '@/components/common/ResponsiveDialog';
import { useAuth } from '@/context/AuthContext';
import { useConfirm } from '@/context/ConfirmContext';
import { useToast } from '@/context/ToastContext';
import {
  CATEGORIES,
  CATEGORY_BY_ID,
  COLOR_BY_ID,
  DEFAULT_WARMTH,
  OCCASIONS,
  OCCASION_BY_ID,
  TYPES,
  TYPE_TO_CATEGORY,
  typeLabel,
} from '@/data/taxonomy';
import { useCreateItem, useItem, useUpdateItem } from '@/hooks/api';
import useDebouncedValue from '@/hooks/useDebouncedValue';
import useItemDrawer from '@/hooks/useItemDrawer';
import { defaultWashAfter } from '@/lib/laundry';
import { inferFromName } from '@/lib/nameInference';
import ChipGroup from './ChipGroup';
import ColorPicker from './ColorPicker';
import ImageDropzone from './ImageDropzone';
import { warmthLabel } from './itemFormat';
import './ItemFormDialog.scss';

const MAX_COLORS = 3;
const UNLAUNDERED = new Set(['footwear', 'accessory']);
const FIELD_ORDER = ['image', 'name', 'category', 'type', 'colors', 'occasions', 'warmth', 'brand', 'price', 'washAfter', 'notes'];
const DETAIL_FIELDS = new Set(['brand', 'price', 'washAfter', 'notes']);
const CATEGORY_OPTIONS = CATEGORIES.map((category) => ({ id: category.id, label: category.singular }));
const OCCASION_OPTIONS = OCCASIONS.map((occasion) => ({ id: occasion.id, label: occasion.label }));
const WARMTH_MARKS = [
  { value: 1, label: 'Light' },
  { value: 2 },
  { value: 3 },
  { value: 4 },
  { value: 5, label: 'Heavy' },
];

const isLaundered = (category) => Boolean(category) && !UNLAUNDERED.has(category);
const typeId = (text) => String(text ?? '').trim().toLowerCase();
const sameList = (a = [], b = []) => a.length === b.length && a.every((value, index) => value === b[index]);

function blankValues(user, defaults) {
  const defaultOccasion = user?.preferences?.defaultOccasion;
  const values = {
    image: null,
    name: '',
    category: null,
    type: '',
    colors: [],
    occasions: OCCASION_BY_ID[defaultOccasion] ? [defaultOccasion] : ['casual'],
    warmth: 3,
    waterproof: false,
    brand: '',
    price: '',
    washAfter: '',
    notes: '',
  };
  if (defaults) {
    if (defaults.name) values.name = String(defaults.name);
    if (CATEGORY_BY_ID[defaults.category]) values.category = defaults.category;
    if (defaults.type) values.type = typeLabel(defaults.type);
    if (Array.isArray(defaults.colors)) values.colors = defaults.colors.filter((id) => COLOR_BY_ID[id]).slice(0, MAX_COLORS);
    if (Array.isArray(defaults.occasions)) values.occasions = defaults.occasions.filter((id) => OCCASION_BY_ID[id]);
    if (defaults.image) values.image = defaults.image;
    const type = typeId(values.type);
    if (DEFAULT_WARMTH[type]) values.warmth = DEFAULT_WARMTH[type];
    if (values.category) values.washAfter = String(defaultWashAfter(type || null, values.category) ?? '');
  }
  return values;
}

function valuesFromItem(item) {
  return {
    image: item.image ?? null,
    name: item.name ?? '',
    category: item.category ?? null,
    type: item.type ? typeLabel(item.type) : '',
    colors: [...(item.colors ?? [])],
    occasions: [...(item.occasions ?? [])],
    warmth: item.warmth ?? 3,
    waterproof: Boolean(item.waterproof),
    brand: item.brand ?? '',
    price: item.price === null || item.price === undefined ? '' : String(item.price),
    washAfter: item.laundry?.washAfter === null || item.laundry?.washAfter === undefined ? '' : String(item.laundry.washAfter),
    notes: item.notes ?? '',
  };
}

function initialForm(values, auto) {
  return { initial: values, values, auto };
}

/** Client-side checks that mirror the service rules, so most problems show before saving. */
function validate(values) {
  const errors = {};
  const name = values.name.trim();
  if (!name) errors.name = 'Give this piece a name.';
  else if (name.length > 60) errors.name = 'Keep the name under 60 characters.';
  if (!values.category) errors.category = 'Choose a category.';
  const type = typeId(values.type);
  if (type && values.category && !TYPES[values.category].includes(type)) {
    errors.type = `Pick a ${CATEGORY_BY_ID[values.category].singular.toLowerCase()} type from the list, or leave it empty.`;
  }
  if (values.colors.length === 0) errors.colors = 'Pick at least one colour.';
  if (values.brand.trim().length > 40) errors.brand = 'Keep the brand under 40 characters.';
  if (values.price !== '') {
    const price = Number(values.price);
    if (!Number.isFinite(price) || price < 0) errors.price = 'Enter a price of 0 or more.';
    else if (price > 100000) errors.price = 'Enter a price under 100,000.';
  }
  if (isLaundered(values.category) && values.washAfter !== '') {
    const wash = Number(values.washAfter);
    if (!Number.isInteger(wash) || wash < 1 || wash > 30) errors.washAfter = 'Use a whole number from 1 to 30, or leave it empty.';
  }
  if (values.notes.length > 500) errors.notes = 'Keep notes under 500 characters.';
  return errors;
}

function toPayload(values) {
  return {
    name: values.name.trim(),
    category: values.category,
    type: typeId(values.type) || null,
    colors: values.colors,
    occasions: values.occasions,
    warmth: Number(values.warmth),
    waterproof: values.waterproof,
    brand: values.brand.trim() || null,
    price: values.price === '' ? null : Math.round(Number(values.price) * 100) / 100,
    washAfter: isLaundered(values.category) && values.washAfter !== '' ? Number(values.washAfter) : null,
    notes: values.notes.trim(),
    image: values.image,
  };
}

function suggestionLabel(suggestion) {
  return [
    suggestion.category ? CATEGORY_BY_ID[suggestion.category]?.singular : null,
    suggestion.type,
    ...suggestion.colors.map((id) => COLOR_BY_ID[id]?.label.toLowerCase()),
  ]
    .filter(Boolean)
    .join(', ');
}

/** A new key every time the dialog opens, so each opening starts from fresh form state. */
function useOpenSession(open) {
  const [session, setSession] = useState(0);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setSession((count) => count + 1);
  }
  return session;
}

/**
 * Global add / edit item dialog, mounted by AppShell and opened with
 * useUI().openItemForm({ mode: 'create', defaults? }) or ({ mode: 'edit', itemId }).
 * @param {{ open: boolean, mode?: 'create' | 'edit', itemId?: string | null, defaults?: object | null, onClose: () => void }} props
 */
export default function ItemFormDialog(props) {
  const session = useOpenSession(props.open);
  return <ItemForm key={session} {...props} />;
}

function ItemForm({ open, mode = 'create', itemId = null, defaults = null, onClose }) {
  const isEdit = mode === 'edit';
  const uid = useId();
  const fieldId = (name) => `${uid}-${name}`;
  const { user } = useAuth();
  const confirm = useConfirm();
  const toast = useToast();
  const { openItem } = useItemDrawer();
  const createItem = useCreateItem();
  const updateItem = useUpdateItem();
  const itemQuery = useItem(isEdit ? itemId : null);
  const item = itemQuery.data;

  const [form, setForm] = useState(() => {
    if (!isEdit) return initialForm(blankValues(user, defaults), { warmth: true, washAfter: true });
    return item ? initialForm(valuesFromItem(item), { warmth: false, washAfter: false }) : null;
  });
  const hasDetails = (source) => Boolean(source && (source.brand || (source.price ?? null) !== null || source.notes));
  const [moreOpen, setMoreOpen] = useState(() => isEdit && hasDetails(item));
  if (!form && isEdit && item) {
    setForm(initialForm(valuesFromItem(item), { warmth: false, washAfter: false }));
    setMoreOpen(hasDetails(item));
  }

  const [submitted, setSubmitted] = useState(false);
  const [blurred, setBlurred] = useState({});
  const [serverErrors, setServerErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [imageBusy, setImageBusy] = useState(false);
  const [dismissedFor, setDismissedFor] = useState(null);

  const values = form?.values ?? null;
  const saving = createItem.isPending || updateItem.isPending;
  const dirty = Boolean(form) && JSON.stringify(form.values) !== JSON.stringify(form.initial);

  const debouncedName = useDebouncedValue(values?.name ?? '', 250);
  const suggestion = useMemo(() => (debouncedName.trim() ? inferFromName(debouncedName) : null), [debouncedName]);

  const clientErrors = values ? validate(values) : {};
  const errorFor = (name) => {
    if (serverErrors[name]) return serverErrors[name];
    return submitted || blurred[name] ? clientErrors[name] : undefined;
  };

  const markBlurred = (name) => () => setBlurred((current) => (current[name] ? current : { ...current, [name]: true }));

  const patch = (changes, autoChanges) => {
    setForm((current) => ({
      ...current,
      values: { ...current.values, ...changes },
      auto: autoChanges ? { ...current.auto, ...autoChanges } : current.auto,
    }));
    const touched = Object.keys(changes);
    if (touched.some((key) => serverErrors[key])) {
      setServerErrors((current) => Object.fromEntries(Object.entries(current).filter(([key]) => !touched.includes(key))));
    }
  };

  /** Applies smart defaults (warmth, wash after) for a new type/category unless the user set them. */
  const withDefaults = (changes) => {
    const next = { ...values, ...changes };
    const type = typeId(next.type);
    const extra = {};
    if (form.auto.warmth && DEFAULT_WARMTH[type]) extra.warmth = DEFAULT_WARMTH[type];
    if (form.auto.washAfter && next.category) {
      extra.washAfter = String(defaultWashAfter(TYPES[next.category]?.includes(type) ? type : null, next.category) ?? '');
    }
    return { ...changes, ...extra };
  };

  const setCategory = (category) => {
    const type = typeId(values.type);
    const keepType = !type || TYPES[category]?.includes(type);
    patch(withDefaults({ category, type: keepType ? values.type : '' }));
  };

  const setType = (text) => {
    const type = typeId(text);
    const changes = { type: text };
    const owner = TYPE_TO_CATEGORY[type];
    if (owner && (!values.category || !TYPES[values.category].includes(type))) changes.category = owner;
    patch(withDefaults(changes));
  };

  const showSuggestion =
    Boolean(values && suggestion) &&
    dismissedFor !== debouncedName &&
    Boolean(suggestion.category || suggestion.colors.length) &&
    ((suggestion.category && suggestion.category !== values.category) ||
      (suggestion.type && suggestion.type !== typeId(values.type)) ||
      (suggestion.colors.length > 0 && !sameList(suggestion.colors, values.colors)));

  const applySuggestion = () => {
    const changes = {};
    if (suggestion.category) changes.category = suggestion.category;
    if (suggestion.type) changes.type = typeLabel(suggestion.type);
    else if (suggestion.category && suggestion.category !== values.category) changes.type = '';
    if (suggestion.colors.length) changes.colors = suggestion.colors.slice(0, MAX_COLORS);
    patch(withDefaults(changes));
  };

  const focusField = (name) => {
    if (DETAIL_FIELDS.has(name)) setMoreOpen(true);
    window.requestAnimationFrame(() => {
      const element = document.getElementById(fieldId(name));
      if (!element) return;
      const target = element.matches('input, textarea, button')
        ? element
        : element.querySelector('[tabindex="0"], input, textarea, button');
      target?.focus();
    });
  };

  const requestClose = async () => {
    if (saving) return;
    if (dirty) {
      const ok = await confirm({
        title: 'Discard changes?',
        description: isEdit
          ? 'Your edits to this piece will be lost.'
          : 'This piece has not been added yet. The details and photo you entered will be lost.',
        confirmLabel: 'Discard',
        cancelLabel: 'Keep editing',
        destructive: true,
      });
      if (!ok) return;
    }
    onClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!values || saving || imageBusy) return;
    setSubmitted(true);
    setFormError(null);
    const errors = validate(values);
    const first = FIELD_ORDER.find((name) => errors[name]);
    if (first) {
      focusField(first);
      return;
    }
    try {
      if (isEdit) {
        const saved = await updateItem.mutateAsync({ id: itemId, patch: toPayload(values) });
        toast.success(`Saved changes to ${saved.name}`);
      } else {
        const created = await createItem.mutateAsync(toPayload(values));
        toast.show({
          message: `Added ${created.name}`,
          severity: 'success',
          action: { label: 'View', onClick: () => openItem(created.id) },
        });
      }
      onClose();
    } catch (error) {
      const fieldErrors = error?.fieldErrors ?? null;
      if (fieldErrors && Object.keys(fieldErrors).length) {
        setServerErrors(fieldErrors);
        const firstServer = FIELD_ORDER.find((name) => fieldErrors[name]);
        if (firstServer) focusField(firstServer);
        else setFormError(error.message);
      } else {
        setFormError(error?.message || 'Could not save this piece. Try again.');
      }
    }
  };

  const title = isEdit ? 'Edit item' : 'Add item';
  const laundered = isLaundered(values?.category);
  const typeOptions = values?.category
    ? TYPES[values.category].map(typeLabel)
    : Object.values(TYPES).flat().map(typeLabel);

  let body;
  if (!values) {
    if (itemQuery.error) {
      body =
        itemQuery.error.status === 404 ? (
          <EmptyState
            compact
            icon={SearchOffOutlined}
            titleComponent="p"
            title="This piece no longer exists"
            description="It may have been deleted. Close this and pick another piece."
          />
        ) : (
          <ErrorState compact error={itemQuery.error} onRetry={() => itemQuery.refetch()} />
        );
    } else {
      body = <ItemFormSkeleton />;
    }
  }

  return (
    <ResponsiveDialog
      open={open}
      onClose={requestClose}
      maxWidth="md"
      className="item-form-dialog"
      slotProps={{ paper: { className: 'item-form-dialog__paper' } }}
    >
      <DialogHeader
        title={title}
        subtitle={isEdit ? item?.name : 'Fields marked * are required.'}
        onClose={requestClose}
      />
      {body ? (
        <>
          <DialogContent className="item-form-dialog__content">{body}</DialogContent>
          <DialogActions className="item-form-dialog__actions">
            <Button variant="outlined" color="inherit" onClick={onClose}>
              Close
            </Button>
          </DialogActions>
        </>
      ) : (
        <form className="item-form" onSubmit={handleSubmit} noValidate>
          <DialogContent className="item-form-dialog__content">
            <div className="item-form__grid">
              <div className="item-form__media" id={fieldId('image')}>
                <ImageDropzone
                  value={values.image}
                  onChange={(image) => patch({ image })}
                  alt={values.name.trim() || 'Item photo'}
                  error={serverErrors.image}
                  pasteEnabled={open}
                  onBusyChange={setImageBusy}
                />
              </div>

              <div className="item-form__fields">
                {formError ? (
                  <Alert severity="error" role="alert" className="item-form__alert">
                    {formError}
                  </Alert>
                ) : null}

                <div className="item-form__field">
                  <TextField
                    id={fieldId('name')}
                    label="Name"
                    required
                    fullWidth
                    autoFocus
                    autoComplete="off"
                    placeholder="For example, navy chinos"
                    value={values.name}
                    onChange={(event) => patch({ name: event.target.value })}
                    onBlur={markBlurred('name')}
                    error={Boolean(errorFor('name'))}
                    helperText={errorFor('name')}
                    slotProps={{ htmlInput: { maxLength: 60 } }}
                  />
                  {showSuggestion ? (
                    <div className="item-form__suggestion" role="status">
                      <LightbulbOutlined className="item-form__suggestion-icon" aria-hidden />
                      <span className="item-form__suggestion-text">
                        Looks like <strong>{suggestionLabel(suggestion)}</strong>
                      </span>
                      <Button size="small" variant="text" onClick={applySuggestion} className="item-form__suggestion-apply">
                        Apply
                      </Button>
                      <Tooltip title="Dismiss">
                        <IconButton size="small" aria-label="Dismiss suggestion" onClick={() => setDismissedFor(debouncedName)}>
                          <CloseOutlined fontSize="inherit" />
                        </IconButton>
                      </Tooltip>
                    </div>
                  ) : null}
                </div>

                <div className="item-form__field">
                  <span className="item-form__label" id={fieldId('category-label')}>
                    Category <span aria-hidden>*</span>
                  </span>
                  <ChipGroup
                    id={fieldId('category')}
                    labelledBy={fieldId('category-label')}
                    options={CATEGORY_OPTIONS}
                    value={values.category}
                    onChange={setCategory}
                    invalid={Boolean(errorFor('category'))}
                    describedBy={errorFor('category') ? fieldId('category-error') : undefined}
                  />
                  {errorFor('category') ? (
                    <p className="item-form__error" id={fieldId('category-error')}>
                      {errorFor('category')}
                    </p>
                  ) : null}
                </div>

                <div className="item-form__field">
                  <Autocomplete
                    freeSolo
                    autoHighlight={false}
                    options={typeOptions}
                    groupBy={values.category ? undefined : (option) => CATEGORY_BY_ID[TYPE_TO_CATEGORY[typeId(option)]]?.label}
                    value={values.type || null}
                    inputValue={values.type}
                    onInputChange={(_event, text, reason) => {
                      if (reason === 'input' || reason === 'clear') setType(text);
                    }}
                    onChange={(_event, option) => setType(option ?? '')}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        id={fieldId('type')}
                        label="Type"
                        placeholder={values.category ? `For example, ${typeLabel(TYPES[values.category][0]).toLowerCase()}` : 'Choose or type'}
                        onBlur={markBlurred('type')}
                        error={Boolean(errorFor('type'))}
                        helperText={errorFor('type')}
                      />
                    )}
                  />
                </div>

                <div className="item-form__field">
                  <div className="item-form__label-row">
                    <span className="item-form__label" id={fieldId('colors-label')}>
                      Colours <span aria-hidden>*</span>
                    </span>
                    <span className="item-form__label-hint" id={fieldId('colors-hint')}>
                      Up to 3. The first is the main colour.
                    </span>
                  </div>
                  <ColorPicker
                    id={fieldId('colors')}
                    labelledBy={fieldId('colors-label')}
                    describedBy={cx(fieldId('colors-hint'), errorFor('colors') && fieldId('colors-error'))}
                    value={values.colors}
                    onChange={(colors) => patch({ colors })}
                    max={MAX_COLORS}
                    ordered
                    invalid={Boolean(errorFor('colors'))}
                  />
                  {errorFor('colors') ? (
                    <p className="item-form__error" id={fieldId('colors-error')}>
                      {errorFor('colors')}
                    </p>
                  ) : null}
                </div>

                <div className="item-form__field">
                  <span className="item-form__label" id={fieldId('occasions-label')}>
                    Occasions
                  </span>
                  <ChipGroup
                    id={fieldId('occasions')}
                    labelledBy={fieldId('occasions-label')}
                    options={OCCASION_OPTIONS}
                    value={values.occasions}
                    onChange={(occasions) => patch({ occasions })}
                    multiple
                  />
                </div>

                <div className="item-form__pair">
                  <div className="item-form__field">
                    <div className="item-form__label-row">
                      <span className="item-form__label" id={fieldId('warmth-label')}>
                        Warmth
                      </span>
                      <span className="item-form__label-value">{warmthLabel(values.warmth)}</span>
                    </div>
                    <Slider
                      className="item-form__slider"
                      value={values.warmth}
                      min={1}
                      max={5}
                      step={1}
                      marks={WARMTH_MARKS}
                      onChange={(_event, warmth) => patch({ warmth }, { warmth: false })}
                      getAriaValueText={warmthLabel}
                      slotProps={{ input: { 'aria-labelledby': fieldId('warmth-label'), id: fieldId('warmth') } }}
                    />
                  </div>
                  <div className="item-form__field item-form__field--switch">
                    <FormControlLabel
                      className="item-form__switch"
                      control={
                        <Switch checked={values.waterproof} onChange={(event) => patch({ waterproof: event.target.checked })} />
                      }
                      label="Waterproof"
                    />
                    <span className="item-form__label-hint">Picked first on rainy days.</span>
                  </div>
                </div>

                <div className="item-form__more">
                  <Button
                    variant="text"
                    color="inherit"
                    className={cx('item-form__more-toggle', moreOpen && 'item-form__more-toggle--open')}
                    endIcon={<ExpandMoreOutlined />}
                    aria-expanded={moreOpen}
                    aria-controls={fieldId('more')}
                    onClick={() => setMoreOpen((current) => !current)}
                  >
                    More details
                  </Button>
                  <Collapse in={moreOpen} id={fieldId('more')} className="item-form__more-panel">
                    <div className="item-form__more-grid">
                      <TextField
                        id={fieldId('brand')}
                        label="Brand"
                        fullWidth
                        autoComplete="off"
                        value={values.brand}
                        onChange={(event) => patch({ brand: event.target.value })}
                        onBlur={markBlurred('brand')}
                        error={Boolean(errorFor('brand'))}
                        helperText={errorFor('brand')}
                        slotProps={{ htmlInput: { maxLength: 40 } }}
                      />
                      <TextField
                        id={fieldId('price')}
                        label="Price"
                        fullWidth
                        type="number"
                        value={values.price}
                        onChange={(event) => patch({ price: event.target.value })}
                        onBlur={markBlurred('price')}
                        error={Boolean(errorFor('price'))}
                        helperText={errorFor('price') ?? 'Used for cost per wear.'}
                        slotProps={{
                          htmlInput: { min: 0, step: '0.01', inputMode: 'decimal' },
                          input: { startAdornment: <InputAdornment position="start">$</InputAdornment> },
                        }}
                      />
                      <TextField
                        id={fieldId('washAfter')}
                        className="item-form__wash"
                        label="Wash after"
                        fullWidth
                        type="number"
                        disabled={!laundered}
                        value={laundered ? values.washAfter : ''}
                        placeholder={laundered ? 'Not tracked' : undefined}
                        onChange={(event) => patch({ washAfter: event.target.value }, { washAfter: false })}
                        onBlur={markBlurred('washAfter')}
                        error={Boolean(errorFor('washAfter'))}
                        helperText={
                          errorFor('washAfter') ??
                          (laundered
                            ? 'Moves to the hamper after this many wears. Leave empty to skip the laundry.'
                            : values.category
                              ? 'Not tracked in laundry'
                              : 'Choose a category first.')
                        }
                        slotProps={{
                          htmlInput: { min: 1, max: 30, step: 1, inputMode: 'numeric' },
                          input: laundered ? { endAdornment: <InputAdornment position="end">wears</InputAdornment> } : undefined,
                        }}
                      />
                      <TextField
                        id={fieldId('notes')}
                        className="item-form__notes"
                        label="Notes"
                        fullWidth
                        multiline
                        minRows={3}
                        placeholder="Fit, care instructions, what it goes with"
                        value={values.notes}
                        onChange={(event) => patch({ notes: event.target.value })}
                        onBlur={markBlurred('notes')}
                        error={Boolean(errorFor('notes'))}
                        helperText={errorFor('notes')}
                        slotProps={{ htmlInput: { maxLength: 500 } }}
                      />
                    </div>
                  </Collapse>
                </div>
              </div>
            </div>
          </DialogContent>
          <DialogActions className="item-form-dialog__actions">
            <Button variant="outlined" color="inherit" onClick={requestClose} disabled={saving}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              loading={saving}
              disabled={imageBusy || (isEdit && !dirty)}
            >
              {isEdit ? 'Save changes' : 'Add to wardrobe'}
            </Button>
          </DialogActions>
        </form>
      )}
    </ResponsiveDialog>
  );
}

function ItemFormSkeleton() {
  return (
    <div className="item-form__grid" aria-busy="true" aria-label="Loading this piece">
      <div className="item-form__media">
        <Skeleton variant="rounded" className="item-form__skeleton-photo" />
      </div>
      <div className="item-form__fields">
        {[0, 1, 2, 3].map((row) => (
          <div className="item-form__field" key={row}>
            <Skeleton variant="text" width={96} />
            <Skeleton variant="rounded" height={row === 1 ? 32 : 44} />
          </div>
        ))}
      </div>
    </div>
  );
}
