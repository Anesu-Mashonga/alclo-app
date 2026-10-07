import KeyboardDoubleArrowLeftOutlined from '@mui/icons-material/KeyboardDoubleArrowLeftOutlined';
import KeyboardDoubleArrowRightOutlined from '@mui/icons-material/KeyboardDoubleArrowRightOutlined';
import Badge from '@mui/material/Badge';
import IconButton from '@mui/material/IconButton';
import ListItemButton from '@mui/material/ListItemButton';
import Tooltip from '@mui/material/Tooltip';
import { createElement } from 'react';
import { Link, NavLink, useMatch, useResolvedPath } from 'react-router';
import cx from '@/components/common/cx';
import Logo from './Logo';
import { hamperLabel, NAV_ITEMS, SETTINGS_ITEM } from './navigation';
import useHamperCount from './useHamperCount';
import './SideNav.scss';

function SideNavLink({ item, variant, count = 0 }) {
  const resolved = useResolvedPath(item.to);
  const active = Boolean(useMatch({ path: resolved.pathname, end: Boolean(item.end) }));
  const icon = createElement(active ? item.activeIcon : item.icon, { className: 'side-nav__icon', 'aria-hidden': true });
  const isRail = variant === 'rail';

  return (
    <ListItemButton
      component={NavLink}
      to={item.to}
      end={item.end}
      selected={active}
      // The count is announced as part of the name ("Laundry, 7 in the hamper"); the visual
      // badge is aria-hidden. A hidden span would make Chrome read "Laundry , 7".
      aria-label={count > 0 ? hamperLabel(item.label, count) : undefined}
      className={cx('side-nav__link', active && 'side-nav__link--active')}
    >
      <span className="side-nav__icon-wrap">
        {isRail ? (
          <Badge
            color="primary"
            badgeContent={count}
            invisible={count === 0}
            max={99}
            className="side-nav__badge"
            slotProps={{ badge: { 'aria-hidden': true } }}
          >
            {icon}
          </Badge>
        ) : (
          icon
        )}
      </span>
      <span className="side-nav__label">{item.label}</span>
      {!isRail && count > 0 ? (
        <span className="side-nav__count" aria-hidden="true">
          {count > 99 ? '99+' : count}
        </span>
      ) : null}
    </ListItemButton>
  );
}

/**
 * Desktop navigation. `variant="full"` is the 248px sidebar (lg and up); `variant="rail"` is the
 * 76px icon rail with labels (md to lg, or when the user collapses the sidebar).
 *
 * Props: variant, canCollapse (show the collapse control), onToggleCollapse.
 */
export default function SideNav({ variant = 'full', canCollapse = false, onToggleCollapse }) {
  const hamperCount = useHamperCount();
  const isRail = variant === 'rail';
  const toggleLabel = isRail ? 'Expand sidebar' : 'Collapse sidebar';

  return (
    <nav className={cx('side-nav', `side-nav--${variant}`)} aria-label="Main">
      <div className="side-nav__brand">
        <Link to="/" className="side-nav__home" aria-label="Alclo, go to Today">
          <Logo variant={isRail ? 'mark' : 'full'} />
        </Link>
      </div>

      <ul className="side-nav__list">
        {NAV_ITEMS.map((item) => (
          <li key={item.id}>
            <SideNavLink item={item} variant={variant} count={item.id === 'laundry' ? hamperCount : 0} />
          </li>
        ))}
      </ul>

      <div className="side-nav__footer">
        <ul className="side-nav__list">
          <li>
            <SideNavLink item={SETTINGS_ITEM} variant={variant} />
          </li>
        </ul>
        {canCollapse ? (
          <Tooltip title={toggleLabel} placement="right">
            <IconButton
              className="side-nav__collapse"
              aria-label={toggleLabel}
              aria-expanded={!isRail}
              onClick={onToggleCollapse}
            >
              {isRail ? <KeyboardDoubleArrowRightOutlined /> : <KeyboardDoubleArrowLeftOutlined />}
            </IconButton>
          </Tooltip>
        ) : null}
      </div>
    </nav>
  );
}
