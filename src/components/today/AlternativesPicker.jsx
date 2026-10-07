import ChevronRightOutlined from '@mui/icons-material/ChevronRightOutlined';
import CloseOutlined from '@mui/icons-material/CloseOutlined';
import LocalLaundryServiceOutlined from '@mui/icons-material/LocalLaundryServiceOutlined';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Popover from '@mui/material/Popover';
import Skeleton from '@mui/material/Skeleton';
import { useTheme } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useId, useRef } from 'react';
import { Link as RouterLink } from 'react-router';
import ErrorState from '@/components/common/ErrorState';
import ItemThumb from '@/components/common/ItemThumb';
import { useAlternatives } from '@/hooks/api';
import { occasionLabel } from '@/data/taxonomy';
import { lowerFirst } from '@/lib/format';
import { SLOT_LABELS, SLOT_NOUNS } from './todayUtils';
import './AlternativesPicker.scss';

const LIMIT = 6;

function OptionsList({ slot, current, occasion, weather, pickedIds, onPick }) {
  const listRef = useRef(null);
  const query = useAlternatives({ slot, occasion, weather, pickedIds, limit: LIMIT });

  const handleKeyDown = (event) => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    const buttons = [...(listRef.current?.querySelectorAll('.alt-picker__option') ?? [])];
    if (buttons.length === 0) return;
    const index = buttons.indexOf(document.activeElement);
    let next = 0;
    if (event.key === 'ArrowDown') next = index < 0 ? 0 : (index + 1) % buttons.length;
    if (event.key === 'ArrowUp') next = index <= 0 ? buttons.length - 1 : index - 1;
    if (event.key === 'End') next = buttons.length - 1;
    event.preventDefault();
    buttons[next]?.focus();
  };

  if (query.isPending) {
    return (
      <ul className="alt-picker__list" aria-busy="true" aria-label="Loading alternatives">
        {Array.from({ length: 4 }, (_, index) => (
          <li key={index} className="alt-picker__skeleton">
            <Skeleton variant="rounded" width={56} height={56} />
            <div className="alt-picker__skeleton-text">
              <Skeleton variant="text" width="70%" />
              <Skeleton variant="text" width="45%" />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  if (query.isError) {
    return <ErrorState compact title="Could not load alternatives" error={query.error} onRetry={() => query.refetch()} />;
  }

  const options = query.data ?? [];
  if (options.length === 0) {
    return (
      <div className="alt-picker__empty">
        <p>
          No other clean {SLOT_NOUNS[slot] ?? 'pieces'} right now
          {current ? `, so ${lowerFirst(current.name)} stays` : ''}.
        </p>
        <Button
          component={RouterLink}
          to="/laundry"
          variant="outlined"
          color="inherit"
          size="small"
          startIcon={<LocalLaundryServiceOutlined />}
        >
          Open laundry
        </Button>
      </div>
    );
  }

  return (
    <ul className="alt-picker__list" ref={listRef} onKeyDown={handleKeyDown}>
      {options.map(({ item, reasons }, index) => (
        <li key={item.id}>
          <button
            type="button"
            className="alt-picker__option"
            // The list opens on a user action, so moving focus into it is expected.
            autoFocus={index === 0}
            onClick={() => onPick(item)}
          >
            <ItemThumb item={item} size="sm" ratio="1/1" className="alt-picker__thumb" />
            <span className="alt-picker__text">
              <span className="alt-picker__name">{item.name}</span>
              <span className="alt-picker__reason">{reasons?.[0] ?? 'Clean and ready'}</span>
            </span>
            <ChevronRightOutlined className="alt-picker__chevron" aria-hidden />
          </button>
        </li>
      ))}
    </ul>
  );
}

/**
 * Ranked alternatives for one slot: a Popover on larger screens, a bottom sheet on phones.
 * Picking an option calls onPick(item); the page places and locks it.
 */
export default function AlternativesPicker({ open, anchorEl, slot, current, occasion, weather, pickedIds, onPick, onClose }) {
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down('sm'), { noSsr: true });
  const titleId = useId();
  const label = slot === 'accessory' && current ? current.name : (SLOT_LABELS[slot] ?? 'item').toLowerCase();
  const title = `Swap ${slot === 'accessory' ? lowerFirst(label) : label}`;

  const body = (
    <div className="alt-picker">
      <div className="alt-picker__header">
        <div className="alt-picker__titles">
          <h2 id={titleId} className="alt-picker__title">
            {title}
          </h2>
          <p className="alt-picker__subtitle">
            Clean {SLOT_NOUNS[slot] ?? 'pieces'} ranked for {lowerFirst(occasionLabel(occasion))} and the weather
          </p>
        </div>
        {isPhone ? (
          <Tooltip title="Close">
            <IconButton aria-label="Close" onClick={onClose} className="alt-picker__close">
              <CloseOutlined />
            </IconButton>
          </Tooltip>
        ) : null}
      </div>
      {open && slot ? (
        <OptionsList
          slot={slot}
          current={current}
          occasion={occasion}
          weather={weather}
          pickedIds={pickedIds}
          onPick={onPick}
        />
      ) : null}
    </div>
  );

  if (isPhone) {
    return (
      <Drawer
        anchor="bottom"
        open={open}
        onClose={onClose}
        className="alt-picker-sheet"
        slotProps={{ paper: { role: 'dialog', 'aria-labelledby': titleId, className: 'alt-picker-sheet__paper' } }}
      >
        <span className="alt-picker-sheet__handle" aria-hidden />
        {body}
      </Drawer>
    );
  }

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      slotProps={{ paper: { role: 'dialog', 'aria-labelledby': titleId, className: 'alt-picker-popover__paper' } }}
    >
      {body}
    </Popover>
  );
}
