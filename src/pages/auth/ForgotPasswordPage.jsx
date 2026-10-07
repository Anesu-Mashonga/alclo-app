import ArrowBackOutlined from '@mui/icons-material/ArrowBackOutlined';
import LockResetOutlined from '@mui/icons-material/LockResetOutlined';
import MarkEmailReadOutlined from '@mui/icons-material/MarkEmailReadOutlined';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import { useRef, useState } from 'react';
import { Link as RouterLink, useLocation } from 'react-router';
import AuthForm, { AuthAltLine } from '@/components/auth/AuthForm';
import AuthHeader from '@/components/auth/AuthHeader';
import AuthLayout from '@/components/auth/AuthLayout';
import { validateEmail } from '@/components/auth/authValidation';
import useAuthForm from '@/components/auth/useAuthForm';
import { useRequestPasswordReset } from '@/hooks/api';
import './ForgotPasswordPage.scss';

const VALIDATE = { email: validateEmail };

/** Request a reset link (mock). Success swaps the form for a "Check your inbox" message. */
export default function ForgotPasswordPage() {
  const location = useLocation();
  const prefillEmail = typeof location.state?.email === 'string' ? location.state.email : '';
  const formRef = useRef(null);
  const form = useAuthForm({ initialValues: { email: prefillEmail }, validate: VALIDATE, formRef });
  const reset = useRequestPasswordReset();
  const [sentTo, setSentTo] = useState(null);
  const [error, setError] = useState(null);
  const headingRef = useRef(null);

  const carryState = location.state?.from ? { from: location.state.from } : undefined;

  const focusHeading = () => window.requestAnimationFrame(() => headingRef.current?.focus());

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (reset.isPending) return;
    if (!form.validateAll()) return;
    setError(null);
    const email = form.values.email.trim();
    try {
      await reset.mutateAsync(email);
      setSentTo(email);
      focusHeading();
    } catch (caught) {
      if (caught?.status === 422 && form.applyServerErrors(caught.fieldErrors)) return;
      setError(caught);
    }
  };

  const tryAnotherEmail = () => {
    setSentTo(null);
    reset.reset();
    window.requestAnimationFrame(() => form.focusField('email'));
  };

  if (sentTo) {
    return (
      <AuthLayout>
        <AuthHeader
          headingRef={headingRef}
          icon={MarkEmailReadOutlined}
          title="Check your inbox"
          subtitle={
            <>
              If an account exists for <strong className="forgot-page__email">{sentTo}</strong>, we have sent a link
              to reset your password.
            </>
          }
          documentTitle="Check your inbox"
        />
        <div className="forgot-page__actions">
          <Button
            component={RouterLink}
            to="/login"
            state={{ ...carryState, email: sentTo }}
            variant="contained"
            size="large"
            fullWidth
            startIcon={<ArrowBackOutlined />}
          >
            Back to sign in
          </Button>
          <p className="forgot-page__hint">
            No email after a few minutes? Check your spam folder, or{' '}
            <Link component="button" type="button" onClick={tryAnotherEmail} className="forgot-page__retry">
              try a different email
            </Link>
            .
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <AuthHeader
        headingRef={headingRef}
        icon={LockResetOutlined}
        title="Reset your password"
        subtitle="Enter the email you signed up with and we will send you a link to choose a new password."
        documentTitle="Reset password"
      />

      <AuthForm ref={formRef} onSubmit={handleSubmit} aria-label="Reset your password">
        {error ? (
          <Alert severity="error" role="alert">
            {error.message || 'Could not send the link. Try again.'}
          </Alert>
        ) : null}

        <TextField
          {...form.fieldProps('email')}
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="name@example.com"
          helperText={form.errorFor('email')}
          required
          fullWidth
          autoFocus
        />

        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          loading={reset.isPending}
          disabled={reset.isPending}
        >
          Send reset link
        </Button>
      </AuthForm>

      <AuthAltLine>
        Remembered it?{' '}
        <Link component={RouterLink} to="/login" state={{ ...carryState, email: form.values.email.trim() || undefined }}>
          Back to sign in
        </Link>
      </AuthAltLine>
    </AuthLayout>
  );
}
