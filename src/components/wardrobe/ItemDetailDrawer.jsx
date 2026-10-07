import CheckroomOutlined from '@mui/icons-material/CheckroomOutlined';
import ChevronLeftOutlined from '@mui/icons-material/ChevronLeftOutlined';
import ChevronRightOutlined from '@mui/icons-material/ChevronRightOutlined';
import CleaningServicesOutlined from '@mui/icons-material/CleaningServicesOutlined';
import CloseOutlined from '@mui/icons-material/CloseOutlined';
import DeleteOutlined from '@mui/icons-material/DeleteOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import LocalLaundryServiceOutlined from '@mui/icons-material/LocalLaundryServiceOutlined';
import SearchOffOutlined from '@mui/icons-material/SearchOffOutlined';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Skeleton from '@mui/material/Skeleton';
import Tooltip from '@mui/material/Tooltip';
import { useId, useMemo, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router';
import cx from '@/components/common/cx';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import ItemThumb from '@/components/common/ItemThumb';
import StatusBadge from '@/components/common/StatusBadge';
import { useAuth } from '@/context/AuthContext';
import { useUI } from '@/context/UIContext';
import { CATEGORY_BY_ID, COLOR_BY_ID, occasionLabel } from '@/data/taxonomy';
import { useItem, useItemHistory, useItems } from '@/hooks/api';
import { isEditableTarget } from '@/hooks/useHotkeys';
import useItemDrawer from '@/hooks/useItemDrawer';
import { formatDate, formatDayLabel, relativeDayLabel } from '@/lib/dates';
import { formatCurrency } from '@/lib/format';
import { isUrgent, isWashable, laundryReason } from '@/lib/laundry';
import ColorSwatch from './ColorSwatch';
import FavoriteButton from './FavoriteButton';
import { formatCostPerWear, itemKind, warmthLabel } from './itemFormat';
import useItemActions from './useItemActions';
import { parseWardrobeParams, toItemFilters } from './wardrobeParams';
import './ItemDetailDrawer.scss';

const HISTORY_LIMIT = 5;

/**
 * Previous / next item ids from the wardrobe list the person is looking at. The page keeps its
 * filters in the URL, so the drawer reads the same params and shares the page's cached query.
 */
function useWardrobeSequence(itemId, enabled) {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const onWardrobe = pathname === '/wardrobe';
  const filters = useMemo(() => toItemFilters(parseWardrobeParams(searchParams)), [searchParams]);
  const { data } = useItems(filters, { enabled: enabled && onWardrobe });
  if (!onWardrobe || !data?.items) return { available: false };
  const ids = data.items.map((item) => item.id);
  const index = ids.indexOf(itemId);
  if (index === -1) return { available: false };
  return {
    available: ids.length > 1,
    index,
    total: ids.length,
    prevId: index > 0 ? ids[index - 1] : null,
    nextId: index < ids.length - 1 ? ids[index + 1] : null,
  };
}

/**
 * Global item drawer (`?item=<id>` on any page), mounted by AppShell.
 * Right-hand panel (440px), a full-screen sheet below 600px.
 * @param {{ itemId: string | null, onClose: () => void }} props
 */
export default function ItemDetailDrawer({ itemId, onClose }) {
  const open = Boolean(itemId);
  // Keep showing the last item while the drawer slides out.
  const [shownId, setShownId] = useState(itemId);
  if (itemId && itemId !== shownId) setShownId(itemId);
  const id = itemId ?? shownId;

  const titleId = useId();
  const ui = useUI();
  const { user } = useAuth();
  const actions = useItemActions();
  const { data: item, isPending, error, refetch } = useItem(id);
  const sequence = useWardrobeSequence(id, open);
  const { openItem } = useItemDrawer();

  const goTo = (targetId) => {
    if (targetId) openItem(targetId);
  };

  const handleKeyDown = (event) => {
    if (!sequence.available || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
    if (isEditableTarget(event.target) || event.target.closest?.('[role="radiogroup"], [role="slider"], [role="menu"]')) return;
    if (event.key === 'ArrowLeft' && sequence.prevId) {
      event.preventDefault();
      goTo(sequence.prevId);
    } else if (event.key === 'ArrowRight' && sequence.nextId) {
      event.preventDefault();
      goTo(sequence.nextId);
    }
  };

  const notFound = error?.status === 404;
  const urgent = item ? isUrgent(item, user?.preferences?.urgentAfterDays ?? 3) : false;

  const handleDelete = () => {
    const target = item;
    onClose();
    actions.deleteItems(target);
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      className="item-drawer"
      slotProps={{
        paper: {
          className: 'item-drawer__paper',
          role: 'dialog',
          'aria-modal': true,
          'aria-labelledby': titleId,
          onKeyDown: handleKeyDown,
        },
      }}
    >
      <div className="item-drawer__header">
        {sequence.available ? (
          <div className="item-drawer__nav">
            <Tooltip title="Previous piece">
              <span>
                <IconButton
                  aria-label="Previous piece"
                  aria-keyshortcuts="ArrowLeft"
                  disabled={!sequence.prevId}
                  onClick={() => goTo(sequence.prevId)}
                >
                  <ChevronLeftOutlined />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Next piece">
              <span>
                <IconButton
                  aria-label="Next piece"
                  aria-keyshortcuts="ArrowRight"
                  disabled={!sequence.nextId}
                  onClick={() => goTo(sequence.nextId)}
                >
                  <ChevronRightOutlined />
                </IconButton>
              </span>
            </Tooltip>
            <span className="item-drawer__position" aria-live="polite">
              {sequence.index + 1} of {sequence.total}
            </span>
          </div>
        ) : (
          <span className="item-drawer__eyebrow">Piece details</span>
        )}
        <Tooltip title="Close">
          <IconButton className="item-drawer__close" aria-label="Close" onClick={onClose}>
            <CloseOutlined />
          </IconButton>
        </Tooltip>
      </div>

      {item && !notFound ? (
        <>
          <div className="item-drawer__body" key={item.id}>
            <ItemThumb item={item} size="lg" ratio="1/1" className="item-drawer__photo" />

            <div className="item-drawer__titles">
              <div className="item-drawer__title-text">
                <h2 className="item-drawer__title" id={titleId}>
                  {item.name}
                </h2>
                <p className="item-drawer__kind">
                  {itemKind(item)}
                  {item.type ? <span> in {CATEGORY_BY_ID[item.category]?.label.toLowerCase()}</span> : null}
                  {item.brand ? <span>, {item.brand}</span> : null}
                </p>
              </div>
              <FavoriteButton item={item} onToggle={() => actions.toggleFavorite(item)} className="item-drawer__favorite" />
            </div>

            <ul className="item-drawer__colors" aria-label="Colours">
              {item.colors.map((colorId, index) => (
                <li key={colorId} className="item-drawer__color">
                  <ColorSwatch color={colorId} size={14} />
                  <span>{COLOR_BY_ID[colorId]?.label ?? colorId}</span>
                  {index === 0 && item.colors.length > 1 ? <span className="item-drawer__color-note">main</span> : null}
                </li>
              ))}
            </ul>

            <LaundryPanel item={item} urgent={urgent} actions={actions} />

            <dl className="item-drawer__stats">
              <div className="item-drawer__stat">
                <dt>Times worn</dt>
                <dd>{item.wearCount ?? 0}</dd>
              </div>
              <div className="item-drawer__stat">
                <dt>Last worn</dt>
                <dd>{relativeDayLabel(item.lastWornAt)}</dd>
              </div>
              <div className="item-drawer__stat">
                <dt>Cost per wear</dt>
                <dd>{formatCostPerWear(item)}</dd>
              </div>
              <div className="item-drawer__stat">
                <dt>Added</dt>
                <dd>{formatDate(item.createdAt, 'D MMM YYYY')}</dd>
              </div>
            </dl>

            <section className="item-drawer__section" aria-labelledby={`${titleId}-details`}>
              <h3 className="item-drawer__section-title" id={`${titleId}-details`}>
                Details
              </h3>
              <dl className="item-drawer__details">
                <div className="item-drawer__detail">
                  <dt>Occasions</dt>
                  <dd>
                    {item.occasions?.length ? (
                      <span className="item-drawer__chips">
                        {item.occasions.map((occasion) => (
                          <Chip key={occasion} size="small" label={occasionLabel(occasion)} />
                        ))}
                      </span>
                    ) : (
                      <span className="item-drawer__muted">None set</span>
                    )}
                  </dd>
                </div>
                <div className="item-drawer__detail">
                  <dt>Warmth</dt>
                  <dd>
                    <span className="item-drawer__warmth" aria-hidden>
                      {[1, 2, 3, 4, 5].map((step) => (
                        <span key={step} className={cx(step <= item.warmth && 'is-on')} />
                      ))}
                    </span>
                    {warmthLabel(item.warmth)}
                  </dd>
                </div>
                <div className="item-drawer__detail">
                  <dt>Waterproof</dt>
                  <dd>{item.waterproof ? 'Yes' : 'No'}</dd>
                </div>
                {item.price !== null && item.price !== undefined ? (
                  <div className="item-drawer__detail">
                    <dt>Price</dt>
                    <dd>{formatCurrency(item.price)}</dd>
                  </div>
                ) : null}
                <div className="item-drawer__detail">
                  <dt>Wash after</dt>
                  <dd>
                    {isWashable(item) ? (
                      `${item.laundry.washAfter} ${item.laundry.washAfter === 1 ? 'wear' : 'wears'}`
                    ) : (
                      <span className="item-drawer__muted">Not tracked in laundry</span>
                    )}
                  </dd>
                </div>
                {item.notes ? (
                  <div className="item-drawer__detail item-drawer__detail--block">
                    <dt>Notes</dt>
                    <dd className="item-drawer__notes">{item.notes}</dd>
                  </div>
                ) : null}
              </dl>
            </section>

            <WearHistory itemId={item.id} titleId={`${titleId}-history`} />
          </div>

          <div className="item-drawer__footer">
            <Tooltip title="Delete">
              <IconButton className="item-drawer__delete" aria-label={`Delete ${item.name}`} onClick={handleDelete}>
                <DeleteOutlined />
              </IconButton>
            </Tooltip>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<CheckroomOutlined />}
              loading={actions.pending.wear}
              loadingPosition="start"
              onClick={() => actions.wearToday(item)}
            >
              Wear today
            </Button>
            <Button
              variant="contained"
              startIcon={<EditOutlined />}
              onClick={() => ui.openItemForm({ mode: 'edit', itemId: item.id })}
            >
              Edit
            </Button>
          </div>
        </>
      ) : notFound ? (
        <div className="item-drawer__body item-drawer__body--state">
          <EmptyState
            icon={SearchOffOutlined}
            title={<span id={titleId}>This piece no longer exists</span>}
            description="It may have been deleted, or the link is out of date."
            action={
              <Button variant="outlined" color="inherit" onClick={onClose}>
                Close
              </Button>
            }
          />
        </div>
      ) : error ? (
        <div className="item-drawer__body item-drawer__body--state">
          <span className="u-visually-hidden" id={titleId}>
            Piece details
          </span>
          <ErrorState error={error} onRetry={() => refetch()} />
        </div>
      ) : isPending || !item ? (
        <DrawerSkeleton titleId={titleId} />
      ) : null}
    </Drawer>
  );
}

function LaundryPanel({ item, urgent, actions }) {
  const status = item.laundry?.status ?? 'clean';
  const washable = isWashable(item);
  return (
    <div className={cx('item-drawer__laundry', urgent && 'item-drawer__laundry--urgent')}>
      <div className="item-drawer__laundry-text">
        <StatusBadge status={status} urgent={urgent} />
        <span className="item-drawer__reason">{laundryReason(item)}</span>
      </div>
      {washable && status === 'clean' ? (
        <Button
          size="small"
          variant="outlined"
          color="inherit"
          startIcon={<LocalLaundryServiceOutlined />}
          loading={actions.pending.laundry}
          loadingPosition="start"
          onClick={() => actions.sendToLaundry(item)}
        >
          Send to laundry
        </Button>
      ) : null}
      {washable && status !== 'clean' ? (
        <Button
          size="small"
          variant="outlined"
          color="inherit"
          startIcon={<CleaningServicesOutlined />}
          loading={actions.pending.laundry}
          loadingPosition="start"
          onClick={() => actions.markClean(item)}
        >
          Mark clean
        </Button>
      ) : null}
    </div>
  );
}

function WearHistory({ itemId, titleId }) {
  const { data: logs, isPending, error, refetch } = useItemHistory(itemId);
  const recent = (logs ?? []).slice(0, HISTORY_LIMIT);

  return (
    <section className="item-drawer__section" aria-labelledby={titleId}>
      <h3 className="item-drawer__section-title" id={titleId}>
        Recent wears
      </h3>
      {error ? (
        <ErrorState compact error={error} onRetry={() => refetch()} />
      ) : isPending ? (
        <ul className="item-drawer__history" aria-busy="true">
          {[0, 1, 2].map((row) => (
            <li key={row} className="item-drawer__log">
              <Skeleton variant="text" width="45%" />
              <Skeleton variant="text" width="25%" />
            </li>
          ))}
        </ul>
      ) : recent.length === 0 ? (
        <p className="item-drawer__muted item-drawer__empty-history">
          Not worn yet. Choose Wear today when you put it on and it will show up here.
        </p>
      ) : (
        <ul className="item-drawer__history">
          {recent.map((log) => {
            const others = (log.items ?? []).filter((other) => other.id !== itemId);
            return (
              <li key={log.id} className="item-drawer__log">
                <div className="item-drawer__log-text">
                  <span className="item-drawer__log-date">{formatDayLabel(log.date)}</span>
                  <span className="item-drawer__log-meta">
                    {[relativeDayLabel(log.date), log.occasion ? occasionLabel(log.occasion) : null, log.outfit?.name]
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                </div>
                {others.length ? (
                  <span className="item-drawer__log-items" aria-label={`Worn with ${others.map((o) => o.name).join(', ')}`}>
                    {others.slice(0, 3).map((other) => (
                      <ItemThumb key={other.id} item={other} size="xs" ratio="1/1" aria-hidden />
                    ))}
                    {others.length > 3 ? <span className="item-drawer__log-more">+{others.length - 3}</span> : null}
                  </span>
                ) : null}
              </li>
            );
          })}
          {logs.length > HISTORY_LIMIT ? (
            <li className="item-drawer__muted item-drawer__history-more">
              {logs.length - HISTORY_LIMIT} earlier {logs.length - HISTORY_LIMIT === 1 ? 'wear' : 'wears'}
            </li>
          ) : null}
        </ul>
      )}
    </section>
  );
}

function DrawerSkeleton({ titleId }) {
  return (
    <div className="item-drawer__body" aria-busy="true">
      <span className="u-visually-hidden" id={titleId}>
        Loading piece
      </span>
      <Skeleton variant="rounded" className="item-drawer__photo-skeleton" />
      <div className="item-drawer__titles">
        <div className="item-drawer__title-text">
          <Skeleton variant="text" width="70%" height={32} />
          <Skeleton variant="text" width="40%" />
        </div>
      </div>
      <Skeleton variant="rounded" height={56} />
      <div className="item-drawer__stats">
        {[0, 1, 2, 3].map((cell) => (
          <Skeleton key={cell} variant="rounded" height={64} />
        ))}
      </div>
    </div>
  );
}
