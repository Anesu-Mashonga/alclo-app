import DeleteOutlineOutlined from '@mui/icons-material/DeleteOutlineOutlined';
import LogoutOutlined from '@mui/icons-material/LogoutOutlined';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import { useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import SectionCard from '@/components/common/SectionCard';
import { useAuth } from '@/context/AuthContext';
import { useConfirm } from '@/context/ConfirmContext';
import { useToast } from '@/context/ToastContext';
import { useChangePassword, useDeleteAccount } from '@/hooks/api';
import PasswordInput from './PasswordInput';
import PasswordStrength from './PasswordStrength';
import { meetsPasswordRule } from './passwordRules';
import SettingRow from './SettingRow';
import SettingsPanel from './SettingsPanel';
import './AccountSection.scss';

function ChangePasswordForm({ email }) {
  const toast = useToast();
  const changePassword = useChangePassword();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState({});
  const currentRef = useRef(null);
  const nextRef = useRef(null);
  const strengthId = useId();

  const clientErrors = {};
  if (!current) clientErrors.currentPassword = 'Enter your current password.';
  if (!meetsPasswordRule(next)) clientErrors.newPassword = 'Use at least 8 characters with a letter and a number.';
  else if (next === current) clientErrors.newPassword = 'Choose a password that is different from the current one.';

  const errorFor = (field) => serverErrors[field] ?? (submitted ? clientErrors[field] : undefined);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitted(true);
    if (Object.keys(clientErrors).length > 0) {
      (clientErrors.currentPassword ? currentRef : nextRef).current?.focus();
      return;
    }
    try {
      await changePassword.mutateAsync({ currentPassword: current, newPassword: next });
      setCurrent('');
      setNext('');
      setSubmitted(false);
      setServerErrors({});
      toast.success('Password changed. Use it next time you sign in.');
    } catch (error) {
      if (error?.fieldErrors && Object.keys(error.fieldErrors).length > 0) {
        setServerErrors(error.fieldErrors);
        (error.fieldErrors.currentPassword ? currentRef : nextRef).current?.focus();
      } else {
        toast.error(error?.message || 'Could not change your password. Try again.');
      }
    }
  };

  return (
    <form className="account-section__password" onSubmit={handleSubmit} noValidate>
      {/* Lets password managers file the new password under the right account. */}
      <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />
      <div className="account-section__password-fields">
        <PasswordInput
          inputRef={currentRef}
          label="Current password"
          name="current-password"
          autoComplete="current-password"
          value={current}
          onChange={(event) => {
            setCurrent(event.target.value);
            setServerErrors(({ currentPassword: _drop, ...rest }) => rest);
          }}
          error={Boolean(errorFor('currentPassword'))}
          helperText={errorFor('currentPassword')}
        />
        <div>
          <PasswordInput
            inputRef={nextRef}
            label="New password"
            name="new-password"
            autoComplete="new-password"
            value={next}
            onChange={(event) => {
              setNext(event.target.value);
              setServerErrors(({ newPassword: _drop, ...rest }) => rest);
            }}
            error={Boolean(errorFor('newPassword'))}
            helperText={errorFor('newPassword')}
            slotProps={{ htmlInput: { 'aria-describedby': strengthId } }}
          />
          <PasswordStrength id={strengthId} value={next} />
        </div>
      </div>
      <div className="account-section__actions">
        <Button type="submit" variant="contained" color="ink" loading={changePassword.isPending} disabled={!current && !next}>
          Change password
        </Button>
      </div>
    </form>
  );
}

function DeleteAccount() {
  const toast = useToast();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const deleteAccount = useDeleteAccount();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const passwordRef = useRef(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!password) {
      setError('Enter your password to continue.');
      passwordRef.current?.focus();
      return;
    }
    const ok = await confirm({
      title: 'Delete your account?',
      description:
        'Your profile, wardrobe, outfits, plans and wear history will be deleted from this browser. You cannot undo this.',
      confirmLabel: 'Delete account',
      destructive: true,
      requireText: 'DELETE',
    });
    if (!ok) return;
    try {
      await deleteAccount.mutateAsync({ password });
      navigate('/signup', { replace: true });
      toast.show({ message: 'Your account has been deleted' });
    } catch (problem) {
      const message = problem?.fieldErrors?.password ?? problem?.message ?? 'Could not delete your account. Try again.';
      setError(message);
      passwordRef.current?.focus();
    }
  };

  const cancel = () => {
    setOpen(false);
    setPassword('');
    setError(null);
  };

  return (
    <div className="account-section__delete">
      <SettingRow
        label="Delete account"
        description="Permanently remove your account and everything in it. Export your data first if you want a copy."
      >
        {open ? null : (
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteOutlineOutlined />}
            onClick={() => {
              setOpen(true);
              window.setTimeout(() => passwordRef.current?.focus(), 60);
            }}
          >
            Delete account
          </Button>
        )}
      </SettingRow>
      <Collapse in={open} unmountOnExit>
        <form className="account-section__delete-form" onSubmit={handleSubmit} noValidate>
          <PasswordInput
            inputRef={passwordRef}
            label="Confirm with your password"
            name="delete-password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setError(null);
            }}
            error={Boolean(error)}
            helperText={error ?? 'Next, you will type DELETE to confirm.'}
          />
          <div className="account-section__actions">
            <Button variant="text" color="inherit" onClick={cancel} disabled={deleteAccount.isPending}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" color="error" loading={deleteAccount.isPending}>
              Delete my account
            </Button>
          </div>
        </form>
      </Collapse>
    </div>
  );
}

/** Settings > Account: password, sign out and account deletion. */
export default function AccountSection() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await logout();
      toast.show({ message: 'Signed out' });
    } catch (error) {
      setSigningOut(false);
      toast.error(error?.message || 'Could not sign out. Try again.');
    }
  };

  return (
    <SettingsPanel title="Account" description="Keep your account secure, or leave Alclo.">
      <SectionCard title="Change password" titleComponent="h3" subtitle="Use at least 8 characters with a letter and a number.">
        <ChangePasswordForm email={user?.email ?? ''} />
      </SectionCard>

      <SectionCard title="Sessions" titleComponent="h3">
        <SettingRow label="Sign out" description={`Signed in as ${user?.email ?? 'you'} in this browser.`}>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<LogoutOutlined />}
            loading={signingOut}
            loadingPosition="start"
            onClick={handleSignOut}
          >
            Sign out
          </Button>
        </SettingRow>
      </SectionCard>

      <SectionCard title="Danger zone" titleComponent="h3" className="account-section__danger">
        <DeleteAccount />
      </SectionCard>
    </SettingsPanel>
  );
}
