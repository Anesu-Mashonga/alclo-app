import { BarChart } from '@mui/x-charts/BarChart';
import { useReducedMotion } from 'motion/react';
import { OCCASION_BY_ID } from '@/data/taxonomy';
import { formatCount, formatPercent } from '@/lib/format';
import ChartFigure from './ChartFigure';
import ChartTooltip from './ChartTooltip';
import { useChartColors } from './chartTheme';

const ROW = 40;
const Y_AXIS_WIDTH = 64;

/** Outfits logged per occasion, largest first. Values sit at the bar ends. */
export default function OccasionChart({ occasions, busy }) {
  const colors = useChartColors();
  const reduceMotion = useReducedMotion();

  const total = occasions.reduce((sum, row) => sum + row.count, 0);
  const rows = occasions
    .map((row) => ({
      id: row.occasion,
      label: OCCASION_BY_ID[row.occasion]?.label ?? row.occasion,
      count: row.count,
    }))
    .sort((a, b) => b.count - a.count);
  const byLabel = new Map(rows.map((row) => [row.label, row]));
  const max = Math.max(1, ...rows.map((row) => row.count));
  const top = rows[0];
  const summary =
    top && total
      ? `${formatCount(total, 'outfit')} logged. ${rows.map((row) => `${row.label}: ${row.count}`).join(', ')}.`
      : 'No outfits logged in this range.';

  const getContent = (index) => {
    const row = rows[index];
    if (!row) return null;
    return {
      title: row.label,
      rows: [
        {
          label: 'Outfits',
          value: `${row.count} (${formatPercent(total ? row.count / total : 0)})`,
          color: colors.worn,
        },
      ],
    };
  };

  return (
    <ChartFigure
      className="chart-figure--horizontal"
      summary={summary}
      busy={busy}
      table={{
        caption: 'Outfits logged by occasion',
        columns: ['Occasion', 'Outfits', 'Share'],
        rows: rows.map((row) => [row.label, row.count, formatPercent(total ? row.count / total : 0)]),
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
          },
          {
            // Same occasions on the right, labelled with their counts (not a second scale).
            id: 'counts',
            scaleType: 'band',
            dataKey: 'label',
            position: 'right',
            categoryGapRatio: 0.55,
            width: 40,
            disableLine: true,
            disableTicks: true,
            hideTooltip: true,
            valueFormatter: (label) => `${byLabel.get(label)?.count ?? ''}`,
          },
        ]}
        xAxis={[{ min: 0, max, position: 'none' }]}
        series={[
          {
            id: 'occasions',
            dataKey: 'count',
            label: 'Outfits',
            color: colors.worn,
            minBarSize: 2,
            valueFormatter: (value) =>
              `${formatCount(value ?? 0, 'outfit')}, ${formatPercent(total ? (value ?? 0) / total : 0)}`,
          },
        ]}
        slots={{ tooltip: ChartTooltip }}
        slotProps={{ tooltip: { getContent } }}
      />
    </ChartFigure>
  );
}
