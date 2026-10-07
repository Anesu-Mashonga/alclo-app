import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TextField from '@mui/material/TextField';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import DialogHeader from '@/components/common/DialogHeader';
import OutfitPreview from '@/components/common/OutfitPreview';
import ResponsiveDialog from '@/components/common/ResponsiveDialog';
import { useToast } from '@/context/ToastContext';
import { occasionLabel } from '@/data/taxonomy';
import { useCreateOutfit } from '@/hooks/api';
import { defaultOutfitName } from './todayUtils';
import './SaveOutfitDialog.scss';

function SaveForm({ items, occasion, onClose }) {
  const toast = useToast();
  const navigate = useNavigate();
  const createOutfit = useCreateOutfit();
  const [name, setName] = useState(() => defaultOutfitName(occasion));
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Give this outfit a name.');
      return;
    }
    try {
      const outfit = await createOutfit.mutateAsync({ name: trimmed, itemIds: items.map((item) => item.id), occasion });
      onClose();
      toast.show({
        message: `Saved "${outfit.name}" to your outfits`,
        severity: 'success',
        action: { label: 'View', onClick: () => navigate('/outfits?tab=saved') },
      });
    } catch (submitError) {
      const fieldError = submitError?.fieldErrors?.name ?? submitError?.fieldErrors?.itemIds;
      if (fieldError) setError(fieldError);
      else toast.error(submitError?.message ?? 'Could not save this outfit. Try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <DialogContent className="save-outfit__content">
        <OutfitPreview items={items} layout="strip" size="sm" max={6} className="save-outfit__preview" />
        <TextField
          label="Name"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            if (error) setError(null);
          }}
          error={Boolean(error)}
          helperText={error ?? `Saved as a ${occasionLabel(occasion).toLowerCase()} outfit`}
          fullWidth
          autoFocus
          slotProps={{ htmlInput: { maxLength: 50, onFocus: (event) => event.target.select() } }}
        />
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="contained" loading={createOutfit.isPending}>
          Save outfit
        </Button>
      </DialogActions>
    </form>
  );
}

/**
 * Small dialog to name and save the current outfit.
 * Give it a new `key` each time it opens so the name resets.
 */
export default function SaveOutfitDialog({ open, items, occasion, onClose }) {
  return (
    <ResponsiveDialog open={open} onClose={onClose} maxWidth="xs" className="save-outfit">
      <DialogHeader title="Save outfit" subtitle="Find it later in Outfits, or plan it for another day." onClose={onClose} />
      <SaveForm items={items} occasion={occasion} onClose={onClose} />
    </ResponsiveDialog>
  );
}
