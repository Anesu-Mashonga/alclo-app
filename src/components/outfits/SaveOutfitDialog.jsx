import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TextField from '@mui/material/TextField';
import { useState } from 'react';
import DialogHeader from '@/components/common/DialogHeader';
import OutfitPreview from '@/components/common/OutfitPreview';
import ResponsiveDialog from '@/components/common/ResponsiveDialog';
import useLatched from './useLatched';
import { isApiError } from '@/hooks/api';
import './SaveOutfitDialog.scss';

/**
 * Small dialog that names an idea before saving it.
 *
 * Props: open, items, defaultName, onClose, onSave(name) -> Promise (rejects with ApiError on failure)
 */
export default function SaveOutfitDialog({ open, items = [], defaultName = '', onClose, onSave }) {
  const key = items.map((item) => item.id).join('|');
  const [shown, clear] = useLatched(open, { items, defaultName, key }, key);
  return (
    <ResponsiveDialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      className="save-outfit-dialog"
      slotProps={{ transition: { onExited: clear } }}
    >
      {shown ? (
        <SaveForm key={shown.key} items={shown.items} defaultName={shown.defaultName} onClose={onClose} onSave={onSave} />
      ) : null}
    </ResponsiveDialog>
  );
}

function SaveForm({ items, defaultName, onClose, onSave }) {
  const [name, setName] = useState(defaultName);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Give this outfit a name.');
      return;
    }
    if (trimmed.length > 50) {
      setError('Keep the name under 50 characters.');
      return;
    }
    setSaving(true);
    try {
      await onSave(trimmed);
    } catch (caught) {
      setError(
        isApiError(caught)
          ? (caught.fieldErrors?.name ?? caught.fieldErrors?.itemIds ?? caught.message)
          : 'Could not save. Try again.',
      );
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="save-outfit-dialog__form">
      <DialogHeader title="Save outfit" subtitle="Saved outfits are easy to wear again or plan." onClose={onClose} />
      <DialogContent className="save-outfit-dialog__content">
        <OutfitPreview items={items} layout="strip" size="sm" max={6} className="save-outfit-dialog__preview" />
        <TextField
          label="Name"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            if (error) setError(null);
          }}
          error={Boolean(error)}
          helperText={error ?? 'For example: Monday meetings'}
          autoFocus
          fullWidth
          slotProps={{ htmlInput: { maxLength: 60, onFocus: (event) => event.target.select() } }}
        />
      </DialogContent>
      <DialogActions className="save-outfit-dialog__actions">
        <Button variant="text" color="inherit" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="contained" loading={saving}>
          Save outfit
        </Button>
      </DialogActions>
    </form>
  );
}
