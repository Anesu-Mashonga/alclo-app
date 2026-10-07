import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import { createContext, useCallback, useContext, useId, useRef, useState } from 'react';
import './ConfirmContext.scss';

const ConfirmContext = createContext(null);

const DEFAULTS = {
  title: 'Are you sure?',
  description: null,
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  destructive: false,
  requireText: null,
};

function matchesRequiredText(value, requireText) {
  if (!requireText) return true;
  return value.trim().toLowerCase() === String(requireText).trim().toLowerCase();
}

/**
 * Confirmation dialogs, for irreversible actions only (delete account, reset demo data,
 * discard unsaved changes). Everything else uses a toast with Undo.
 *
 *   const confirm = useConfirm();
 *   const ok = await confirm({ title, description, confirmLabel, cancelLabel, destructive, requireText });
 *
 * `requireText`: the user must type this text (case-insensitive) before the confirm button enables.
 */
export function ConfirmProvider({ children }) {
  const [state, setState] = useState({ open: false, options: DEFAULTS });
  const [typed, setTyped] = useState('');
  const resolverRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();

  const confirm = useCallback((options = {}) => {
    // A second request while one is open cancels the first.
    resolverRef.current?.(false);
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setTyped('');
      setState({ open: true, options: { ...DEFAULTS, ...options } });
    });
  }, []);

  const settle = (value) => {
    resolverRef.current?.(value);
    resolverRef.current = null;
    setState((current) => ({ ...current, open: false }));
  };

  const { open, options } = state;
  const { title, description, confirmLabel, cancelLabel, destructive, requireText } = options;
  const canConfirm = matchesRequiredText(typed, requireText);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (canConfirm) settle(true);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog
        open={open}
        onClose={() => settle(false)}
        maxWidth="xs"
        fullWidth
        role="alertdialog"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className="confirm-dialog"
      >
        <form onSubmit={handleSubmit} noValidate>
          <DialogTitle id={titleId}>{title}</DialogTitle>
          <DialogContent className="confirm-dialog__content">
            {description ? (
              <p id={descriptionId} className="confirm-dialog__description">
                {description}
              </p>
            ) : null}
            {requireText ? (
              <TextField
                className="confirm-dialog__field"
                label={`Type "${requireText}" to confirm`}
                value={typed}
                onChange={(event) => setTyped(event.target.value)}
                autoFocus
                fullWidth
                autoComplete="off"
                slotProps={{ htmlInput: { spellCheck: false, autoCapitalize: 'off' } }}
              />
            ) : null}
          </DialogContent>
          <DialogActions>
            <Button variant="outlined" color="inherit" onClick={() => settle(false)} autoFocus={destructive && !requireText}>
              {cancelLabel}
            </Button>
            <Button
              type="submit"
              variant="contained"
              color={destructive ? 'error' : 'primary'}
              disabled={!canConfirm}
              autoFocus={!destructive && !requireText}
            >
              {confirmLabel}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </ConfirmContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error('useConfirm must be used inside <ConfirmProvider>.');
  return context;
}
