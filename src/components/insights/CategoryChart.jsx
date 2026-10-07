import { BarChart } from '@mui/x-charts/BarChart';
import { useReducedMotion } from 'motion/react';
import { useMemo } from 'react';
import { CATEGORY_BY_ID } from '@/data/taxonomy';
import ChartFigure from './ChartFigure';
import ChartTooltip from './ChartTooltip';
import { useChartColors } from './chartTheme';

const ROW = 40;
const Y_AXIS_WIDTH = 92;

/**
 * Wardrobe by category: horizontal stacked bars, worn in range (rose) vs not worn (zinc).
 * The "6 of 9" label at the end of each bar carries the numbers without hovering.
 */
export default function CategoryChart({ categories, rangeLabel, busy }) {
  const colors = useChartColors();
  const reduceMotion = useReducedMotion();

  const rows = useMemo(
    () =>
      categories.map((row) => ({
        id: row.category,
        label: CATEGORY_BY_ID[row.category]?.label ?? row.category,
        worn: row.worn,
        notWorn: Math.max(0, row.count - row.worn),
        count: row.count,
      })),
    [categories],
  );
  const byLabel = useMemo(() => new Map(rows.map((row) => [row.label, row])), [rows]);
  const max = Math.max(1, ...rows.map((row) => row.count));
  const wornLabel = `Worn in the last ${rangeLabel}`;

  const totalWorn = rows.reduce((sum, row) => sum + row.worn, 0);
  const totalCount = rows.reduce((sum, row) => sum + row.count, 0);
  const summary = `${totalWorn} of ${totalCount} pieces were worn in the last ${rangeLabel}. ${rows
    .map((row) => `${row.label}: ${row.worn} of ${row.count}`)
    .join('. ')}.`;

  const getContent = (index) => {
    const row = rows[index];
    if (!row) return null;
    return {
      title: `${row.label}, ${row.count} pieces`,
      rows: [
        { label: 'Worn', value: String(row.worn), color: colors.worn },
        { label: 'Not worn', value: String(row.notWorn), color: colors.notWorn },
      ],
    };
  };

  return (
    <ChartFigure
      className="chart-figure--horizontal chart-figure--stacked"
      summary={summary}
      busy={busy}
      legend={[
        { label: wornLabel, color: colors.worn },
        { label: 'Not worn', color: colors.notWorn },
      ]}
      table={{
        caption: 'Wardrobe by category',
        columns: ['Category', 'Worn', 'Not worn', 'Total'],
        rows: rows.map((row) => [row.label, row.worn, row.notWorn, row.count]),
      }}
    >
      <BarChart
        layout="horizontal"
        height={rows.length * ROW + 8}
        dataset={rows}
        skipAnimation={Boolean(reduceMotion)}
        borderRadius={4}
        hideLegend
        margin={{ top: 4, right: 0, bottom: 4, left: 0 }}
        yAxis={[
          {
            scaleType: 'band',
            dataKey: 'label',
            categoryGapRatio: 0.55,
            width: Y_AXIS_WIDTH,
            disableLine: true,
            disableTicks: true,
            valueFormatter: (label, context) => {
              if (context.location !== 'tooltip') return label;
              const row = byLabel.get(label);
              return row ? `${label}, ${row.count} pieces` : label;
            },
          },
          {
            // Same categories on the right, labelled with the totals (not a second scale).
            id: 'totals',
            scaleType: 'band',
            dataKey: 'label',
            position: 'right',
            categoryGapRatio: 0.55,
            width: 56,
            disableLine: true,
            disableTicks: true,
            hideTooltip: true,
            valueFormatter: (label) => {
              const row = byLabel.get(label);
              if (!row) return '';
              return row.count ? `${row.worn} of ${row.count}` : 'None';
            },
          },
        ]}
        xAxis={[{ min: 0, max, position: 'none' }]}
        series={[
          {
            id: 'worn',
            dataKey: 'worn',
            stack: 'total',
            label: 'Worn',
            color: colors.worn,
            valueFormatter: (value) => `${value ?? 0}`,
          },
          {
            id: 'not-worn',
            dataKey: 'notWorn',
            stack: 'total',
            label: 'Not worn',
            color: colors.notWorn,
            valueFormatter: (value) => `${value ?? 0}`,
          },
        ]}
        slots={{ tooltip: ChartTooltip }}
        slotProps={{ tooltip: { getContent } }}
      />
    </ChartFigure>
  );
}
