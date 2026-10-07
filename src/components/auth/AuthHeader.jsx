import { useRef } from 'react';
import cx from '@/components/common/cx';
import renderIcon from '@/components/common/renderIcon';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import { useRouteHeadingFocus } from '@/routes/routeFocus';
import './AuthHeader.scss';

/**
 * Title block for auth pages: the page h1 (focused after navigation), an optional subtitle and
 * an optional icon bubble. Sets document.title from `documentTitle` (or the title text).
 *
 * Props: title, subtitle, icon (element or component), documentTitle, headingRef, className,
 * routeFocus (default true): pass false when the page focuses a field itself after navigation.
 */
export default function AuthHeader({ title, subtitle, icon, documentTitle, headingRef, className, routeFocus = true }) {
  const ownRef = useRef(null);
  const skipRef = useRef(null);
  const ref = headingRef ?? ownRef;
  // Still claims the pending route focus (so nothing else takes it), but focuses nothing.
  useRouteHeadingFocus(routeFocus ? ref : skipRef);
  useDocumentTitle(documentTitle ?? (typeof title === 'string' ? title : undefined));

  return (
    <div className={cx('auth-header', className)}>
      {icon ? <span className="auth-header__icon">{renderIcon(icon, { 'aria-hidden': true })}</span> : null}
      <h1 ref={ref} tabIndex={-1} className="auth-header__title">
        {title}
      </h1>
      {subtitle ? <p className="auth-header__subtitle">{subtitle}</p> : null}
    </div>
  );
}
