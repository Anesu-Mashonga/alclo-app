import InfoOutlined from '@mui/icons-material/InfoOutlined';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Popover from '@mui/material/Popover';
import Tooltip from '@mui/material/Tooltip';
import { useId, useState } from 'react';
import { Link as RouterLink } from 'react-router';
import './HamperInfo.scss';

/** Info button with a short explainer: how pieces get into the hamper and what "urgent" means. */
export default function HamperInfo({ urgentAfterDays = 3 }) {
  const [anchor, setAnchor] = useState(null);
  const titleId = useId();
  const open = Boolean(anchor);
  const days = `${urgentAfterDays} ${urgentAfterDays === 1 ? 'day' : 'days'}`;

  return (
    <>
      <Tooltip title="How the hamper works">
        <IconButton
          aria-label="How the hamper works"
          aria-haspopup="dialog"
          aria-expanded={open ? 'true' : undefined}
          onClick={(event) => setAnchor(event.currentTarget)}
          className="hamper-info__button"
        >
          <InfoOutlined />
        </IconButton>
      </Tooltip>
      <Popover
        open={open}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            className: 'hamper-info',
            role: 'dialog',
            'aria-labelledby': titleId,
          },
        }}
      >
        <h2 id={titleId} className="hamper-info__title">
          How the hamper works
        </h2>
        <ul className="hamper-info__list">
          <li>
            Every piece has a wash limit, such as 2 wears for a shirt or 6 for jeans. When you log the wear that reaches
            it, the piece moves to the hamper.
          </li>
          <li>{`Pieces that wait ${days} or more are marked urgent.`}</li>
          <li>Shoes and accessories are not tracked here.</li>
        </ul>
        <p className="hamper-info__footer">
          Change a limit in the piece&apos;s details, under Wash after. The urgent limit lives in{' '}
          <Link component={RouterLink} to="/settings?section=preferences" onClick={() => setAnchor(null)}>
            Preferences
          </Link>
          .
        </p>
      </Popover>
    </>
  );
}
