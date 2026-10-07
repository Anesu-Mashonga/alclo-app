import { createElement } from 'react';
import { Link } from 'react-router';
import cx from '@/components/common/cx';
import { SETTINGS_SECTIONS, sectionHref } from './settingsSections';
import './SettingsNav.scss';

/**
 * Settings sub-navigation. A vertical list beside the content from md up, a horizontal
 * scrolling strip of pills below md. Links (not tabs), so every section has a shareable URL.
 */
export default function SettingsNav({ active }) {
  return (
    <nav className="settings-nav" aria-label="Settings sections">
      <ul className="settings-nav__list">
        {SETTINGS_SECTIONS.map((section) => {
          const current = section.id === active;
          return (
            <li key={section.id} className="settings-nav__entry">
              <Link
                to={sectionHref(section.id)}
                replace
                preventScrollReset
                aria-current={current ? 'page' : undefined}
                className={cx('settings-nav__link', current && 'settings-nav__link--active')}
              >
                <span className="settings-nav__icon" aria-hidden>
                  {createElement(section.icon, { fontSize: 'inherit' })}
                </span>
                <span className="settings-nav__text">
                  <span className="settings-nav__label">{section.label}</span>
                  <span className="settings-nav__description">{section.description}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
