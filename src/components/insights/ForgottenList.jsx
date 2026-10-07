import EventOutlined from '@mui/icons-material/EventOutlined';
import ExpandLessOutlined from '@mui/icons-material/ExpandLessOutlined';
import ExpandMoreOutlined from '@mui/icons-material/ExpandMoreOutlined';
import Button from '@mui/material/Button';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { typeLabel } from '@/data/taxonomy';
import InsightItemList from './InsightItemList';
import './ForgottenList.scss';

const PREVIEW_COUNT = 5;

function lastWornText(days) {
  if (days === null || days === undefined) return 'Never worn';
  return `Not worn for ${days} days`;
}

/**
 * Pieces not worn in 30+ days (or never). Row opens the drawer; "Plan it" goes to the planner.
 * Shows five at first with a toggle for the rest.
 */
export default function ForgottenList({ forgotten, onOpen }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? forgotten : forgotten.slice(0, PREVIEW_COUNT);
  const hiddenCount = forgotten.length - PREVIEW_COUNT;

  const rows = visible.map(({ item, daysSinceWorn }) => ({
    key: item.id,
    item,
    title: item.name,
    detail: `${typeLabel(item.type)} · ${lastWornText(daysSinceWorn)}`,
    actions: (
      <Button
        size="small"
        variant="outlined"
        color="inherit"
        startIcon={<EventOutlined />}
        className="forgotten-list__plan"
        aria-label={`Plan it: ${item.name}`}
        onClick={() => navigate('/outfits?tab=planner')}
      >
        Plan it
      </Button>
    ),
  }));

  return (
    <div className="forgotten-list">
      <InsightItemList rows={rows} onOpen={onOpen} label="Pieces not worn in 30 days or more" />
      {hiddenCount > 0 ? (
        <Button
          className="forgotten-list__toggle"
          variant="text"
          color="inherit"
          size="small"
          endIcon={expanded ? <ExpandLessOutlined /> : <ExpandMoreOutlined />}
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? 'Show fewer' : `Show all ${forgotten.length}`}
        </Button>
      ) : null}
    </div>
  );
}
