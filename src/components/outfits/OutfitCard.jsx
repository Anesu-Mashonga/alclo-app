import CheckOutlined from '@mui/icons-material/CheckOutlined';
import ErrorOutlineOutlined from '@mui/icons-material/ErrorOutlineOutlined';
import Favorite from '@mui/icons-material/Favorite';
import FavoriteBorder from '@mui/icons-material/FavoriteBorder';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import MoreHorizOutlined from '@mui/icons-material/MoreHorizOutlined';
import ShoppingBasketOutlined from '@mui/icons-material/ShoppingBasketOutlined';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Skeleton from '@mui/material/Skeleton';
import Tooltip from '@mui/material/Tooltip';
import { motion } from 'motion/react';
import { createElement, useId, useState } from 'react';
import cx from '@/components/common/cx';
import OutfitPreview from '@/components/common/OutfitPreview';
import { occasionLabel } from '@/data/taxonomy';
import PlanForMenu from './PlanForMenu';
import './OutfitCard.scss';

const FLAG_ICONS = { warning: ShoppingBasketOutlined, error: ErrorOutlineOutlined, muted: InfoOutlined };

/**
 * Card for an outfit idea or a saved outfit.
 *
 * Props:
 * - title, occasion (id), items (Item[]), meta (quiet line next to the occasion chip)
 * - reasons: string[] shown as a short checked list
 * - flags: [{ tone: 'warning' | 'error' | 'muted', text }]
 * - favorite: { value, onToggle(next) } (optional heart toggle)
 * - actions: buttons in the footer
 * - menuItems: [{ label, icon, onClick, destructive?, dividerBefore?, planFor? }] for the overflow menu.
 *   An entry with `planFor: true` becomes "Plan for..." and opens the day menu (needs onPlanFor).
 * - onPlanFor({ date, label, previous })
 * - busy: dims the card while it is being replaced
 * - className, ...article props
 */
