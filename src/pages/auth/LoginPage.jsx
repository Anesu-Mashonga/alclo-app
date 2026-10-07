import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import { useRef, useState } from 'react';
import { Link as RouterLink, useLocation } from 'react-router';
import AuthForm, { AuthAltLine } from '@/components/auth/AuthForm';
import AuthHeader from '@/components/auth/AuthHeader';
import AuthLayout from '@/components/auth/AuthLayout';
import DemoAccountPanel from '@/components/auth/DemoAccountPanel';
import PasswordField from '@/components/auth/PasswordField';
import { validateEmail, validatePasswordPresent } from '@/components/auth/authValidation';
import useAuthForm from '@/components/auth/useAuthForm';
import { useAuth } from '@/context/AuthContext';
import './LoginPage.scss';

const VALIDATE = { email: validateEmail, password: validatePasswordPresent };

/**
 * Sign in. On success the RedirectIfAuthed guard sends people back to `state.from` (or Today),
 * so this page only has to call login().
 */
export default function LoginPage() {
  const { login } = useAuth();
  const location = useLocation();
  const prefillEmail = typeof location.state?.email === 'string' ? location.state.email : '';
  const formRef = useRef(null);
  const form = useAuthForm({ initialValues: { email: prefillEmail, password: '' }, validate: VALIDATE, formRef });
  const [remember, setRemember] = useState(true);
  const [pending, setPending] = useState(null); // 'form' | 'demo' | null
  const [error, setError] = useState(null);

  // Keep the return path when moving between the auth pages.
  const carryState = location.state?.from ? { from: location.state.from } : undefined;

  const submit = async (values, source) => {
    setPending(source);
    setError(null);
    try {
      await login({ email: values.email.trim(), password: values.password, remember });
      // The guard navigates; this component unmounts.
    } catch (caught) {
      setPending(null);
      if (caught?.status === 422 && form.applyServerErrors(caught.fieldErrors)) return;
      setError(caught);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (pending) return;
    if (!form.validateAll()) return;
    submit(form.values, 'form');
  };

  const signInWithDemo = (credentials) => {
    if (pending) return;
    form.setValues(credentials);
    submit(credentials, 'demo');
  };

  const emailError = form.errorFor('email');
  const passwordError = form.errorFor('password');

  return (
    <AuthLayout>
      <AuthHeader
        title="Welcome back"
        subtitle="Sign in to plan today's outfit."
        documentTitle="Sign in"
        routeFocus={!prefillEmail}
      />

      <AuthForm ref={formRef} onSubmit={handleSubmit} aria-label="Sign in">
        {error ? (
          <Alert severity="error" role="alert" className="login-page__alert">
            {error.message || 'Could not sign you in. Try again.'}
          </Alert>
        ) : null}

        <TextField
          {...form.fieldProps('email')}
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="name@example.com"
          helperText={emailError}
          required
          fullWidth
          autoFocus={!prefillEmail}
        />

        <PasswordField
          {...form.fieldProps('password')}
          label="Password"
          autoComplete="current-password"
          helperText={passwordError}
          required
          fullWidth
          autoFocus={Boolean(prefillEmail)}
        />

        <div className="auth-form__row">
          <FormControlLabel
            control={<Checkbox checked={remember} onChange={(event) => setRemember(event.target.checked)} />}
            label="Remember me"
          />
          <Link
            component={RouterLink}
            to="/forgot-password"
            state={{ ...carryState, email: form.values.email.trim() || undefined }}
            className="login-page__forgot"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          loading={pending === 'form'}
          disabled={Boolean(pending)}
        >
          Sign in
        </Button>
      </AuthForm>

      <DemoAccountPanel
        className="login-page__demo"
        onUse={signInWithDemo}
        loading={pending === 'demo'}
        disabled={Boolean(pending)}
      />

      <AuthAltLine>
        New to Alclo?{' '}
        <Link component={RouterLink} to="/signup" state={carryState}>
          Create an account
        </Link>
      </AuthAltLine>
    </AuthLayout>
  );
}
