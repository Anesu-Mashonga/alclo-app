import EventOutlined from '@mui/icons-material/EventOutlined';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { usePlans } from '@/hooks/api';
import { upcomingDays } from './outfitUtils';
import './PlanForMenu.scss';

/**
 * Menu of today and the next six days. Days that already have a plan say what they replace.
 *
 * Props: anchorEl, open, onClose, onPick({ date, label, previous })
 */
export default function PlanForMenu({ anchorEl, open, onClose, onPick }) {
  const days = upcomingDays(7);
  const { data: plans } = usePlans({ from: days[0].date, to: days[days.length - 1].date }, { enabled: open });
  const byDate = new Map((plans ?? []).map((plan) => [plan.date, plan]));

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      className="plan-for-menu"
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      slotProps={{ list: { 'aria-label': 'Plan for' } }}
    >
      <ListSubheader className="plan-for-menu__heading" disableSticky>
        Plan for
      </ListSubheader>
      {days.map((day) => {
        const existing = byDate.get(day.date);
        const replaces = existing ? (existing.outfit?.name ?? 'a planned outfit') : null;
        return (
          <MenuItem
            key={day.date}
            className="plan-for-menu__item"
            onClick={() => onPick({ ...day, previous: existing ?? null })}
          >
            <ListItemIcon>
              <EventOutlined />
            </ListItemIcon>
            <ListItemText
              primary={day.label}
              secondary={replaces ? `${day.detail}, replaces ${replaces}` : day.detail}
              slotProps={{ secondary: { className: 'plan-for-menu__detail' } }}
            />
          </MenuItem>
        );
      })}
    </Menu>
  );
}
