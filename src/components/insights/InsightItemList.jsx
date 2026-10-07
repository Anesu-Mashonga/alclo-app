import ItemThumb from '@/components/common/ItemThumb';
import cx from '@/components/common/cx';
import './InsightItemList.scss';

/** Up and Down move between the rows' main buttons, Home and End jump to the ends. */
function handleListKeyDown(event) {
  const keys = ['ArrowDown', 'ArrowUp', 'Home', 'End'];
  if (!keys.includes(event.key)) return;
  const target = event.target;
  if (!(target instanceof HTMLElement) || !target.classList.contains('insight-row__main')) return;
  const buttons = [...event.currentTarget.querySelectorAll('.insight-row__main')];
  const index = buttons.indexOf(target);
  if (index < 0) return;
  let next = index;
  if (event.key === 'ArrowDown') next = Math.min(buttons.length - 1, index + 1);
  if (event.key === 'ArrowUp') next = Math.max(0, index - 1);
  if (event.key === 'Home') next = 0;
  if (event.key === 'End') next = buttons.length - 1;
  event.preventDefault();
  buttons[next]?.focus();
}

/**
 * Vertical list of pieces. Each row's main area is one button that opens the item drawer;
 * optional trailing actions sit outside it so buttons are never nested.
 *
 * Props:
 * - rows: [{ key, item, title, detail, meta?, actions? }]
 * - onOpen(item)
 * - label: accessible name of the list
 */
export default function InsightItemList({ rows, onOpen, label, className }) {
  return (
    <ul className={cx('insight-list', className)} aria-label={label} onKeyDown={handleListKeyDown}>
      {rows.map((row) => (
        <li key={row.key} className="insight-row">
          <button type="button" className="insight-row__main" onClick={() => onOpen(row.item)}>
            <ItemThumb item={row.item} size="xs" ratio="1/1" className="insight-row__thumb" />
            <span className="insight-row__text">
              <span className="insight-row__title">{row.title}</span>
              <span className="insight-row__detail">{row.detail}</span>
            </span>
            {row.meta ? <span className="insight-row__meta">{row.meta}</span> : null}
          </button>
          {row.actions ? <div className="insight-row__actions">{row.actions}</div> : null}
        </li>
      ))}
    </ul>
  );
}
