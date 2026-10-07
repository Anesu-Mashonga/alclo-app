import { useId } from 'react';
import cx from '@/components/common/cx';
import './SettingRow.scss';

/**
 * One setting: label and description on the left, the control on the right (stacked on
 * small screens). `children` may be a function that receives { labelId, descriptionId }
 * so the control can point aria-labelledby / aria-describedby at the visible text.
 *
 * Props: label, description, children, align ('center' | 'start'), stack (always stack), className
 */
export default function SettingRow({ label, description, children, align = 'center', stack = false, className }) {
  const labelId = useId();
  const descriptionId = useId();
  const ids = { labelId, descriptionId: description ? descriptionId : undefined };

  return (
    <div className={cx('setting-row', `setting-row--${align}`, stack && 'setting-row--stack', className)}>
      <div className="setting-row__text">
        <div id={labelId} className="setting-row__label">
          {label}
        </div>
        {description ? (
          <div id={descriptionId} className="setting-row__description">
            {description}
          </div>
        ) : null}
      </div>
      <div className="setting-row__control">{typeof children === 'function' ? children(ids) : children}</div>
    </div>
  );
}
