/**
 * Preset avatar renders users can pick instead of initials or an upload.
 * User.avatar = { type: 'preset', value: '<preset id>' } refers to these.
 */
import avatarCasual from '@/assets/avatars/avatar-casual.webp';
import avatarPuffer from '@/assets/avatars/avatar-puffer.png';

export const AVATAR_PRESETS = [
  { id: 'casual', label: 'Pink overshirt and jeans', src: avatarCasual },
  { id: 'puffer', label: 'Paint splash puffer', src: avatarPuffer },
];

/**
 * Image URL for a user's avatar, or null when it should render as initials.
 * @param {{ type: 'initials'|'preset'|'upload', value: string }|null|undefined} avatar
 * @returns {string|null}
 */
export function getAvatarSrc(avatar) {
  if (!avatar) return null;
  if (avatar.type === 'upload') return avatar.value || null;
  if (avatar.type === 'preset') return AVATAR_PRESETS.find((preset) => preset.id === avatar.value)?.src ?? null;
  return null;
}
