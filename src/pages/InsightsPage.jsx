import AddOutlined from '@mui/icons-material/AddOutlined';
import BarChartOutlined from '@mui/icons-material/BarChartOutlined';
import InsightsOutlined from '@mui/icons-material/InsightsOutlined';
import TableRowsOutlined from '@mui/icons-material/TableRowsOutlined';
import TaskAltOutlined from '@mui/icons-material/TaskAltOutlined';
import TodayOutlined from '@mui/icons-material/TodayOutlined';
import Button from '@mui/material/Button';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import OccasionToggle from '@/components/common/OccasionToggle';
import SectionCard from '@/components/common/SectionCard';
import cx from '@/components/common/cx';
import CategoryChart from '@/components/insights/CategoryChart';
import ColorMix from '@/components/insights/ColorMix';
import ForgottenList from '@/components/insights/ForgottenList';
import GapSuggestions from '@/components/insights/GapSuggestions';
import InsightsKpis from '@/components/insights/InsightsKpis';
import InsightsSkeleton from '@/components/insights/InsightsSkeleton';
import MostWornList from '@/components/insights/MostWornList';
import OccasionChart from '@/components/insights/OccasionChart';
import WeeklyChart from '@/components/insights/WeeklyChart';
import PageHeader from '@/components/layout/PageHeader';
import { useUI } from '@/context/UIContext';
import { useInsights } from '@/hooks/api';
import useLoadSampleWardrobe from '@/hooks/useLoadSampleWardrobe';
import useItemDrawer from '@/hooks/useItemDrawer';
import { formatDate } from '@/lib/dates';
import { formatCount, formatNumber } from '@/lib/format';
import './InsightsPage.scss';

const RANGE_OPTIONS = [
  { id: '30', label: '30 days' },
  { id: '90', label: '90 days' },
];

function readRange(params) {
  return params.get('range') === '90' ? 90 : 30;
}

function EmptyWardrobe() {
  const ui = useUI();
  const sample = useLoadSampleWardrobe();

  return (
    <SectionCard>
      <EmptyState
        icon={InsightsOutlined}
        title="Add pieces to see insights"
        description="Insights show which clothes you reach for and which ones you forget. Add a few pieces and log what you wear."
        action={
          <Button variant="contained" startIcon={<AddOutlined />} onClick={() => ui.openItemForm({ mode: 'create' })}>
            Add item
          </Button>
        }
        secondaryAction={
          <Button variant="outlined" color="inherit" loading={sample.isPending} onClick={sample.load}>
            Load sample wardrobe
          </Button>
        }
      />
    </SectionCard>
  );
}

