import DownloadOutlined from '@mui/icons-material/DownloadOutlined';
import Inventory2Outlined from '@mui/icons-material/Inventory2Outlined';
import RestartAltOutlined from '@mui/icons-material/RestartAltOutlined';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import Skeleton from '@mui/material/Skeleton';
import { useState } from 'react';
import SectionCard from '@/components/common/SectionCard';
import { useConfirm } from '@/context/ConfirmContext';
import { useToast } from '@/context/ToastContext';
import { useExportData, useItems, useResetDemoData } from '@/hooks/api';
import useLoadSampleWardrobe from '@/hooks/useLoadSampleWardrobe';
import { todayISO } from '@/lib/dates';
import { formatCount } from '@/lib/format';
import { STORAGE_QUOTA, downloadJson, formatBytes, measureLocalStorage, setFlashMessage } from './browserData';
import SettingRow from './SettingRow';
import SettingsPanel from './SettingsPanel';
import './DataSection.scss';

function SampleWardrobeRow() {
  const items = useItems({});
  const sample = useLoadSampleWardrobe();
  const total = items.data?.total ?? items.data?.counts?.all ?? 0;
  const empty = items.isSuccess && total === 0;

  let description = 'Fill an empty wardrobe with about 45 example pieces to try Alclo.';
  if (items.isSuccess && !empty) {
    description = `Only for an empty wardrobe. You already have ${formatCount(total, 'piece')}.`;
  }
  if (items.isError) description = 'We could not check your wardrobe right now.';

  return (
    <SettingRow label="Sample wardrobe" description={items.isPending ? <Skeleton variant="text" width={260} /> : description}>
      {items.isError ? (
        <Button variant="outlined" color="inherit" onClick={() => items.refetch()}>
          Try again
        </Button>
      ) : (
        <Button
          variant="outlined"
          color="inherit"
          startIcon={<Inventory2Outlined />}
          disabled={!empty}
          loading={sample.isPending}
          loadingPosition="start"
          onClick={sample.load}
        >
          Load sample wardrobe
        </Button>
      )}
    </SettingRow>
  );
}

/** Settings > Data: export, sample wardrobe, storage use and the demo reset. */
export default function DataSection() {
  const toast = useToast();
  const confirm = useConfirm();
  const exportData = useExportData();
  const resetDemo = useResetDemoData();
  const [used] = useState(() => measureLocalStorage());
  const [resetting, setResetting] = useState(false);

  const handleExport = async () => {
    try {
      const data = await exportData.mutateAsync();
      const filename = `alclo-export-${todayISO()}.json`;
      downloadJson(data, filename);
      const pieces = (data?.items ?? []).filter((item) => !item.deletedAt).length;
      const outfits = (data?.outfits ?? []).filter((outfit) => !outfit.deletedAt).length;
      toast.success(`Downloaded ${filename} with ${formatCount(pieces, 'piece')} and ${formatCount(outfits, 'outfit')}`);
    } catch (error) {
      toast.error(error?.message || 'Could not export your data. Try again.');
    }
  };

  const handleReset = async () => {
    const ok = await confirm({
      title: 'Reset demo data?',
      description:
        'This replaces everything stored in this browser with fresh sample data, for every account. Pieces, outfits and history you added will be gone. You cannot undo this.',
      confirmLabel: 'Reset demo data',
      destructive: true,
    });
    if (!ok) return;
    setResetting(true);
    try {
      await resetDemo.mutateAsync();
      setFlashMessage('Demo data reset. Everything is back to the sample wardrobe.');
      window.location.reload();
    } catch (error) {
      setResetting(false);
      toast.error(error?.message || 'Could not reset the demo data. Try again.');
    }
  };

  const ratio = Math.min(1, used / STORAGE_QUOTA);

  return (
    <SettingsPanel title="Data" description="Everything Alclo knows about you lives in this browser. Take it with you or start over.">
      <SectionCard title="Your data" titleComponent="h3">
        <SettingRow
          label="Export my data"
          description="A JSON file with your profile, wardrobe, outfits, wear history and plans."
        >
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<DownloadOutlined />}
            loading={exportData.isPending}
            loadingPosition="start"
            onClick={handleExport}
          >
            Export my data
          </Button>
        </SettingRow>
        <SampleWardrobeRow />
        <SettingRow label="Storage in this browser" description="Clearing this site's data in your browser removes it.">
          <div className="data-section__storage">
            <span className="data-section__storage-text u-tabular">
              {formatBytes(used)} of about {formatBytes(STORAGE_QUOTA)}
            </span>
            <LinearProgress
              variant="determinate"
              value={Math.max(2, ratio * 100)}
              className="data-section__meter"
              aria-label="Browser storage used"
              aria-valuetext={`${Math.round(ratio * 100)}% used`}
            />
          </div>
        </SettingRow>
      </SectionCard>

      <SectionCard title="Start over" titleComponent="h3" className="data-section__danger">
        <SettingRow
          label="Reset demo data"
          description="Reload the sample accounts, wardrobe and 10 weeks of history. Anything you added is removed."
        >
          <Button
            variant="outlined"
            color="error"
            startIcon={<RestartAltOutlined />}
            loading={resetting}
            loadingPosition="start"
            onClick={handleReset}
          >
            Reset demo data
          </Button>
        </SettingRow>
      </SectionCard>
    </SettingsPanel>
  );
}
