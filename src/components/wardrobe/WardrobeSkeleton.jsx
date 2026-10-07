import Skeleton from '@mui/material/Skeleton';
import './WardrobeSkeleton.scss';

/** Loading placeholder shaped like the grid cards or list rows. */
export default function WardrobeSkeleton({ view = 'grid', count = 12 }) {
  const cells = Array.from({ length: count }, (_, index) => index);
  if (view === 'list') {
    return (
      <div className="wardrobe-skeleton wardrobe-skeleton--list" aria-busy="true" aria-label="Loading your wardrobe">
        {cells.slice(0, 8).map((cell) => (
          <div key={cell} className="wardrobe-skeleton__row">
            <Skeleton variant="rounded" width={40} height={40} />
            <div className="wardrobe-skeleton__lines">
              <Skeleton variant="text" width="40%" />
              <Skeleton variant="text" width="22%" />
            </div>
            <Skeleton variant="rounded" width={80} height={22} className="wardrobe-skeleton__pill" />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="wardrobe-skeleton wardrobe-skeleton--grid" aria-busy="true" aria-label="Loading your wardrobe">
      {cells.map((cell) => (
        <div key={cell} className="wardrobe-skeleton__card">
          <Skeleton variant="rounded" className="wardrobe-skeleton__photo" />
          <Skeleton variant="text" width="72%" />
          <Skeleton variant="text" width="48%" />
          <Skeleton variant="text" width="36%" />
        </div>
      ))}
    </div>
  );
}
