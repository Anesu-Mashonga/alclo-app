import CheckroomOutlined from '@mui/icons-material/CheckroomOutlined';
import LocalLaundryServiceOutlined from '@mui/icons-material/LocalLaundryServiceOutlined';
import PriorityHighOutlined from '@mui/icons-material/PriorityHighOutlined';
import ShoppingBasketOutlined from '@mui/icons-material/ShoppingBasketOutlined';
import Skeleton from '@mui/material/Skeleton';
import StatTile from '@/components/common/StatTile';
import { pieces, waitHint, washHint } from './laundryUtils';
import './LaundrySummary.scss';

function oldest(items) {
  return items.reduce((max, item) => Math.max(max, item.daysInStatus ?? 0), 0);
}

/**
 * Four stat tiles: In the hamper, Urgent, In the wash, Ready to wear (with a slim meter).
 * Pass `data` (the laundry overview) or `loading`.
 */
export default function LaundrySummary({ data, loading = false, urgentAfterDays = 3 }) {
  const counts = data?.counts ?? {};
  const hamper = counts.hamper ?? 0;
  const urgent = counts.urgent ?? 0;
  const washing = counts.washing ?? 0;
  const washable = counts.washable ?? 0;
  const clean = counts.clean ?? 0;
  const percent = Math.round((data?.readiness ?? 0) * 100);

  // Loading hints hold the same height as the real ones, so nothing jumps when the data lands.
  const hintSkeleton = <Skeleton width="70%" />;
  const hamperHint = hamper > 0 ? waitHint(oldest(data.hamper)) : 'Nothing waiting';
  const washingHint = washing > 0 ? washHint(oldest(data.washing)) : 'No load running';

  return (
    <section className="laundry-summary" aria-label="Laundry summary">
      <StatTile
        label="In the hamper"
        value={hamper}
        hint={loading ? hintSkeleton : hamperHint}
        icon={ShoppingBasketOutlined}
        tone="warning"
        loading={loading}
      />
      <StatTile
        label="Urgent"
        value={urgent}
        hint={loading ? hintSkeleton : `Waiting ${urgentAfterDays}+ ${urgentAfterDays === 1 ? 'day' : 'days'}`}
        icon={PriorityHighOutlined}
        tone={urgent > 0 ? 'error' : 'neutral'}
        loading={loading}
        className={urgent > 0 ? 'laundry-summary__urgent' : undefined}
      />
      <StatTile
        label="In the wash"
        value={washing}
        hint={loading ? hintSkeleton : washingHint}
        icon={LocalLaundryServiceOutlined}
        tone="info"
        loading={loading}
      />
      <StatTile
        label="Ready to wear"
        value={`${percent}%`}
        icon={CheckroomOutlined}
        tone="success"
        loading={loading}
        hint={
          loading ? (
            <span className="laundry-summary__ready">
              <span className="laundry-summary__meter" aria-hidden="true" />
              <Skeleton width="70%" />
            </span>
          ) : (
            <span className="laundry-summary__ready">
              <span
                className="laundry-summary__meter"
                role="meter"
                aria-label="Washable pieces that are clean"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percent}
                aria-valuetext={`${percent}%`}
              >
                <span className="laundry-summary__meter-fill" style={{ '--laundry-ready': percent / 100 }} />
              </span>
              <span>{`${clean} of ${pieces(washable)} clean`}</span>
            </span>
          )
        }
      />
    </section>
  );
}
