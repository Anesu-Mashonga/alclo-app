import ArrowForwardOutlined from '@mui/icons-material/ArrowForwardOutlined';
import CheckOutlined from '@mui/icons-material/CheckOutlined';
import ChevronLeftOutlined from '@mui/icons-material/ChevronLeftOutlined';
import ChevronRightOutlined from '@mui/icons-material/ChevronRightOutlined';
import LockOutlined from '@mui/icons-material/LockOutlined';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Skeleton from '@mui/material/Skeleton';
import Tooltip from '@mui/material/Tooltip';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Link as RouterLink } from 'react-router';
import ErrorState from '@/components/common/ErrorState';
import ItemThumb from '@/components/common/ItemThumb';
import cx from '@/components/common/cx';
import useItemDrawer from '@/hooks/useItemDrawer';
import { selectNotWornLately } from './todayUtils';
import './NotWornLately.scss';

function lastWornText(days) {
  if (days === null) return 'Not worn yet';
  return `Last worn ${days} days ago`;
}

/** Tracks whether a horizontal scroller can move back or forward, for the arrow buttons. */
function useScrollEdges(ref, deps) {
  const [edges, setEdges] = useState({ prev: false, next: false });
  const measure = useCallback(() => {
    const node = ref.current;
    if (!node) return;
    const prev = node.scrollLeft > 4;
    const next = node.scrollLeft + node.clientWidth < node.scrollWidth - 4;
    setEdges((current) => (current.prev === prev && current.next === next ? current : { prev, next }));
  }, [ref]);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measure, ...deps]);

  return [edges, measure];
}

/**
 * Horizontal, scroll-snapping row of forgotten pieces. Each card opens the item drawer;
 * "Wear it today" locks the piece into today's outfit.
 */
export default function NotWornLately({ itemsQuery, lockedIds = [], disabled = false, onWear, className }) {
  const headingId = useId();
  const { openItem } = useItemDrawer();
  const entries = selectNotWornLately(itemsQuery.data?.items ?? []);
  const locked = new Set(lockedIds);
  const rowRef = useRef(null);
  const [edges, measure] = useScrollEdges(rowRef, [entries.length]);

  const scrollBy = (direction) => {
    const node = rowRef.current;
    if (!node) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    node.scrollBy({ left: direction * node.clientWidth * 0.8, behavior: reduce ? 'auto' : 'smooth' });
  };

  return (
    <section className={cx('not-worn', className)} aria-labelledby={headingId}>
      <header className="not-worn__header">
        <div>
          <h2 id={headingId} className="not-worn__title">
            Not worn lately
          </h2>
          <p className="not-worn__subtitle">Clean pieces you have not worn in 3 weeks or more</p>
        </div>
        <div className="not-worn__tools">
          {entries.length > 0 && (edges.prev || edges.next) ? (
            <div className="not-worn__arrows">
              <Tooltip title="Scroll back">
                <span>
                  <IconButton size="small" aria-label="Scroll back" disabled={!edges.prev} onClick={() => scrollBy(-1)}>
                    <ChevronLeftOutlined />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Scroll forward">
                <span>
                  <IconButton size="small" aria-label="Scroll forward" disabled={!edges.next} onClick={() => scrollBy(1)}>
                    <ChevronRightOutlined />
                  </IconButton>
                </span>
              </Tooltip>
            </div>
          ) : null}
          <Button
            component={RouterLink}
            to="/wardrobe?sort=least-worn"
            size="small"
            color="inherit"
            endIcon={<ArrowForwardOutlined />}
            className="not-worn__all"
          >
            Wardrobe
          </Button>
        </div>
      </header>

      {itemsQuery.isPending ? (
        <div className="not-worn__row" aria-hidden>
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="not-worn__card">
              <Skeleton variant="rounded" className="not-worn__skeleton-photo" />
              <Skeleton variant="text" width="80%" />
              <Skeleton variant="text" width="60%" />
            </div>
          ))}
        </div>
      ) : null}

      {itemsQuery.isError && !itemsQuery.data ? (
        <ErrorState compact title="Could not load your pieces" error={itemsQuery.error} onRetry={() => itemsQuery.refetch()} />
      ) : null}

      {itemsQuery.data && entries.length === 0 ? (
        <p className="not-worn__empty">
          <CheckOutlined aria-hidden />
          Everything clean has been worn in the last 3 weeks. Nice rotation.
        </p>
      ) : null}

      {entries.length > 0 ? (
        <ul className="not-worn__row" aria-label="Pieces not worn lately" ref={rowRef} onScroll={measure}>
          {entries.map(({ item, days }) => {
            const isLocked = locked.has(item.id);
            return (
              <li key={item.id} className="not-worn__card">
                <button
                  type="button"
                  className="not-worn__open"
                  onClick={() => openItem(item.id)}
                  aria-label={`${item.name}, ${lastWornText(days).toLowerCase()}. View details`}
                >
                  <ItemThumb item={item} />
                  <span className="not-worn__name">{item.name}</span>
                  <span className="not-worn__days">{lastWornText(days)}</span>
                </button>
                <Button
                  size="small"
                  variant={isLocked ? 'text' : 'outlined'}
                  color="inherit"
                  startIcon={isLocked ? <LockOutlined /> : <CheckOutlined />}
                  disabled={isLocked || disabled}
                  onClick={() => onWear?.(item)}
                  className={cx('not-worn__wear', isLocked && 'not-worn__wear--on')}
                  aria-label={isLocked ? `In today's outfit: ${item.name}` : `Wear it today: ${item.name}`}
                >
                  {isLocked ? "In today's outfit" : 'Wear it today'}
                </Button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
