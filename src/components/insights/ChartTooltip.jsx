import { ChartsTooltipContainer, useItemTooltip } from '@mui/x-charts/ChartsTooltip';
import { TOOLTIP_CLASSES } from './chartTheme';

/*
 * Tooltip slot shared by the Insights charts.
 *
 * The mark under the pointer is the hit target (trigger "item"), and the content comes from
 * `getContent(dataIndex)` so each chart can list every series for that category, with the
 * value as the strong element and the series name secondary.
 *
 * Item mode also sidesteps a development warning in x-charts 9.14: the axis tooltip queries
 * the polar axis selectors, which return a fresh empty array on every call in cartesian charts.
 */
function TooltipBody({ getContent }) {
  const tooltip = useItemTooltip();
  if (!tooltip || typeof getContent !== 'function') return null;
  const content = getContent(tooltip.identifier.dataIndex);
  if (!content) return null;

  return (
    <div className="MuiChartsTooltip-paper chart-tooltip">
      {content.title ? <p className="chart-tooltip__title">{content.title}</p> : null}
      <ul className="chart-tooltip__rows">
        {content.rows.map((row) => (
          <li key={row.label} className="chart-tooltip__row">
            <span className="chart-tooltip__key" style={{ '--chart-key': row.color }} aria-hidden="true" />
            <span className="chart-tooltip__label">{row.label}</span>
            <span className="chart-tooltip__value">{row.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Pass as `slots={{ tooltip: ChartTooltip }}` with `slotProps={{ tooltip: { getContent } }}`.
 * getContent(dataIndex) returns { title, rows: [{ label, value, color }] } or null.
 */
export default function ChartTooltip({ getContent, trigger: _trigger, classes: _classes, ...rest }) {
  return (
    <ChartsTooltipContainer {...rest} trigger="item" classes={TOOLTIP_CLASSES}>
      <TooltipBody getContent={getContent} />
    </ChartsTooltipContainer>
  );
}
