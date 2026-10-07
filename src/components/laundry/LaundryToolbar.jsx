import CheckOutlined from '@mui/icons-material/CheckOutlined';
import CloseOutlined from '@mui/icons-material/CloseOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import ExpandMoreOutlined from '@mui/icons-material/ExpandMoreOutlined';
import SortOutlined from '@mui/icons-material/SortOutlined';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import { useEffect, useId, useRef, useState } from 'react';
import useDebouncedValue from '@/hooks/useDebouncedValue';
import { LAUNDRY_CATEGORIES, SORTS } from './laundryUtils';
import './LaundryToolbar.scss';

/**
 * Search, category chips and sort for the laundry board. Values live in the URL (owned by the page);
 * the search box keeps a local draft and reports it after 200ms of quiet.
 */
export default function LaundryToolbar({ q, category, sort, onChange }) {
  const inputRef = useRef(null);
  const sortButtonId = useId();
  const sortMenuId = useId();
  const [sortAnchor, setSortAnchor] = useState(null);
  const [draft, setDraft] = useState(q);
  const [lastQ, setLastQ] = useState(q);
  const debounced = useDebouncedValue(draft, 200);

  // The URL changed from outside (Clear filters, Back): show that value.
  if (q !== lastQ) {
    setLastQ(q);
    if (q !== draft) setDraft(q);
  }

  useEffect(() => {
    if (debounced === draft && debounced !== q) onChange({ q: debounced });
  }, [debounced, draft, q, onChange]);

  // "/" anywhere on the page focuses this search box.
  useEffect(() => {
    const focusSearch = (event) => {
      if (!inputRef.current) return;
      event.preventDefault();
      inputRef.current.focus();
      inputRef.current.select();
    };
    window.addEventListener('alclo:focus-search', focusSearch);
    return () => window.removeEventListener('alclo:focus-search', focusSearch);
  }, []);

  const clearSearch = () => {
    setDraft('');
    onChange({ q: '' });
    inputRef.current?.focus();
  };

  const currentSort = SORTS.find((option) => option.id === sort) ?? SORTS[0];

  return (
    <div className="laundry-toolbar" role="search" aria-label="Filter the laundry">
      <TextField
        className="laundry-toolbar__search"
        placeholder="Search the laundry"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && draft) {
            event.stopPropagation();
            clearSearch();
          }
        }}
        inputRef={inputRef}
        slotProps={{
          htmlInput: {
            'aria-label': 'Search the laundry',
            type: 'search',
            enterKeyHint: 'search',
          },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlined fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: draft ? (
              <InputAdornment position="end">
                <Tooltip title="Clear search">
                  <IconButton size="small" aria-label="Clear search" onClick={clearSearch} edge="end">
                    <CloseOutlined fontSize="small" />
                  </IconButton>
                </Tooltip>
              </InputAdornment>
            ) : null,
          },
        }}
      />

      <div className="laundry-toolbar__row">
        <div className="laundry-toolbar__chips" role="group" aria-label="Category">
          <Chip
            label="All"
            clickable
            color={category ? 'default' : 'primary'}
            variant={category ? 'outlined' : 'filled'}
            aria-pressed={!category}
            onClick={() => onChange({ category: '' })}
          />
          {LAUNDRY_CATEGORIES.map((option) => {
            const active = category === option.id;
            return (
              <Chip
                key={option.id}
                label={option.label}
                clickable
                color={active ? 'primary' : 'default'}
                variant={active ? 'filled' : 'outlined'}
                aria-pressed={active}
                onClick={() => onChange({ category: active ? '' : option.id })}
              />
            );
          })}
        </div>

        <Tooltip title={`Sort: ${currentSort.label}`}>
          <Button
            id={sortButtonId}
            variant="outlined"
            color="inherit"
            className="laundry-toolbar__sort"
            startIcon={<SortOutlined />}
            endIcon={<ExpandMoreOutlined />}
            aria-haspopup="menu"
            aria-controls={sortAnchor ? sortMenuId : undefined}
            aria-expanded={sortAnchor ? 'true' : undefined}
            onClick={(event) => setSortAnchor(event.currentTarget)}
          >
            <span className="laundry-toolbar__sort-label">
              <span className="laundry-toolbar__sort-prefix">Sort:&nbsp;</span>
              {currentSort.label}
            </span>
          </Button>
        </Tooltip>
        <Menu
          id={sortMenuId}
          anchorEl={sortAnchor}
          open={Boolean(sortAnchor)}
          onClose={() => setSortAnchor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          slotProps={{ list: { 'aria-labelledby': sortButtonId } }}
        >
          {SORTS.map((option) => (
            <MenuItem
              key={option.id}
              selected={option.id === currentSort.id}
              onClick={() => {
                onChange({ sort: option.id === 'waiting' ? '' : option.id });
                setSortAnchor(null);
              }}
            >
              <ListItemIcon>{option.id === currentSort.id ? <CheckOutlined fontSize="small" /> : null}</ListItemIcon>
              <ListItemText>{option.label}</ListItemText>
            </MenuItem>
          ))}
        </Menu>
      </div>
    </div>
  );
}
