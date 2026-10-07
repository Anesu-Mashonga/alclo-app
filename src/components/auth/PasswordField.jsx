import KeyboardCapslockOutlined from '@mui/icons-material/KeyboardCapslockOutlined';
import VisibilityOffOutlined from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import { useId, useState } from 'react';
import cx from '@/components/common/cx';
import './PasswordField.scss';

/**
 * Password TextField with a show/hide toggle and a Caps Lock warning.
 *
 * Props: every TextField prop, plus
 * - describedBy: id of extra help (for example a strength checklist) read after the helper text
 * - label defaults to "Password"
 * The helper text shows the error first; the Caps Lock note is added underneath when it is on.
 */
export default function PasswordField({
  id,
  label = 'Password',
  helperText,
  describedBy,
  className,
  onKeyDown,
  onKeyUp,
  onBlur,
  slotProps,
  ...props
}) {
  const generatedId = useId();
  const inputId = id ?? `password-${generatedId}`;
  const [visible, setVisible] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  const readCapsLock = (event) => {
    if (typeof event.getModifierState === 'function') setCapsLock(event.getModifierState('CapsLock'));
  };

  const toggleLabel = visible ? 'Hide password' : 'Show password';
  const capsNote = capsLock ? (
    <span className="password-field__caps">
      <KeyboardCapslockOutlined aria-hidden />
      Caps Lock is on
    </span>
  ) : null;
  const helper =
    helperText || capsNote ? (
      <>
        {helperText ? <span className="password-field__helper">{helperText}</span> : null}
        {capsNote}
      </>
    ) : undefined;

  const helperId = helper ? `${inputId}-helper-text` : null;
  const describedByIds = [helperId, describedBy].filter(Boolean).join(' ') || undefined;

  return (
    <TextField
      {...props}
      id={inputId}
      label={label}
      type={visible ? 'text' : 'password'}
      helperText={helper}
      className={cx('password-field', className)}
      onKeyDown={(event) => {
        readCapsLock(event);
        onKeyDown?.(event);
      }}
      onKeyUp={(event) => {
        readCapsLock(event);
        onKeyUp?.(event);
      }}
      onBlur={(event) => {
        setCapsLock(false);
        onBlur?.(event);
      }}
      slotProps={{
        ...slotProps,
        htmlInput: {
          spellCheck: false,
          autoCapitalize: 'none',
          ...slotProps?.htmlInput,
          'aria-describedby': describedByIds,
        },
        input: {
          ...slotProps?.input,
          endAdornment: (
            <InputAdornment position="end">
              <Tooltip title={toggleLabel}>
                <IconButton
                  edge="end"
                  size="small"
                  aria-label={toggleLabel}
                  aria-controls={inputId}
                  onClick={() => setVisible((current) => !current)}
                  onMouseDown={(event) => event.preventDefault()}
                  className="password-field__toggle"
                >
                  {visible ? <VisibilityOffOutlined /> : <VisibilityOutlined />}
                </IconButton>
              </Tooltip>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}
