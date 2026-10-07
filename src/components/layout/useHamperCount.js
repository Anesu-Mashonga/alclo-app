import { useLaundrySummary } from '@/hooks/api';

/**
 * Number of items waiting in the hamper, for the Laundry nav badge.
 * Returns 0 while loading or on error so the badge simply stays hidden.
 */
export default function useHamperCount() {
  const { data } = useLaundrySummary();
  const count = Number(data?.counts?.hamper ?? 0);
  return Number.isFinite(count) && count > 0 ? count : 0;
}
