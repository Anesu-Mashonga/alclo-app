import Badge from '@mui/material/Badge';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import { createElement, useEffect } from 'react';
import { matchPath, NavLink, useLocation } from 'react-router';
import { hamperLabel, NAV_ITEMS } from './navigation';
import useHamperCount from './useHamperCount';
import './MobileNav.scss';

const BOTTOM_INSET = 'calc(64px + env(safe-area-inset-bottom, 0px))';

function activeItemId(pathname) {
  const match = NAV_ITEMS.find((item) => matchPath({ path: item.to, end: Boolean(item.end) }, pathname));
  return match?.id ?? false;
}

/**
 * Bottom navigation below `md`: the five main destinations with labels.
 * While mounted it publishes its height as `--alclo-bottom-inset` on <html> so toasts and
 * sticky bottom bars can sit above it.
 */
export default function MobileNav() {
  const { pathname } = useLocation();
  const hamperCount = useHamperCount();
  const value = activeItemId(pathname);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--alclo-bottom-inset', BOTTOM_INSET);
    return () => root.style.removeProperty('--alclo-bottom-inset');
  }, []);

  return (
    <nav className="mobile-nav" aria-label="Main">
      <BottomNavigation component="div" showLabels value={value} className="mobile-nav__bar">
        {NAV_ITEMS.map((item) => {
          const active = value === item.id;
          const count = item.id === 'laundry' ? hamperCount : 0;
          const icon = createElement(active ? item.activeIcon : item.icon, { 'aria-hidden': true });
          return (
            <BottomNavigationAction
              key={item.id}
              value={item.id}
              component={NavLink}
              to={item.to}
              end={item.end}
              label={item.label}
              aria-label={count > 0 ? hamperLabel(item.label, count) : undefined}
              icon={
                <Badge
                  color="primary"
                  badgeContent={count}
                  invisible={count === 0}
                  max={99}
                  slotProps={{ badge: { 'aria-hidden': true } }}
                >
                  {icon}
                </Badge>
              }
              className="mobile-nav__action"
            />
          );
        })}
      </BottomNavigation>
    </nav>
  );
}
