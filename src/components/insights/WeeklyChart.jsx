import { BarChart } from '@mui/x-charts/BarChart';
import { useReducedMotion } from 'motion/react';
import { useMemo } from 'react';
import { addDays, formatDate } from '@/lib/dates';
import { formatCount } from '@/lib/format';
import ChartFigure from './ChartFigure';
import ChartTooltip from './ChartTooltip';
import { useChartColors } from './chartTheme';
import useElementWidth from './useElementWidth';

const HEIGHT = 300;
const Y_AXIS_WIDTH = 28;
const MAX_BAR = 24;
const MIN_LABEL_SPACE = 48;

/** "28 Sep to 4 Oct", clipped to the selected range. */
function weekSpan(weekStart, range) {
  const start = weekStart < range.from ? range.from : weekStart;
  const end = addDays(weekStart, 6) > range.to ? range.to : addDays(weekStart, 6);
  return `${formatDate(start, 'D MMM')} to ${formatDate(end, 'D MMM')}`;
}

/**
 * Outfits logged per week (Monday start) across the selected range. One series, so no legend:
 * the card title names it. Hover or the table view gives exact numbers.
 */
export default function WeeklyChart({ weeks, range, busy, showTable }) {
  const colors = useChartColors();
  const reduceMotion = useReducedMotion();
  const [measureRef, width] = useElementWidth();

  const rows = useMemo(
    () =>
      weeks.map((week) => {
        const span = weekSpan(week.weekStart, range);
        const current = addDays(week.weekStart, 6) >= range.to;
        return {
          key: week.weekStart,
          tick: formatDate(week.weekStart, 'D MMM'),
          tooltip: current ? `${span} (this week so far)` : span,
          span,
          count: week.count,
        };
      }),
    [weeks, range],
  );
  const byKey = useMemo(() => new Map(rows.map((row) => [row.key, row])), [rows]);
  // A clean top tick at or above the busiest week: steps of 2, 5 or 10.
  const peak = Math.max(4, ...rows.map((row) => row.count));
  const step = peak <= 8 ? 2 : peak <= 20 ? 5 : 10;
  const max = Math.ceil(peak / step) * step;
  const ticks = Array.from({ length: max / step + 1 }, (_, index) => index * step);

  // Cap bar thickness at 24px and let the rest of each band be air.
  const plotWidth = Math.max(0, width - Y_AXIS_WIDTH - 16);
  const band = rows.length ? plotWidth / rows.length : 0;
  const gapRatio = band > 0 ? Math.min(0.85, Math.max(0.3, 1 - MAX_BAR / band)) : 0.5;
  // Label every nth week at a steady rhythm, counted back from the latest week so it is always labelled.
  const labelEvery = band > 0 ? Math.max(1, Math.ceil(MIN_LABEL_SPACE / band)) : 1;
  const lastIndex = rows.length - 1;

  const getContent = (index) => {
    const row = rows[index];
    if (!row) return null;
    return {
      title: row.tooltip,
      rows: [{ label: 'Outfits logged', value: formatCount(row.count, 'outfit'), color: colors.worn }],
    };
  };

  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const busiest = rows.reduce((best, row) => (row.count > (best?.count ?? -1) ? row : best), null);
  const summary = busiest
    ? `${formatCount(total, 'outfit')} logged over ${formatCount(rows.length, 'week')}. The busiest week was ${busiest.span} with ${busiest.count}.`
    : 'No outfits logged in this range.';

  return (
    <ChartFigure
      summary={summary}
      busy={busy}
      showTable={showTable}
      table={{
        caption: 'Outfits logged per week',
        columns: ['Week', 'Outfits logged'],
        rows: rows.map((row) => [row.span, row.count]),
      }}
    >
      <div ref={measureRef} className="weekly-chart">
        {width > 0 ? (
          <BarChart
            height={HEIGHT}
            dataset={rows}
            skipAnimation={Boolean(reduceMotion)}
            borderRadius={4}
            hideLegend
            grid={{ horizontal: true }}
            margin={{ top: 8, right: 16, bottom: 0, left: 0 }}
            xAxis={[
              {
                scaleType: 'band',
                dataKey: 'key',
                categoryGapRatio: gapRatio,
                disableTicks: true,
                height: 28,
                tickLabelInterval: (_value, index) => (lastIndex - index) % labelEvery === 0,
                valueFormatter: (key, context) =>
                  context.location === 'tooltip' ? (byKey.get(key)?.tooltip ?? key) : (byKey.get(key)?.tick ?? key),
              },
            ]}
            yAxis={[
              {
                min: 0,
                max,
                tickInterval: ticks,
                width: Y_AXIS_WIDTH,
                disableLine: true,
                disableTicks: true,
              },
            ]}
            series={[
              {
                id: 'outfits',
                dataKey: 'count',
                label: 'Outfits logged',
                color: colors.worn,
                valueFormatter: (value) => formatCount(value ?? 0, 'outfit'),
              },
            ]}
            slots={{ tooltip: ChartTooltip }}
            slotProps={{ tooltip: { getContent } }}
          />
        ) : (
          <div style={{ height: HEIGHT }} />
        )}
      </div>
    </ChartFigure>
  );
}
