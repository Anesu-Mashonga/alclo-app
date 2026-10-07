import ArrowForwardOutlined from '@mui/icons-material/ArrowForwardOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import Button from '@mui/material/Button';
import { createElement, useRef } from 'react';
import { Link, useLocation } from 'react-router';
import Kbd from '@/components/common/Kbd';
import { NAV_ITEMS } from '@/components/layout/navigation';
import { useAuth } from '@/context/AuthContext';
import { useUI } from '@/context/UIContext';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import { MOD_KEY_LABEL } from '@/hooks/useHotkeys';
import { useRouteHeadingFocus } from '@/routes/routeFocus';
import './NotFoundPage.scss';

const SHORTCUTS = NAV_ITEMS.filter((item) => item.id !== 'today');

/**
 * 404. Inside the app shell for signed-in people (with a search trigger and quick links),
 * standalone with sign-in links for everyone else.
 */
export default function NotFoundPage() {
  const { status } = useAuth();
  const ui = useUI();
  const location = useLocation();
  const headingRef = useRef(null);
  const signedIn = status === 'authenticated';

  useDocumentTitle('Page not found');
  useRouteHeadingFocus(headingRef);

  return (
    <div className={signedIn ? 'not-found' : 'not-found not-found--standalone'}>
      <div className="not-found__panel">
        <p className="not-found__code" aria-hidden>
          404
        </p>
        <h1 ref={headingRef} tabIndex={-1} className="not-found__title">
          We couldn&rsquo;t find that page
        </h1>
        <p className="not-found__text">
          The link may be old or mistyped. Your wardrobe, outfits and history are all still here.
        </p>
        <p className="not-found__path">
          <span className="u-visually-hidden">Address you tried: </span>
          <code>{location.pathname}</code>
        </p>

        <div className="not-found__actions">
          {signedIn ? (
            <>
              <Button variant="contained" component={Link} to="/">
                Go to Today
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<SearchOutlined />}
                onClick={() => ui.openCommandPalette()}
                className="not-found__search"
              >
                Search Alclo
                <span className="not-found__search-keys" aria-hidden>
                  <Kbd>{MOD_KEY_LABEL}</Kbd>
                  <Kbd>K</Kbd>
                </span>
              </Button>
            </>
          ) : (
            <>
              <Button variant="contained" component={Link} to="/login">
                Sign in
              </Button>
              <Button variant="outlined" color="inherit" component={Link} to="/signup">
                Create an account
              </Button>
            </>
          )}
        </div>

        {signedIn ? (
          <nav className="not-found__links" aria-label="Popular pages">
            <p className="not-found__links-title">Or head to</p>
            <ul className="not-found__list">
              {SHORTCUTS.map((item) => (
                <li key={item.id}>
                  <Link to={item.to} className="not-found__link">
                    <span className="not-found__link-icon" aria-hidden>
                      {createElement(item.icon, { fontSize: 'inherit' })}
                    </span>
                    <span className="not-found__link-label">{item.label}</span>
                    <ArrowForwardOutlined className="not-found__link-arrow" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </div>
    </div>
  );
}
