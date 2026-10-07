import AddPhotoAlternateOutlined from '@mui/icons-material/AddPhotoAlternateOutlined';
import Button from '@mui/material/Button';
import { useId, useRef, useState } from 'react';
import cx from '@/components/common/cx';
import { AVATAR_PRESETS } from '@/data/avatars';
import { initialsOf } from '@/lib/format';
import { IMAGE_ACCEPT, readImageFile } from '@/lib/image';
import './AvatarPicker.scss';

const PRESET_NAMES = { casual: 'Overshirt', puffer: 'Puffer' };

const sameAvatar = (a, b) => a?.type === b?.type && (a?.type === 'initials' || a?.value === b?.value);

/**
 * Avatar choice as a radio group: initials, the two preset renders, and an uploaded photo
 * (once there is one). Arrow keys move between options; "Upload photo" opens the file picker.
 *
 * Props: name (for initials), value ({ type, value }), uploadSrc, onChange(avatar), onUpload(dataUrl)
 */
export default function AvatarPicker({ name, value, uploadSrc, onChange, onUpload }) {
  const fileRef = useRef(null);
  const groupRef = useRef(null);
  const [error, setError] = useState(null);
  const [reading, setReading] = useState(false);
  const helpId = useId();

  const options = [
    { key: 'initials', avatar: { type: 'initials', value: initialsOf(name) }, label: 'Initials' },
    ...AVATAR_PRESETS.map((preset) => ({
      key: preset.id,
      avatar: { type: 'preset', value: preset.id },
      label: PRESET_NAMES[preset.id] ?? preset.label,
      description: preset.label,
      src: preset.src,
    })),
    ...(uploadSrc ? [{ key: 'upload', avatar: { type: 'upload', value: uploadSrc }, label: 'Your photo', src: uploadSrc }] : []),
  ];
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => sameAvatar(option.avatar, value)),
  );

  const select = (index, focus = false) => {
    const option = options[(index + options.length) % options.length];
    onChange(option.avatar);
    if (focus) {
      const buttons = groupRef.current?.querySelectorAll('[role="radio"]');
      buttons?.[(index + options.length) % options.length]?.focus();
    }
  };

  const handleKeyDown = (event) => {
    const moves = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    if (event.key in moves) {
      event.preventDefault();
      select(selectedIndex + moves[event.key], true);
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      select(event.key === 'Home' ? 0 : options.length - 1, true);
    }
  };

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setError(null);
    setReading(true);
    try {
      const dataUrl = await readImageFile(file, { maxDimension: 320, quality: 0.85 });
      onUpload(dataUrl);
    } catch (problem) {
      setError(problem?.message || 'We could not read that photo. Try a different file.');
    } finally {
      setReading(false);
    }
  };

  return (
    <div className="avatar-picker">
      <div
        ref={groupRef}
        role="radiogroup"
        aria-label="Avatar"
        aria-describedby={helpId}
        className="avatar-picker__options"
        onKeyDown={handleKeyDown}
      >
        {options.map((option, index) => {
          const checked = index === selectedIndex;
          return (
            <button
              key={option.key}
              type="button"
              role="radio"
              aria-checked={checked}
              aria-label={option.description ? `${option.label}: ${option.description}` : option.label}
              tabIndex={checked ? 0 : -1}
              className={cx('avatar-picker__option', checked && 'avatar-picker__option--checked')}
              onClick={() => select(index)}
            >
              <span className={cx('avatar-picker__face', option.src && 'avatar-picker__face--image')}>
                {option.src ? <img src={option.src} alt="" draggable={false} /> : initialsOf(name)}
              </span>
              <span className="avatar-picker__caption" aria-hidden>
                {option.label}
              </span>
            </button>
          );
        })}
      </div>
      <div className="avatar-picker__upload">
        <Button
          variant="outlined"
          color="inherit"
          size="small"
          startIcon={<AddPhotoAlternateOutlined />}
          loading={reading}
          loadingPosition="start"
          onClick={() => fileRef.current?.click()}
        >
          {uploadSrc ? 'Replace photo' : 'Upload photo'}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept={IMAGE_ACCEPT}
          className="u-visually-hidden"
          tabIndex={-1}
          aria-hidden
          onChange={handleFile}
        />
        <p id={helpId} className={cx('avatar-picker__help', error && 'avatar-picker__help--error')} role={error ? 'alert' : undefined}>
          {error ?? 'JPG, PNG, WebP or AVIF, up to 8 MB. We crop it to a circle.'}
        </p>
      </div>
    </div>
  );
}
