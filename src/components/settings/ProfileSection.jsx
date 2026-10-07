import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { useRef, useState } from 'react';
import UserAvatar from '@/components/common/UserAvatar';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useUpdateProfile } from '@/hooks/api';
import { formatDate } from '@/lib/dates';
import AvatarPicker from './AvatarPicker';
import SettingsPanel from './SettingsPanel';
import useUnsavedChangesGuard from './useUnsavedChangesGuard';
import './ProfileSection.scss';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate({ name, email }) {
  const errors = {};
  const trimmedName = name.trim();
  if (!trimmedName) errors.name = 'Enter your name.';
  else if (trimmedName.length > 60) errors.name = 'Keep your name under 60 characters.';
  const trimmedEmail = email.trim();
  if (!trimmedEmail) errors.email = 'Enter your email address.';
  else if (!EMAIL_RE.test(trimmedEmail)) errors.email = 'Enter a valid email address, like name@example.com.';
  return errors;
}

const sameAvatar = (a, b) => a?.type === b?.type && (a?.type === 'initials' || a?.value === b?.value);

function ProfileForm({ user }) {
  const toast = useToast();
  const updateProfile = useUpdateProfile();
  const [name, setName] = useState(user.name ?? '');
  const [email, setEmail] = useState(user.email ?? '');
  const [avatar, setAvatar] = useState(user.avatar ?? { type: 'initials', value: '' });
  const [uploadSrc, setUploadSrc] = useState(user.avatar?.type === 'upload' ? user.avatar.value : null);
  const [touched, setTouched] = useState({});
  const [serverErrors, setServerErrors] = useState({});
  const nameRef = useRef(null);
  const emailRef = useRef(null);

  const changes = {};
  if (name.trim() !== user.name) changes.name = name.trim();
  if (email.trim().toLowerCase() !== user.email) changes.email = email.trim();
  if (!sameAvatar(avatar, user.avatar)) changes.avatar = avatar;
  const dirty = Object.keys(changes).length > 0;

  useUnsavedChangesGuard(dirty && !updateProfile.isPending);

  const clientErrors = validate({ name, email });
  const errorFor = (field) => serverErrors[field] ?? (touched[field] ? clientErrors[field] : undefined);

  const discard = () => {
    setName(user.name ?? '');
    setEmail(user.email ?? '');
    setAvatar(user.avatar);
    setTouched({});
    setServerErrors({});
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!dirty || updateProfile.isPending) return;
    if (Object.keys(clientErrors).length > 0) {
      setTouched({ name: true, email: true });
      (clientErrors.name ? nameRef : emailRef).current?.focus();
      return;
    }
    try {
      await updateProfile.mutateAsync(changes);
      toast.success('Profile saved');
    } catch (error) {
      if (error?.fieldErrors && Object.keys(error.fieldErrors).length > 0) {
        setServerErrors(error.fieldErrors);
        if (error.fieldErrors.name) nameRef.current?.focus();
        else if (error.fieldErrors.email) emailRef.current?.focus();
        if (error.fieldErrors.avatar) toast.error(error.fieldErrors.avatar);
      } else {
        toast.error(error?.message || 'Could not save your profile. Try again.');
      }
    }
  };

  const preview = { name: name.trim() || user.name, avatar };
  const since = user.createdAt ? formatDate(user.createdAt, 'MMMM YYYY') : null;

  return (
    <form className="profile-form" onSubmit={handleSubmit} noValidate>
      <div className="profile-form__identity">
        <UserAvatar user={preview} size={72} className="profile-form__avatar" />
        <div className="profile-form__identity-text">
          <p className="profile-form__name">{preview.name}</p>
          <p className="profile-form__meta">
            {user.email}
            {since ? <span className="profile-form__since">Member since {since}</span> : null}
          </p>
        </div>
      </div>

      <div className="profile-form__block">
        <div className="profile-form__block-label">
          Avatar
        </div>
        <AvatarPicker
          name={name.trim() || user.name}
          value={avatar}
          uploadSrc={uploadSrc}
          onChange={setAvatar}
          onUpload={(dataUrl) => {
            setUploadSrc(dataUrl);
            setAvatar({ type: 'upload', value: dataUrl });
          }}
        />
      </div>

      <div className="profile-form__fields">
        <TextField
          inputRef={nameRef}
          label="Full name"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setServerErrors(({ name: _drop, ...rest }) => rest);
          }}
          onBlur={() => setTouched((current) => ({ ...current, name: true }))}
          error={Boolean(errorFor('name'))}
          helperText={errorFor('name')}
          autoComplete="name"
          required
          fullWidth
          slotProps={{ htmlInput: { maxLength: 80 } }}
        />
        <TextField
          inputRef={emailRef}
          label="Email"
          type="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setServerErrors(({ email: _drop, ...rest }) => rest);
          }}
          onBlur={() => setTouched((current) => ({ ...current, email: true }))}
          error={Boolean(errorFor('email'))}
          helperText={errorFor('email') ?? 'You use this to sign in.'}
          autoComplete="email"
          required
          fullWidth
        />
      </div>

      <div className="profile-form__footer">
        <p className="profile-form__dirty" aria-live="polite">
          {dirty ? 'You have unsaved changes.' : ''}
        </p>
        {dirty ? (
          <Button variant="text" color="inherit" onClick={discard} disabled={updateProfile.isPending}>
            Discard
          </Button>
        ) : null}
        <Button type="submit" variant="contained" disabled={!dirty} loading={updateProfile.isPending}>
          Save changes
        </Button>
      </div>
    </form>
  );
}

/** Settings > Profile: avatar, name and email with an explicit save. */
export default function ProfileSection() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <SettingsPanel title="Profile" description="How you appear in Alclo. Your email is also how you sign in.">
      <div className="profile-section__card">
        <ProfileForm key={`${user.id}:${user.updatedAt ?? ''}`} user={user} />
      </div>
    </SettingsPanel>
  );
}
