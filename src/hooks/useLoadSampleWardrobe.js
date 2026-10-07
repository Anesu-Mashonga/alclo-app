import { useLocation, useNavigate } from 'react-router';
import { useToast } from '@/context/ToastContext';
import { useImportSampleWardrobe } from '@/hooks/api';
import { formatCount } from '@/lib/format';

/**
 * One "Load sample wardrobe" behaviour for every empty state: same mutation, same toast wording,
 * and a View action that opens the wardrobe (left out when already on it).
 * @returns {{ load: () => void, isPending: boolean }}
 */
export default function useLoadSampleWardrobe() {
  const importSample = useImportSampleWardrobe();
  const toast = useToast();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const load = () =>
    importSample.mutate(undefined, {
      onSuccess: (result) => {
        const count = result?.imported ?? result?.items?.length ?? 0;
        toast.success(
          `Added ${formatCount(count, 'sample piece')} to your wardrobe`,
          pathname === '/wardrobe' ? undefined : { action: { label: 'View', onClick: () => navigate('/wardrobe') } },
        );
      },
      onError: (error) => toast.error(error?.message || 'Could not load the sample wardrobe. Try again.'),
    });

  return { load, isPending: importSample.isPending };
}
