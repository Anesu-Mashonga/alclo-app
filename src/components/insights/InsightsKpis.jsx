import CheckroomOutlined from '@mui/icons-material/CheckroomOutlined';
import EventAvailableOutlined from '@mui/icons-material/EventAvailableOutlined';
import PaymentsOutlined from '@mui/icons-material/PaymentsOutlined';
import RepeatOutlined from '@mui/icons-material/RepeatOutlined';
import Skeleton from '@mui/material/Skeleton';
import StatTile from '@/components/common/StatTile';
import cx from '@/components/common/cx';
import { formatCount, formatCurrency, formatNumber, formatPercent } from '@/lib/format';
import './InsightsKpis.scss';

const hintSkeleton = <Skeleton variant="text" width="70%" />;

/**
 * KPI row: pieces, distinct pieces worn in the range (+ share of the wardrobe),
 * average wears per piece in the range and average cost per wear (all time).
 * Pass `loading` for the skeleton version (labels stay, values pulse).
 */
export default function InsightsKpis({ totals, rangeLabel, loading = false, busy = false }) {
  const t = totals ?? {};
  const utilization = t.utilization ?? 0;

  return (
    <div className={cx('insights-kpis', busy && 'insights-kpis--busy')}>
      <StatTile
        label="Pieces"
        icon={CheckroomOutlined}
        loading={loading}
        value={formatNumber(t.items ?? 0)}
        hint={loading ? hintSkeleton : formatCount(t.favorites ?? 0, 'favourite')}
      />
      <StatTile
        label={`Worn in ${rangeLabel}`}
        icon={EventAvailableOutlined}
        tone="primary"
        loading={loading}
        value={formatNumber(t.wornDistinct ?? 0)}
        hint={
          loading ? (
            hintSkeleton
          ) : (
            <span className="insights-kpis__usage">
              <span className="insights-kpis__meter" aria-hidden="true">
                <span className="insights-kpis__meter-fill" style={{ '--usage': utilization }} />
              </span>
              {formatPercent(utilization)} of your wardrobe
            </span>
          )
        }
      />
      <StatTile
        label="Wears per piece"
        icon={RepeatOutlined}
        loading={loading}
        value={formatNumber(t.avgWears ?? 0, 1)}
        hint={loading ? hintSkeleton : `Over the last ${rangeLabel}`}
      />
      <StatTile
        label="Cost per wear"
        icon={PaymentsOutlined}
        loading={loading}
        value={t.avgCostPerWear === null || t.avgCostPerWear === undefined ? '--' : formatCurrency(t.avgCostPerWear)}
        hint={
          loading
            ? hintSkeleton
            : t.avgCostPerWear === null || t.avgCostPerWear === undefined
              ? 'Add prices to see this'
              : `Average across ${formatCurrency(t.totalValue ?? 0)} of priced pieces`
        }
      />
    </div>
  );
}