export default function OutfitCard({
  title,
  occasion,
  items = [],
  meta,
  reasons = [],
  flags = [],
  favorite,
  actions,
  menuItems = [],
  onPlanFor,
  busy = false,
  className,
  ...rest
}) {
  const titleId = useId();
  const [anchor, setAnchor] = useState(null);
  const [openMenu, setOpenMenu] = useState(null); // 'actions' | 'plan' | null
  const [favPulse, setFavPulse] = useState(0);
  const hasMenu = menuItems.length > 0;
  const closeMenus = () => setOpenMenu(null);

  const runMenuItem = (entry) => {
    closeMenus();
    entry.onClick?.();
  };

  return (
    <article
      className={cx('outfit-card', busy && 'outfit-card--busy', className)}
      aria-labelledby={titleId}
      aria-busy={busy || undefined}
      {...rest}
    >
      <div className="outfit-card__preview">
        <OutfitPreview
          items={items}
          layout="flatlay"
          size="sm"
          label={`${title}: ${items.map((item) => item.name).join(', ')}`}
        />
      </div>

      <div className="outfit-card__body">
        <div className="outfit-card__head">
          <div className="outfit-card__titles">
            <h3 id={titleId} className="outfit-card__title">
              {title}
            </h3>
          </div>
          <div className="outfit-card__tools">
            {favorite ? (
              <Tooltip title={favorite.value ? 'Remove from favourites' : 'Add to favourites'}>
                <IconButton
                  className={cx('outfit-card__icon-btn', favorite.value && 'outfit-card__icon-btn--on')}
                  aria-label={`Favourite ${title}`}
                  aria-pressed={favorite.value}
                  onClick={() => {
                    setFavPulse((n) => n + 1);
                    favorite.onToggle(!favorite.value);
                  }}
                >
                  <motion.span
                    key={favPulse}
                    className="outfit-card__fav-icon"
                    initial={favPulse ? { scale: 0.6 } : false}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                  >
                    {favorite.value ? <Favorite fontSize="small" /> : <FavoriteBorder fontSize="small" />}
                  </motion.span>
                </IconButton>
              </Tooltip>
            ) : null}
            {hasMenu ? (
              <Tooltip title="More actions">
                <IconButton
                  className="outfit-card__icon-btn"
                  aria-label={`More actions for ${title}`}
                  aria-haspopup="menu"
                  aria-expanded={openMenu ? true : undefined}
                  onClick={(event) => {
                    setAnchor(event.currentTarget);
                    setOpenMenu('actions');
                  }}
                >
                  <MoreHorizOutlined fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : null}
          </div>
        </div>

        {occasion || meta ? (
          <div className="outfit-card__meta">
            {occasion ? <Chip size="small" label={occasionLabel(occasion)} className="outfit-card__occasion" /> : null}
            {meta ? <span className="outfit-card__meta-text">{meta}</span> : null}
          </div>
        ) : null}

        {reasons.length > 0 ? (
          <ul className="outfit-card__reasons" aria-label="Why this works">
            {reasons.map((reason) => (
              <li key={reason}>
                <CheckOutlined className="outfit-card__reason-icon" aria-hidden />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        ) : null}

        {flags.length > 0 ? (
          <ul className="outfit-card__flags">
            {flags.map((flag) => (
              <li key={flag.text} className={cx('outfit-card__flag', `outfit-card__flag--${flag.tone ?? 'muted'}`)}>
                {createElement(FLAG_ICONS[flag.tone] ?? InfoOutlined, {
                  className: 'outfit-card__flag-icon',
                  'aria-hidden': true,
                })}
                <span>{flag.text}</span>
              </li>
            ))}
          </ul>
        ) : null}

      </div>

      {actions ? <div className="outfit-card__actions">{actions}</div> : null}

      {hasMenu ? (
        <Menu
          anchorEl={anchor}
          open={openMenu === 'actions'}
          onClose={closeMenus}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          slotProps={{ list: { 'aria-label': `Actions for ${title}` } }}
        >
          {menuItems.flatMap((entry) => {
            const icon = entry.icon ? <ListItemIcon>{createElement(entry.icon)}</ListItemIcon> : null;
            const node = entry.planFor ? (
              <MenuItem key="plan-for" aria-haspopup="menu" onClick={() => setOpenMenu('plan')}>
                {icon}
                <ListItemText>Plan for...</ListItemText>
              </MenuItem>
            ) : (
              <MenuItem
                key={entry.label}
                onClick={() => runMenuItem(entry)}
                className={cx(entry.destructive && 'outfit-card__menu-danger')}
              >
                {icon}
                <ListItemText>{entry.label}</ListItemText>
              </MenuItem>
            );
            return entry.dividerBefore ? [<Divider key={`${entry.label}-divider`} />, node] : [node];
          })}
        </Menu>
      ) : null}

      {onPlanFor ? (
        <PlanForMenu
          anchorEl={anchor}
          open={openMenu === 'plan'}
          onClose={closeMenus}
          onPick={(day) => {
            closeMenus();
            onPlanFor(day);
          }}
        />
      ) : null}
    </article>
  );
}

/** Loading placeholder with the same shape as OutfitCard. */
export function OutfitCardSkeleton({ reasons = 2 }) {
  return (
    <div className="outfit-card outfit-card--skeleton" aria-hidden>
      <div className="outfit-card__preview">
        <div className="outfit-card__sk-flatlay">
          <div className="outfit-card__sk-main">
            <Skeleton variant="rounded" className="outfit-card__sk--upper" />
            <Skeleton variant="rounded" className="outfit-card__sk--bottom" />
            <Skeleton variant="rounded" className="outfit-card__sk--feet" />
          </div>
          <div className="outfit-card__sk-side">
            <Skeleton variant="rounded" className="outfit-card__sk--square" />
            <Skeleton variant="rounded" className="outfit-card__sk--square" />
          </div>
        </div>
      </div>
      <div className="outfit-card__body">
        <Skeleton variant="rounded" className="outfit-card__sk--title" />
        <Skeleton variant="rounded" className="outfit-card__sk--meta" />
        {Array.from({ length: reasons }, (_, index) => (
          <Skeleton key={index} variant="rounded" className="outfit-card__sk--line" />
        ))}
      </div>
      <div className="outfit-card__actions">
        <Skeleton variant="rounded" className="outfit-card__sk--button" />
        <Skeleton variant="rounded" className="outfit-card__sk--button" />
      </div>
    </div>
  );
}
