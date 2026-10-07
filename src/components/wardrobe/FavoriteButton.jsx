import Favorite from '@mui/icons-material/Favorite';
import FavoriteBorderOutlined from '@mui/icons-material/FavoriteBorderOutlined';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { motion } from 'motion/react';
import { useState } from 'react';
import cx from '@/components/common/cx';
import './FavoriteButton.scss';

/**
 * Favourite toggle with a small pop when it turns on.
 * variant 'photo' sits on a light photo well (fixed light colours); 'plain' follows the theme.
 *
 * @param {{ item: { name: string, favorite?: boolean }, onToggle: () => void, variant?: 'photo' | 'plain',
 *   size?: 'small' | 'medium', className?: string }} props
 */
export default function FavoriteButton({ item, onToggle, variant = 'plain', size = 'medium', className }) {
  const [pops, setPops] = useState(0);
  const on = Boolean(item?.favorite);
  const label = on ? `Remove ${item.name} from favourites` : `Add ${item.name} to favourites`;

  const handleClick = (event) => {
    event.stopPropagation();
    if (!on) setPops((count) => count + 1);
    onToggle?.();
  };

  return (
    <Tooltip title={on ? 'Remove from favourites' : 'Add to favourites'}>
      <IconButton
        className={cx('favorite-button', `favorite-button--${variant}`, on && 'favorite-button--on', className)}
        size={size}
        aria-label={label}
        aria-pressed={on}
        onClick={handleClick}
      >
        <motion.span
          key={pops}
          className="favorite-button__icon"
          initial={false}
          animate={pops > 0 && on ? { scale: [1, 1.32, 1] } : { scale: 1 }}
          transition={{ duration: 0.28, ease: [0.2, 0, 0, 1] }}
        >
          {on ? <Favorite fontSize="inherit" /> : <FavoriteBorderOutlined fontSize="inherit" />}
        </motion.span>
      </IconButton>
    </Tooltip>
  );
}
