import AddPhotoAlternateOutlined from '@mui/icons-material/AddPhotoAlternateOutlined';
import DeleteOutlined from '@mui/icons-material/DeleteOutlined';
import ImageOutlined from '@mui/icons-material/ImageOutlined';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { useEffect, useEffectEvent, useId, useRef, useState } from 'react';
import cx from '@/components/common/cx';
import Kbd from '@/components/common/Kbd';
import { MOD_KEY_LABEL } from '@/hooks/useHotkeys';
import { IMAGE_ACCEPT, readImageFile } from '@/lib/image';
import './ImageDropzone.scss';

function firstImageFile(list) {
  return [...(list ?? [])].find((file) => file && (file.type?.startsWith('image/') || /\.(jpe?g|png|webp|avif)$/i.test(file.name)));
}

/**
 * Photo picker for the item form: drag and drop, click to browse, or paste with Ctrl/Cmd+V
 * while `pasteEnabled`. Photos are validated, downscaled and stored as a data URL (lib/image).
 * Shows the preview in a photo well with Replace and Remove, and lib/image errors inline.
 *
 * @param {{ value: string | null, onChange: (dataUrl: string | null) => void, alt?: string,
 *   error?: string | null, pasteEnabled?: boolean, onBusyChange?: (busy: boolean) => void, className?: string }} props
 */
export default function ImageDropzone({ value, onChange, alt = 'Item photo', error, pasteEnabled = false, onBusyChange, className }) {
  const inputRef = useRef(null);
  const dragDepth = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState(null);
  const hintId = useId();
  const errorId = useId();
  const shownError = localError ?? error ?? null;

  const handleFile = async (file) => {
    if (!file) return;
    setLocalError(null);
    setBusy(true);
    onBusyChange?.(true);
    try {
      const dataUrl = await readImageFile(file);
      onChange(dataUrl);
    } catch (problem) {
      setLocalError(problem?.message || 'We could not read that photo. Try a different file.');
    } finally {
      setBusy(false);
      onBusyChange?.(false);
    }
  };

  const onPaste = useEffectEvent((event) => {
    const file = firstImageFile(event.clipboardData?.files);
    if (!file) return; // Plain text pastes go to the focused field as usual.
    event.preventDefault();
    handleFile(file);
  });

  useEffect(() => {
    if (!pasteEnabled) return undefined;
    const listener = (event) => onPaste(event);
    document.addEventListener('paste', listener);
    return () => document.removeEventListener('paste', listener);
  }, [pasteEnabled]);

  const browse = () => inputRef.current?.click();

  const dragProps = {
    onDragEnter: (event) => {
      if (![...(event.dataTransfer?.types ?? [])].includes('Files')) return;
      event.preventDefault();
      dragDepth.current += 1;
      setDragging(true);
    },
    onDragOver: (event) => {
      if (![...(event.dataTransfer?.types ?? [])].includes('Files')) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
    },
    onDragLeave: () => {
      dragDepth.current = Math.max(0, dragDepth.current - 1);
      if (dragDepth.current === 0) setDragging(false);
    },
    onDrop: (event) => {
      event.preventDefault();
      dragDepth.current = 0;
      setDragging(false);
      const file = firstImageFile(event.dataTransfer?.files);
      if (file) handleFile(file);
      else setLocalError('Drop a photo file: JPG, PNG, WebP or AVIF.');
    },
  };

  return (
    <div className={cx('image-dropzone', dragging && 'image-dropzone--dragging', className)}>
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        className="u-visually-hidden"
        tabIndex={-1}
        aria-label="Upload a photo"
        onChange={(event) => {
          handleFile(event.target.files?.[0]);
          event.target.value = '';
        }}
      />

      {value ? (
        <div className="image-dropzone__preview" {...dragProps}>
          <div className="image-dropzone__well">
            <img className="image-dropzone__img" src={value} alt={alt} />
            {busy ? (
              <div className="image-dropzone__busy">
                <CircularProgress size={28} aria-label="Preparing photo" />
              </div>
            ) : null}
            {dragging ? <div className="image-dropzone__drop-hint">Drop to replace</div> : null}
          </div>
          <div className="image-dropzone__actions">
            <Button
              variant="outlined"
              color="inherit"
              size="small"
              startIcon={<ImageOutlined />}
              onClick={browse}
              disabled={busy}
            >
              Replace
            </Button>
            <Button
              variant="text"
              color="inherit"
              size="small"
              startIcon={<DeleteOutlined />}
              onClick={() => {
                setLocalError(null);
                onChange(null);
              }}
              disabled={busy}
            >
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="image-dropzone__target"
          onClick={browse}
          aria-describedby={cx(hintId, shownError && errorId) || undefined}
          aria-busy={busy || undefined}
          {...dragProps}
        >
          {busy ? (
            <span className="image-dropzone__busy image-dropzone__busy--inline">
              <CircularProgress size={28} aria-hidden />
              <span>Preparing photo</span>
            </span>
          ) : (
            <>
              <span className="image-dropzone__icon" aria-hidden>
                <AddPhotoAlternateOutlined fontSize="inherit" />
              </span>
              <span className="image-dropzone__title">{dragging ? 'Drop the photo here' : 'Add a photo'}</span>
              <span className="image-dropzone__hint" id={hintId}>
                Drag one here, click to browse, or paste with <Kbd>{MOD_KEY_LABEL}</Kbd> <Kbd>V</Kbd>
              </span>
              <span className="image-dropzone__formats">JPG, PNG, WebP or AVIF up to 8 MB</span>
            </>
          )}
        </button>
      )}

      {shownError ? (
        <p className="image-dropzone__error" id={errorId} role="alert">
          {shownError}
        </p>
      ) : null}
    </div>
  );
}
