import VisibilityOffOutlined from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import { useState } from 'react';

/**
 * Password TextField with a show/hide toggle. Accepts every TextField prop.
 */
export default function PasswordInput({ slotProps, ...props }) {
  const [visible, setVisible] = useState(false);
  const toggleLabel = visible ? 'Hide password' : 'Show password';

  return (
    <TextField
      type={visible ? 'text' : 'password'}
      fullWidth
      {...props}
      slotProps={{
        ...slotProps,
        htmlInput: { spellCheck: false, autoCapitalize: 'off', ...slotProps?.htmlInput },
        input: {
          ...slotProps?.input,
          endAdornment: (
            <InputAdornment position="end">
              <Tooltip title={toggleLabel}>
                <IconButton
                  edge="end"
                  aria-label={toggleLabel}
                  aria-pressed={visible}
                  onClick={() => setVisible((value) => !value)}
                  onMouseDown={(event) => event.preventDefault()}
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
