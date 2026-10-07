import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ErrorState from '@/components/common/ErrorState';
import SectionCard from '@/components/common/SectionCard';
import { useToast } from '@/context/ToastContext';
import { useDevSettings, useUpdateDevSettings } from '@/hooks/api';
import SaveStatus from './SaveStatus';
import SettingRow from './SettingRow';
import SettingsPanel from './SettingsPanel';
import useAutosaveStatus from './useAutosaveStatus';
import './DeveloperSection.scss';

const LATENCIES = [
  { value: 'instant', label: 'Instant', hint: 'Requests answer right away.' },
  { value: 'fast', label: 'Fast', hint: 'Each request waits 120 to 250 ms.' },
  { value: 'normal', label: 'Normal', hint: 'Each request waits 300 to 750 ms, like a typical connection.' },
  { value: 'slow', label: 'Slow', hint: 'Each request waits 1.2 to 2.2 seconds. Skeletons stay on screen long enough to inspect.' },
];

const FAILURE_RATES = [
  { value: 0, label: 'Off', hint: 'Requests never fail on purpose.' },
  { value: 0.1, label: '10%', hint: 'About 1 in 10 requests fails with a connection error.' },
  { value: 0.25, label: '25%', hint: 'About 1 in 4 requests fails with a connection error.' },
];

const DEFAULTS = { latency: 'normal', failureRate: 0 };

function DeveloperSkeleton() {
  return (
    <div className="developer-section__skeleton" aria-busy="true" aria-label="Loading developer settings">
      {[0, 1].map((row) => (
        <div key={row} className="developer-section__skeleton-row">
          <div className="developer-section__skeleton-text">
            <Skeleton variant="text" width={140} height={22} />
            <Skeleton variant="text" width="80%" />
          </div>
          <Skeleton variant="rounded" width={280} height={40} className="developer-section__skeleton-control" />
        </div>
      ))}
    </div>
  );
}

/**
 * Settings > Developer: simulated latency and failure rate for the mock backend.
 * They exist so loading skeletons and error states can be previewed on purpose.
 */
export default function DeveloperSection() {
  const settings = useDevSettings();
  const update = useUpdateDevSettings();
  const autosave = useAutosaveStatus();
  const toast = useToast();

  const save = (patch) =>
    autosave.track(update.mutateAsync(patch)).catch((error) => toast.error(error?.message || 'Could not save that setting.'));

  const data = settings.data;
  const latency = LATENCIES.find((option) => option.value === data?.latency);
  const failure = FAILURE_RATES.find((option) => option.value === data?.failureRate);
  const isDefault = data && data.latency === DEFAULTS.latency && data.failureRate === DEFAULTS.failureRate;
  const failurePercent = Math.round((data?.failureRate ?? 0) * 100);

  return (
    <SettingsPanel
      title="Developer"
      description="Slow down or break the mock backend on purpose to preview loading skeletons and error states. These settings only affect this browser."
      aside={
        data ? (
          <>
            <SaveStatus status={autosave.status} idleLabel={isDefault ? 'Using defaults' : 'Changes save automatically'} />
            {!isDefault ? (
              <Button size="small" variant="text" color="inherit" onClick={() => save(DEFAULTS)}>
                Restore defaults
              </Button>
            ) : null}
          </>
        ) : null
      }
    >
      <SectionCard title="Mock backend" titleComponent="h3">
        {settings.isPending ? <DeveloperSkeleton /> : null}
        {settings.isError ? (
          <ErrorState compact error={settings.error} onRetry={() => settings.refetch()} />
        ) : null}
        {data ? (
          <>
            <SettingRow label="Simulated latency" description={latency?.hint ?? 'A custom delay is set.'} stack>
              {({ labelId, descriptionId }) => (
                <ToggleButtonGroup
                  exclusive
                  value={data.latency}
                  onChange={(_event, next) => next && next !== data.latency && save({ latency: next })}
                  aria-labelledby={labelId}
                  aria-describedby={descriptionId}
                  className="developer-section__toggle"
                >
                  {LATENCIES.map((option) => (
                    <ToggleButton key={option.value} value={option.value}>
                      {option.label}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              )}
            </SettingRow>
            <SettingRow
              label="Failure rate"
              description={failure?.hint ?? `About ${failurePercent}% of requests fail. This was set outside this page.`}
              stack
            >
              {({ labelId, descriptionId }) => (
                <ToggleButtonGroup
                  exclusive
                  value={failure ? data.failureRate : null}
                  onChange={(_event, next) => next !== null && next !== data.failureRate && save({ failureRate: next })}
                  aria-labelledby={labelId}
                  aria-describedby={descriptionId}
                  className="developer-section__toggle developer-section__toggle--narrow"
                >
                  {FAILURE_RATES.map((option) => (
                    <ToggleButton key={option.value} value={option.value}>
                      {option.label}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              )}
            </SettingRow>
          </>
        ) : null}
      </SectionCard>

      {data && data.failureRate > 0 ? (
        <Alert
          severity="warning"
          action={
            <Button size="small" color="inherit" onClick={() => save({ failureRate: 0 })}>
              Turn off
            </Button>
          }
        >
          {failurePercent}% of requests fail on purpose. Lists show their error state with a Try again button. Turn this off when you are done.
        </Alert>
      ) : null}

      <p className="developer-section__tip">
        Try Slow, then open Wardrobe or Today: each page shows a skeleton shaped like its content until the data arrives.
      </p>
    </SettingsPanel>
  );
}
