import Skeleton from '@mui/material/Skeleton';

/** Loading state shaped like the outfit card: header, reasons, three tiles, accessories and actions. */
export default function OutfitCardSkeleton() {
  return (
    <section className="today-outfit today-outfit--loading" aria-busy="true" aria-label="Loading today's outfit">
      <div className="today-outfit__header">
        <div className="today-outfit__titles">
          <Skeleton variant="text" width={170} height={30} />
          <Skeleton variant="text" width={240} />
        </div>
        <Skeleton variant="rounded" width={184} height={40} className="today-outfit__skeleton-pill" />
      </div>
      <div className="today-outfit__reasons">
        <Skeleton variant="text" width={150} />
        <Skeleton variant="text" width={110} />
        <Skeleton variant="text" width={130} />
      </div>
      <div className="outfit-board">
        <div className="outfit-board__core outfit-board__core--3">
          {[0, 1, 2].map((index) => (
            <div key={index} className="slot-tile">
              <Skeleton variant="rounded" className="today-outfit__skeleton-photo" />
              <div className="slot-tile__meta">
                <Skeleton variant="text" width="35%" />
                <Skeleton variant="text" width="75%" />
              </div>
            </div>
          ))}
        </div>
        <div className="outfit-board__accessories">
          <Skeleton variant="text" width={100} />
          <div className="outfit-board__accessory-row">
            {[0, 1].map((index) => (
              <Skeleton key={index} variant="rounded" className="today-outfit__skeleton-square" />
            ))}
          </div>
        </div>
      </div>
      <div className="today-outfit__actions">
        <div className="today-outfit__secondary">
          <Skeleton variant="rounded" width={112} height={40} />
          <Skeleton variant="rounded" width={128} height={40} />
        </div>
        <Skeleton variant="rounded" width={124} height={40} className="today-outfit__skeleton-wear" />
      </div>
    </section>
  );
}