export default function InsightsPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const range = readRange(params);
  const rangeLabel = `${range} days`;
  const { data, isPending, isError, error, refetch, isPlaceholderData } = useInsights(range);
  const { openItem } = useItemDrawer();
  const [weeklyAsTable, setWeeklyAsTable] = useState(false);

  const setRange = (id) => {
    const next = new URLSearchParams(params);
    if (id === '90') next.set('range', '90');
    else next.delete('range');
    setParams(next, { replace: true, preventScrollReset: true });
  };

  const busy = Boolean(isPlaceholderData);
  const openPiece = (item) => openItem(item.id);

  const subtitle = data?.range
    ? `How you used your wardrobe from ${formatDate(data.range.from, 'D MMM')} to ${formatDate(data.range.to, 'D MMM')}.`
    : 'How you actually use your wardrobe.';

  let body;
  if (isPending) {
    body = <InsightsSkeleton rangeLabel={rangeLabel} />;
  } else if (isError && !data) {
    body = (
      <SectionCard>
        <ErrorState title="Could not load insights" error={error} onRetry={() => refetch()} />
      </SectionCard>
    );
  } else if (data.totals.items === 0) {
    body = <EmptyWardrobe />;
  } else {
    const { totals } = data;
    const hasLogs = totals.outfitsLogged > 0;
    const weeks = data.wearsByWeek.length;
    const perWeek = weeks ? totals.outfitsLogged / weeks : 0;

    const forgottenCard = (
      <SectionCard
        className="insights-page__area--forgotten"
        title="Not worn in 30+ days"
        subtitle={
          data.forgotten.length
            ? `${formatCount(data.forgotten.length, 'piece')} waiting for an outing`
            : 'Pieces you have not reached for in a month'
        }
      >
        {data.forgotten.length ? (
          <ForgottenList forgotten={data.forgotten} onOpen={openPiece} />
        ) : (
          <EmptyState
            compact
            titleComponent="h3"
            icon={TaskAltOutlined}
            title="Everything has had an outing"
            description="Every piece older than two weeks was worn in the last 30 days."
          />
        )}
      </SectionCard>
    );

    const gapsCard = (
      <SectionCard
        className="insights-page__area--gaps"
        title="Worth adding"
        subtitle="Ideas for gaps in your wardrobe. Prices are a rough guide."
      >
        <GapSuggestions gaps={data.gaps} />
      </SectionCard>
    );

    body = (
      <div className={cx('insights-page__content', busy && 'insights-page__content--busy')} aria-busy={busy || undefined}>
        <InsightsKpis totals={totals} rangeLabel={rangeLabel} busy={busy} />

        {hasLogs ? (
          <div className="insights-page__grid">
            <SectionCard
              className="insights-page__area--weekly"
              title="Outfits logged per week"
              subtitle={`${formatCount(totals.outfitsLogged, 'outfit')}, about ${formatNumber(perWeek, 1)} a week`}
              action={
                <Button
                  size="small"
                  variant="text"
                  color="inherit"
                  className="insights-page__view-toggle"
                  startIcon={weeklyAsTable ? <BarChartOutlined /> : <TableRowsOutlined />}
                  onClick={() => setWeeklyAsTable((value) => !value)}
                >
                  {weeklyAsTable ? 'Show chart' : 'Show table'}
                </Button>
              }
            >
              <WeeklyChart weeks={data.wearsByWeek} range={data.range} busy={busy} showTable={weeklyAsTable} />
            </SectionCard>

            <SectionCard
              className="insights-page__area--most-worn"
              title="Most worn"
              subtitle={`Wears in the last ${rangeLabel}`}
            >
              <MostWornList mostWorn={data.mostWorn} onOpen={openPiece} />
            </SectionCard>

            <SectionCard
              className="insights-page__area--category"
              title="Wardrobe by category"
              subtitle={`${formatCount(totals.wornDistinct, 'piece')} of ${totals.items} worn`}
            >
              <CategoryChart categories={data.byCategory} rangeLabel={rangeLabel} busy={busy} />
            </SectionCard>

            <SectionCard className="insights-page__area--occasions" title="Occasions" subtitle="What you dressed for">
              <OccasionChart occasions={data.occasionMix} busy={busy} />
            </SectionCard>

            {forgottenCard}

            <SectionCard
              className="insights-page__area--colors"
              title="Colour mix"
              subtitle="Main colour of each piece you wore, by wears"
            >
              <ColorMix colorMix={data.colorMix} busy={busy} />
            </SectionCard>

            {gapsCard}
          </div>
        ) : (
          <div className="insights-page__grid">
            <SectionCard className="insights-page__area--full">
              <EmptyState
                icon={InsightsOutlined}
                title={`No outfits logged in the last ${rangeLabel}`}
                description="Charts fill in as you log what you wear. Pick an outfit on Today and choose Wear this."
                action={
                  <Button variant="contained" startIcon={<TodayOutlined />} onClick={() => navigate('/')}>
                    Go to Today
                  </Button>
                }
                secondaryAction={
                  range === 30 ? (
                    <Button variant="outlined" color="inherit" onClick={() => setRange('90')}>
                      Show 90 days
                    </Button>
                  ) : null
                }
              />
            </SectionCard>
            {forgottenCard}
            {gapsCard}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="insights-page">
      <PageHeader
        title="Insights"
        subtitle={subtitle}
        actions={
          <OccasionToggle
            value={String(range)}
            onChange={setRange}
            options={RANGE_OPTIONS}
            label="Date range"
            className="insights-page__range"
          />
        }
      />
      {body}
    </div>
  );
}
