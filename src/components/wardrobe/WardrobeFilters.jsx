import CloseOutlined from '@mui/icons-material/CloseOutlined';
import TuneOutlined from '@mui/icons-material/TuneOutlined';
import Badge from '@mui/material/Badge';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import Popover from '@mui/material/Popover';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useId, useState } from 'react';
import { LAUNDRY_STATUSES, OCCASIONS } from '@/data/taxonomy';
import ChipGroup from './ChipGroup';
import ColorPicker from './ColorPicker';
import { countPanelFilters } from './wardrobeParams';
import './WardrobeFilters.scss';

/**
 * The Filters panel: colours, laundry status, occasion and favourites. Changes apply as you go
 * (they are written to the URL), and the footer shows the live result count.
 */
function FilterPanel({ params, update, total, counts, onDone, headingId }) {
  const uid = useId();
  const active = countPanelFilters(params);
  const statusOptions = LAUNDRY_STATUSES.map((status) => ({
    id: status.id,
    label: counts ? `${status.label} ${counts.byStatus?.[status.id] ?? 0}` : status.label,
  }));

  return (
    <div className="filter-panel">
      <div className="filter-panel__header">
        <h2 className="filter-panel__title" id={headingId}>
          Filters
        </h2>
        <Tooltip title="Close">
          <IconButton aria-label="Close filters" onClick={onDone} size="small">
            <CloseOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
      </div>
      <div className="filter-panel__body">
        <section className="filter-panel__section">
          <h3 className="filter-panel__label" id={`${uid}-colours`}>
            Colour
          </h3>
          <ColorPicker
            size="sm"
            labelledBy={`${uid}-colours`}
            value={params.colors}
            onChange={(colors) => update({ colors })}
          />
        </section>
        <section className="filter-panel__section">
          <h3 className="filter-panel__label" id={`${uid}-status`}>
            Laundry status
          </h3>
          <ChipGroup
            multiple
            size="small"
            labelledBy={`${uid}-status`}
            options={statusOptions}
            value={params.status}
            onChange={(status) => update({ status })}
          />
        </section>
        <section className="filter-panel__section">
          <h3 className="filter-panel__label" id={`${uid}-occasion`}>
            Occasion
          </h3>
          <ChipGroup
            allowDeselect
            size="small"
            labelledBy={`${uid}-occasion`}
            options={OCCASIONS}
            value={params.occasion}
            onChange={(occasion) => update({ occasion })}
          />
        </section>
        <FormControlLabel
          className="filter-panel__switch"
          labelPlacement="start"
          control={<Switch checked={params.fav} onChange={(event) => update({ fav: event.target.checked })} />}
          label="Favourites only"
        />
      </div>
      <div className="filter-panel__footer">
        <Button
          variant="text"
          color="inherit"
          disabled={active === 0}
          onClick={() => update({ colors: null, status: null, occasion: null, fav: null })}
        >
          Reset
        </Button>
        <Button variant="contained" color="ink" onClick={onDone}>
          {total === undefined ? 'Done' : `Show ${total} ${total === 1 ? 'piece' : 'pieces'}`}
        </Button>
      </div>
    </div>
  );
}

/**
 * Filters button with an active-count badge. Opens a popover on larger screens and a bottom
 * sheet on phones.
 */
export default function WardrobeFilters({ params, update, total, counts, compact = false }) {
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down('sm'), { noSsr: true });
  const [anchor, setAnchor] = useState(null);
  const open = Boolean(anchor);
  const headingId = useId();
  const active = countPanelFilters(params);
  const label = active ? `Filters, ${active} active` : 'Filters';
  const close = () => setAnchor(null);

  const panel = (
    <FilterPanel params={params} update={update} total={total} counts={counts} onDone={close} headingId={headingId} />
  );

  return (
    <>
      {compact ? (
        <Tooltip title="Filters">
          <IconButton
            className="wardrobe-filters__icon-button"
            aria-label={label}
            aria-haspopup="dialog"
            aria-expanded={open}
            onClick={(event) => setAnchor(event.currentTarget)}
          >
            <Badge
              badgeContent={active}
              color="primary"
              invisible={active === 0}
              slotProps={{ badge: { 'aria-hidden': true } }}
            >
              <TuneOutlined />
            </Badge>
          </IconButton>
        </Tooltip>
      ) : (
        <Button
          variant="outlined"
          color="inherit"
          className="wardrobe-filters__button"
          startIcon={<TuneOutlined />}
          aria-label={label}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={(event) => setAnchor(event.currentTarget)}
        >
          Filters
          {active ? (
            <span className="wardrobe-filters__count" aria-hidden>
              {active}
            </span>
          ) : null}
        </Button>
      )}

      {isPhone ? (
        <Drawer
          anchor="bottom"
          open={open}
          onClose={close}
          className="wardrobe-filters__sheet"
          slotProps={{ paper: { role: 'dialog', 'aria-labelledby': headingId, className: 'wardrobe-filters__sheet-paper' } }}
        >
          {panel}
        </Drawer>
      ) : (
        <Popover
          open={open}
          anchorEl={anchor}
          onClose={close}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          className="wardrobe-filters__popover"
          slotProps={{
            paper: { role: 'dialog', 'aria-labelledby': headingId, className: 'wardrobe-filters__popover-paper' },
          }}
        >
          {panel}
        </Popover>
      )}
    </>
  );
}
