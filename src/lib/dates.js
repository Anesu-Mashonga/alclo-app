import dayjs from 'dayjs';
import updateLocale from 'dayjs/plugin/updateLocale';
import isoWeek from 'dayjs/plugin/isoWeek';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isBetween from 'dayjs/plugin/isBetween';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(updateLocale);
dayjs.extend(isoWeek);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(isBetween);
dayjs.extend(customParseFormat);

// Weeks start on Monday everywhere in Alclo (planner, insights, charts).
dayjs.updateLocale('en', { weekStart: 1 });
dayjs.locale('en');

export { dayjs };

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * True for strings shaped like 'YYYY-MM-DD' that are real calendar dates.
 * @param {unknown} value
 */
export function isISODate(value) {
  return typeof value === 'string' && ISO_DATE_RE.test(value) && dayjs(value, 'YYYY-MM-DD', true).isValid();
}

/**
 * Local calendar date as 'YYYY-MM-DD'.
 * @param {Date|string|number|import('dayjs').Dayjs} [date]
 * @returns {string}
 */
export function toISODate(date = new Date()) {
  return dayjs(date).format('YYYY-MM-DD');
}

/** Today's local date as 'YYYY-MM-DD'. */
export function todayISO(now = new Date()) {
  return toISODate(now);
}

/** Current timestamp as an ISO string. */
export function nowISO(now = new Date()) {
  return dayjs(now).toISOString();
}

/**
 * Adds (or subtracts) whole days and returns 'YYYY-MM-DD'.
 * @param {Date|string} date
 * @param {number} days
 */
export function addDays(date, days) {
  return dayjs(date).add(days, 'day').format('YYYY-MM-DD');
}

/**
 * Whole calendar days from `from` to `to` (positive when `to` is later).
 * Time of day is ignored, so 23:00 yesterday to 01:00 today is 1 day.
 * @param {Date|string} from
 * @param {Date|string} [to]
 * @returns {number}
 */
export function daysBetween(from, to = new Date()) {
  return dayjs(to).startOf('day').diff(dayjs(from).startOf('day'), 'day');
}

/**
 * Days since a date, or null when there is no date (never worn, for example).
 * @param {Date|string|null|undefined} date
 * @param {Date|string} [now]
 * @returns {number|null}
 */
export function daysSince(date, now = new Date()) {
  if (!date) return null;
  return Math.max(0, daysBetween(date, now));
}

/**
 * Friendly relative day label: "Today", "Yesterday", "3 days ago", "2 weeks ago",
 * "Tomorrow", "In 4 days". Returns "Never" for a missing date.
 * @param {Date|string|null|undefined} date
 * @param {Date|string} [now]
 * @returns {string}
 */
export function relativeDayLabel(date, now = new Date()) {
  if (!date) return 'Never';
  const diff = daysBetween(date, now);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff === -1) return 'Tomorrow';
  if (diff < 0) {
    const ahead = -diff;
    if (ahead < 14) return `In ${ahead} days`;
    return `In ${Math.round(ahead / 7)} weeks`;
  }
  if (diff < 14) return `${diff} days ago`;
  if (diff < 60) return `${Math.floor(diff / 7)} weeks ago`;
  if (diff < 365) return `${Math.floor(diff / 30)} months ago`;
  const years = Math.floor(diff / 365);
  return years === 1 ? 'A year ago' : `${years} years ago`;
}

/**
 * Monday of the week containing `date`, as 'YYYY-MM-DD'.
 * @param {Date|string} [date]
 */
export function startOfWeek(date = new Date()) {
  return dayjs(date).startOf('week').format('YYYY-MM-DD');
}

/**
 * Sunday of the week containing `date`, as 'YYYY-MM-DD'.
 * @param {Date|string} [date]
 */
export function endOfWeek(date = new Date()) {
  return dayjs(date).endOf('week').format('YYYY-MM-DD');
}

/**
 * The seven dates (Monday first) of the week containing `date`.
 * @param {Date|string} [date]
 * @returns {string[]}
 */
export function weekDates(date = new Date()) {
  const monday = dayjs(date).startOf('week');
  return Array.from({ length: 7 }, (_, i) => monday.add(i, 'day').format('YYYY-MM-DD'));
}

/**
 * Inclusive list of ISO dates between two dates.
 * @param {Date|string} from
 * @param {Date|string} to
 * @returns {string[]}
 */
export function dateRange(from, to) {
  const out = [];
  let cursor = dayjs(from).startOf('day');
  const end = dayjs(to).startOf('day');
  while (cursor.isSameOrBefore(end, 'day')) {
    out.push(cursor.format('YYYY-MM-DD'));
    cursor = cursor.add(1, 'day');
  }
  return out;
}

/**
 * Formats a date with a dayjs pattern. Defaults to "5 Oct 2026".
 * @param {Date|string} date
 * @param {string} [pattern]
 */
export function formatDate(date, pattern = 'D MMM YYYY') {
  if (!date) return '';
  return dayjs(date).format(pattern);
}

/** "Mon 5 Oct" style label used in planners and logs. */
export function formatDayLabel(date) {
  return formatDate(date, 'ddd D MMM');
}

/** "14:30" style time label. */
export function formatTime(date) {
  return formatDate(date, 'HH:mm');
}

/** True when the date falls on Saturday or Sunday. */
export function isWeekend(date) {
  const day = dayjs(date).day();
  return day === 0 || day === 6;
}
