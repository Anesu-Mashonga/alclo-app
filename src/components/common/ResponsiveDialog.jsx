import Dialog from '@mui/material/Dialog';
import Slide from '@mui/material/Slide';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import cx from './cx';
import './ResponsiveDialog.scss';

/**
 * MUI Dialog that becomes a full-screen sheet below `sm` (600px) and slides up there.
 * Accepts every Dialog prop. Pass `fullScreen` explicitly to override the breakpoint.
 * Pair it with <DialogHeader> so full-screen sheets always have a visible close button.
 */
export default function ResponsiveDialog({
  fullScreen: fullScreenProp,
  className,
  slots,
  slotProps,
  maxWidth = 'sm',
  fullWidth = true,
  ...props
}) {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'), { noSsr: true });
  const fullScreen = fullScreenProp ?? isSmall;

  return (
    <Dialog
      fullScreen={fullScreen}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      className={cx('responsive-dialog', fullScreen && 'responsive-dialog--sheet', className)}
      slots={fullScreen ? { transition: Slide, ...slots } : slots}
      slotProps={
        fullScreen ? { ...slotProps, transition: { direction: 'up', ...slotProps?.transition } } : slotProps
      }
      {...props}
    />
  );
}
