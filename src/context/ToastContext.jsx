import Snackbar from '@mui/material/Snackbar';
import { createContext, useCallback, useContext, useMemo, useReducer, useRef } from 'react';
import Toast from '@/components/common/Toast';
import useHotkeys, { isOverlayActive } from '@/hooks/useHotkeys';

const ToastContext = createContext(null);

const DEFAULT_DURATION = 5000;
const ACTION_DURATION = 8000;

const initialState = { current: null, open: false, entered: false, queue: [], announcement: null };

/*
 * One toast is visible at a time. A new toast closes the visible one; when its exit transition
 * finishes the next queued toast appears. The announcement is mirrored into a persistent,
 * visually hidden live region so screen readers hear every toast exactly once.
 *
 * A toast that has not started its enter transition yet is swapped out directly instead of
 * closed: MUI's Snackbar renders nothing (and never fires onExited) when it closes before it
 * entered, which used to leave the queue stuck when two toasts arrived in the same moment
 * (for example "Start a load" and "Finish load" resolving together).
 */
const announcementFor = (toast) => ({ id: toast.id, text: toast.announce, assertive: toast.severity === 'error' });

function showNext(state, queue) {
  const [next, ...rest] = queue;
  if (!next) return { ...state, current: null, open: false, entered: false, queue: [] };
  return { ...state, current: next, open: true, entered: false, queue: rest, announcement: announcementFor(next) };
}

function reducer(state, action) {
  switch (action.type) {
    case 'enqueue': {
      const { toast } = action;
      // Nothing visible, or the visible toast never got on screen: show the new one right away.
      if (!state.current || !state.entered) return showNext(state, [toast, ...state.queue]);
      return { ...state, queue: [...state.queue, toast], open: false };
    }
    case 'entered':
      return state.current?.id === action.id ? { ...state, entered: true } : state;
    case 'close':
      if (!state.current || (action.id && state.current.id !== action.id)) {
        return { ...state, queue: action.id ? state.queue.filter((toast) => toast.id !== action.id) : state.queue };
      }
      if (!state.entered) return showNext(state, state.queue);
      return { ...state, open: false };
    case 'exited':
      return showNext(state, state.queue);
    default:
      return state;
  }
}

/**
 * Toast provider. Mount once near the root.
 *
 * useToast() API:
 *   toast.show({ message, severity = 'neutral' | 'success' | 'error' | 'info', action?: { label, onClick }, duration? }) -> id
 *   toast.success(message, opts?) / toast.error(message, opts?) / toast.info(message, opts?) -> id
 *   toast.dismiss(id?)  closes the given toast (or the visible one)
 *
 * Toasts with an action stay 8s (5s otherwise). While an action toast is visible,
 * Ctrl+Z / Cmd+Z runs its action (the Undo shortcut).
 */
export function ToastProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const counterRef = useRef(0);
  const { current, open, announcement } = state;

  const show = useCallback((options) => {
    const { message, severity = 'neutral', action = null, duration } = options ?? {};
    counterRef.current += 1;
    const id = options?.id ?? `toast_${counterRef.current}`;
    const announce = action ? `${String(message).replace(/[.\s]+$/, '')}. ${action.label} available.` : String(message);
    dispatch({
      type: 'enqueue',
      toast: {
        id,
        message,
        severity,
        action,
        announce,
        duration: duration ?? (action ? ACTION_DURATION : DEFAULT_DURATION),
      },
    });
    return id;
  }, []);

  const dismiss = useCallback((id) => dispatch({ type: 'close', id }), []);

  const api = useMemo(
    () => ({
      show,
      dismiss,
      success: (message, options) => show({ ...options, message, severity: 'success' }),
      error: (message, options) => show({ ...options, message, severity: 'error' }),
      info: (message, options) => show({ ...options, message, severity: 'info' }),
    }),
    [show, dismiss],
  );

  const runAction = useCallback(() => {
    if (!current?.action) return;
    dispatch({ type: 'close', id: current.id });
    current.action.onClick?.();
  }, [current]);

  useHotkeys({ 'mod+z': runAction }, { enabled: Boolean(open && current?.action) });

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') return;
    // Escape belongs to the open dialog or drawer, not to the toast underneath it.
    if (reason === 'escapeKeyDown' && isOverlayActive(event?.target)) return;
    dispatch({ type: 'close', id: current?.id });
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <Snackbar
        key={current?.id}
        className="toast-host"
        open={open}
        autoHideDuration={current?.duration ?? DEFAULT_DURATION}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slotProps={{
          transition: {
            onEntered: () => dispatch({ type: 'entered', id: current?.id }),
            onExited: () => dispatch({ type: 'exited' }),
          },
        }}
      >
        {current ? (
          <Toast
            message={current.message}
            severity={current.severity}
            action={current.action}
            onAction={runAction}
            onDismiss={() => dispatch({ type: 'close', id: current.id })}
          />
        ) : (
          <span />
        )}
      </Snackbar>
      <div className="u-visually-hidden" role="status" aria-live="polite" aria-atomic="true">
        {announcement && !announcement.assertive ? <span key={announcement.id}>{announcement.text}</span> : null}
      </div>
      <div className="u-visually-hidden" role="alert" aria-live="assertive" aria-atomic="true">
        {announcement?.assertive ? <span key={announcement.id}>{announcement.text}</span> : null}
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside <ToastProvider>.');
  return context;
}
