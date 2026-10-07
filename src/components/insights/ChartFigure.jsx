import cx from '@/components/common/cx';
import './ChartFigure.scss';

/**
 * Wraps a chart with the parts every Insights chart needs:
 * - an optional HTML legend (identity never relies on colour matching alone)
 * - the plot, hidden from assistive tech because the table says the same thing
 * - a one-sentence text summary and a data table. The table is visually hidden unless
 *   `showTable` is set, in which case it replaces the plot for everyone.
 *
 * Props:
 * - summary: one sentence describing what the chart shows (the figure's caption for screen readers)
 * - legend: [{ label, color }] rendered above the plot (omit for a single series)
 * - table: { caption, columns: string[], rows: (string|number)[][] }
 * - showTable: render the table visibly instead of the plot
 * - busy: dims the plot while a new range loads (keeps the frame, no skeleton flash)
 * - children: the chart
 */
export default function ChartFigure({ summary, legend, table, showTable = false, busy = false, className, children }) {
  return (
    <figure className={cx('chart-figure', busy && 'chart-figure--busy', className)}>
      {legend?.length && !showTable ? (
        <ul className="chart-figure__legend" aria-hidden="true">
          {legend.map((entry) => (
            <li key={entry.label} className="chart-figure__legend-item">
              <span className="chart-figure__key" style={{ '--chart-key': entry.color }} />
              {entry.label}
            </li>
          ))}
        </ul>
      ) : null}
      {showTable ? null : (
        <div className="chart-figure__plot" aria-hidden="true">
          {children}
        </div>
      )}
      <figcaption className="u-visually-hidden">{summary}</figcaption>
      {table ? (
        <div className={showTable ? 'chart-figure__table-wrap' : 'u-visually-hidden'}>
          <table className="chart-figure__table">
            <caption className="u-visually-hidden">{table.caption}</caption>
            <thead>
              <tr>
                {table.columns.map((column) => (
                  <th key={column} scope="col">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row) => (
                <tr key={row[0]}>
                  {row.map((cell, index) =>
                    index === 0 ? (
                      <th key={index} scope="row">
                        {cell}
                      </th>
                    ) : (
                      <td key={index}>{cell}</td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </figure>
  );
}
