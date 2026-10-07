import { typeLabel } from '@/data/taxonomy';
import { formatCurrency, pluralize } from '@/lib/format';
import InsightItemList from './InsightItemList';

/** Cost per wear across every wear so far, or null when the piece has no price. */
function costPerWear(item) {
  if (typeof item?.price !== 'number' || !item.wearCount) return null;
  return item.price / item.wearCount;
}

/** Top 5 pieces by wears in the range, with all-time cost per wear. */
export default function MostWornList({ mostWorn, onOpen }) {
  const rows = mostWorn.map(({ item, count }) => {
    const cpw = costPerWear(item);
    return {
      key: item.id,
      item,
      title: item.name,
      detail: `${typeLabel(item.type)} · ${cpw === null ? 'No price added' : `${formatCurrency(Math.round(cpw * 100) / 100)} a wear`}`,
      meta: (
        <>
          <span className="insight-row__count u-tabular">{count}</span>
          <span className="insight-row__unit">{pluralize(count, 'wear')}</span>
        </>
      ),
    };
  });

  return <InsightItemList rows={rows} onOpen={onOpen} label="Most worn pieces" />;
}
