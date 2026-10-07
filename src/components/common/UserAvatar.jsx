import Avatar from '@mui/material/Avatar';
import { getAvatarSrc } from '@/data/avatars';
import cx from './cx';
import './UserAvatar.scss';

function initialsOf(name) {
  const parts = String(name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0] ?? '';
  const last = parts.length > 1 ? parts.at(-1)[0] : '';
  return `${first}${last}`.toUpperCase();
}

/**
 * The user's avatar: uploaded photo, preset render, or initials on the soft accent.
 *
 * Props: user ({ name, avatar }), size in px (default 32), className, plus Avatar props.
 * Decorative by default (alt=""), because the name is always shown or announced nearby.
 */
export default function UserAvatar({ user, size = 32, className, alt = '', ...rest }) {
  const src = getAvatarSrc(user?.avatar);

  return (
    <Avatar
      src={src ?? undefined}
      alt={alt}
      className={cx('user-avatar', src && 'user-avatar--image', className)}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
      {...rest}
    >
      {initialsOf(user?.name)}
    </Avatar>
  );
}
