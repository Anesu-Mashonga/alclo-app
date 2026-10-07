import CheckOutlined from '@mui/icons-material/CheckOutlined';
import ExpandMoreOutlined from '@mui/icons-material/ExpandMoreOutlined';
import SortOutlined from '@mui/icons-material/SortOutlined';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import { useId, useState } from 'react';
import { SORT_BY_ID, SORT_OPTIONS } from './wardrobeParams';
import './SortMenu.scss';

/** Sort order picker. `compact` shows an icon button (phones). */
export default function SortMenu({ value, onChange, compact = false }) {
  const [anchor, setAnchor] = useState(null);
  const menuId = useId();
  const open = Boolean(anchor);
  const current = SORT_BY_ID[value] ?? SORT_OPTIONS[0];
  const triggerProps = {
    'aria-haspopup': 'menu',
    'aria-controls': open ? menuId : undefined,
    'aria-expanded': open || undefined,
    'aria-label': `Sort: ${current.label}`,
    onClick: (event) => setAnchor(event.currentTarget),
  };

  return (
    <>
      {compact ? (
        <Tooltip title={`Sort: ${current.label}`}>
          <IconButton className="sort-menu__icon-button" {...triggerProps}>
            <SortOutlined />
          </IconButton>
        </Tooltip>
      ) : (
        <Button
          variant="outlined"
          color="inherit"
          className="sort-menu__button"
          startIcon={<SortOutlined />}
          endIcon={<ExpandMoreOutlined />}
          {...triggerProps}
        >
          <span className="sort-menu__prefix">Sort:</span> {current.label}
        </Button>
      )}
      <Menu
        id={menuId}
        anchorEl={anchor}
        open={open}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        className="sort-menu"
      >
        {SORT_OPTIONS.map((option) => {
          const selected = option.id === current.id;
          return (
            <MenuItem
              key={option.id}
              role="menuitemradio"
              aria-checked={selected}
              selected={selected}
              onClick={() => {
                setAnchor(null);
                onChange(option.id);
              }}
            >
              <ListItemIcon>{selected ? <CheckOutlined fontSize="small" /> : null}</ListItemIcon>
              <ListItemText>{option.label}</ListItemText>
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}
