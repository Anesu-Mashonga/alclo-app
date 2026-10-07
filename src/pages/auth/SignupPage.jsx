import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import { useId, useRef, useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router';
import AuthForm, { AuthAltLine } from '@/components/auth/AuthForm';
import AuthHeader from '@/components/auth/AuthHeader';
import AuthLayout from '@/components/auth/AuthLayout';
import PasswordField from '@/components/auth/PasswordField';
import PasswordStrength from '@/components/auth/PasswordStrength';
import { validateEmail, validateName, validateNewPassword } from '@/components/auth/authValidation';
import useAuthForm from '@/components/auth/useAuthForm';
import { useAuth } from '@/context/AuthContext';

const VALIDATE = { name: validateName, email: validateEmail, password: validateNewPassword };

/** Create an account, then continue to the two welcome steps. */
export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const strengthId = useId();
  const formRef = useRef(null);
  const form = useAuthForm({ initialValues: { name: '', email: '', password: '' }, validate: VALIDATE, formRef });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const [takenEmail, setTakenEmail] = useState(null);

  const carryState = location.state?.from ? { from: location.state.from } : undefined;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (pending) return;
    if (!form.validateAll()) return;
    setPending(true);
    setError(null);
    setTakenEmail(null);
    const { name, email, password } = form.values;
    try {
      await signup({ name: name.trim(), email: email.trim(), password, remember: true });
      navigate('/welcome', { replace: true });
    } catch (caught) {
      setPending(false);
      if (caught?.status === 409) {
        setTakenEmail(email.trim());
        form.applyServerErrors({ email: 'An account with this email already exists.' });
        return;
      }
      if (caught?.status === 422 && form.applyServerErrors(caught.fieldErrors)) return;
      setError(caught);
    }
  };

  const emailError = form.errorFor('email');
  const showSignInInstead = Boolean(takenEmail) && emailError && form.values.email.trim() === takenEmail;

  return (
    <AuthLayout>
      <AuthHeader
        title="Create your account"
        subtitle="Plan outfits around your week, the weather and what is clean."
        documentTitle="Create account"
      />

      <AuthForm ref={formRef} onSubmit={handleSubmit} aria-label="Create account">
        {error ? (
          <Alert severity="error" role="alert">
            {error.message || 'Could not create your account. Try again.'}
          </Alert>
        ) : null}

        <TextField
          {...form.fieldProps('name')}
          label="Full name"
          autoComplete="name"
          helperText={form.errorFor('name')}
          required
          fullWidth
          autoFocus
        />

        <TextField
          {...form.fieldProps('email')}
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="name@example.com"
          helperText={
            showSignInInstead ? (
              <>
                {emailError}{' '}
                <Link component={RouterLink} to="/login" state={{ ...carryState, email: takenEmail }}>
                  Sign in instead
                </Link>
              </>
            ) : (
              emailError
            )
          }
          required
          fullWidth
        />

        <div>
          <PasswordField
            {...form.fieldProps('password')}
            label="Password"
            autoComplete="new-password"
            helperText={form.errorFor('password')}
            describedBy={strengthId}
            required
            fullWidth
          />
          <PasswordStrength id={strengthId} password={form.values.password} />
        </div>

        <Button type="submit" variant="contained" size="large" fullWidth loading={pending} disabled={pending}>
          Create account
        </Button>
      </AuthForm>

      <AuthAltLine>
        Already have an account?{' '}
        <Link component={RouterLink} to="/login" state={carryState}>
          Sign in
        </Link>
      </AuthAltLine>
    </AuthLayout>
  );
}
