import { useRef } from 'react';
import cx from '@/components/common/cx';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import { useRouteHeadingFocus } from '@/routes/routeFocus';
import './PageHeader.scss';

/**
 * Page title row. The <h1> takes focus after navigation (tabIndex -1) so screen readers
 * announce the new page, and it sets document.title ("Wardrobe | Alclo") from `title`.
 *
 * Props:
 * - title (string or node), subtitle
 * - actions: buttons on the right (wrap below the title on small screens)
 * - children: extra rows under the title (tabs, filters)
 * - documentTitle: override the tab title; pass false to leave document.title alone
 * - className
 */
export default function PageHeader({ title, subtitle, actions, children, documentTitle, className }) {
  const headingRef = useRef(null);
  useRouteHeadingFocus(headingRef);

  const tabTitle = documentTitle ?? (typeof title === 'string' ? title : undefined);
  useDocumentTitle(documentTitle === false ? false : tabTitle);

  return (
    <header className={cx('page-header', className)}>
      <div className="page-header__row">
        <div className="page-header__titles">
          <h1 ref={headingRef} tabIndex={-1} className="page-header__title">
            {title}
          </h1>
          {subtitle ? <p className="page-header__subtitle">{subtitle}</p> : null}
        </div>
        {actions ? <div className="page-header__actions">{actions}</div> : null}
      </div>
      {children ? <div className="page-header__extra">{children}</div> : null}
    </header>
  );
}
