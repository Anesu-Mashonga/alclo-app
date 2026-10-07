import ArrowBackOutlined from '@mui/icons-material/ArrowBackOutlined';
import ArrowForwardOutlined from '@mui/icons-material/ArrowForwardOutlined';
import LogoutOutlined from '@mui/icons-material/LogoutOutlined';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useId, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import WelcomePreferencesStep from '@/components/auth/WelcomePreferencesStep';
import WelcomeWardrobeStep from '@/components/auth/WelcomeWardrobeStep';
import cx from '@/components/common/cx';
import ThemeToggle from '@/components/common/ThemeToggle';
import Logo from '@/components/layout/Logo';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useCompleteOnboarding } from '@/hooks/api';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import { useRouteHeadingFocus } from '@/routes/routeFocus';
import './WelcomePage.scss';

const STEPS = {
  1: {
    title: 'How do you dress most days?',
    subtitle: 'Two quick questions so your first outfit ideas fit your week.',
  },
  2: {
    title: 'Start your wardrobe',
    subtitle: 'Pick a starting point. You can add, edit or remove pieces at any time.',
  },
};

const DRAFT_PREFIX = 'alclo.welcome.';

/** Initial answers: a saved draft for this user (survives a refresh), else their preferences. */
function initialDraft(user) {
  const prefs = user?.preferences ?? {};
  const fallback = {
    occasions: prefs.occasions?.length ? prefs.occasions : ['casual'],
    defaultOccasion: prefs.defaultOccasion ?? 'casual',
    city: prefs.city ?? 'Harare',
    tempUnit: prefs.tempUnit ?? 'C',
    wardrobe: 'sample',
  };
  if (!fallback.occasions.includes(fallback.defaultOccasion)) fallback.defaultOccasion = fallback.occasions[0];
  try {
    const saved = JSON.parse(window.sessionStorage.getItem(DRAFT_PREFIX + user?.id) ?? 'null');
    return saved && Array.isArray(saved.occasions) ? { ...fallback, ...saved } : fallback;
  } catch {
    return fallback;
  }
}

function saveDraft(userId, draft) {
  try {
    if (draft) window.sessionStorage.setItem(DRAFT_PREFIX + userId, JSON.stringify(draft));
    else window.sessionStorage.removeItem(DRAFT_PREFIX + userId);
  } catch {
    // Storage can be unavailable (private mode); the draft just won't survive a refresh.
  }
}

const stepMotion = {
  initial: { opacity: 0, x: 16 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.2, ease: [0.2, 0, 0, 1] } },
  exit: { opacity: 0, x: -16, transition: { duration: 0.12, ease: [0.3, 0, 1, 1] } },
};

/**
 * Onboarding for new accounts (signed in, not yet onboarded). Two steps, the current one in
 * `?step=`, answers kept in sessionStorage. Finishing calls completeOnboarding, after which the
 * route guard (and this page) move on to Today.
 */
export default function WelcomePage() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const complete = useCompleteOnboarding();
  const headingRef = useRef(null);
  const headingId = useId();
  const [draft, setDraft] = useState(() => initialDraft(user));
  const [showErrors, setShowErrors] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const step = searchParams.get('step') === '2' ? 2 : 1;
  const copy = STEPS[step];
  const firstName = user?.name?.trim().split(/\s+/)[0];

  useDocumentTitle(step === 1 ? 'Welcome' : 'Start your wardrobe');
  useRouteHeadingFocus(headingRef);

  useEffect(() => {
    if (user?.id) saveDraft(user.id, draft);
  }, [user?.id, draft]);

  // Move focus to the new step's heading when the step changes (not on first render).
  const previousStep = useRef(step);
  useEffect(() => {
    if (previousStep.current === step) return;
    previousStep.current = step;
    headingRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  }, [step]);

  const update = (patch) => setDraft((current) => ({ ...current, ...patch }));

  const goToWardrobeStep = (event) => {
    event.preventDefault();
    if (draft.occasions.length === 0) {
      setShowErrors(true);
      document.querySelector('.welcome-prefs__chip')?.focus();
      return;
    }
    setShowErrors(false);
    setSearchParams({ step: '2' }, { state: { fromStepOne: true } });
  };

  const goBack = () => {
    complete.reset();
    if (location.state?.fromStepOne) navigate(-1);
    else setSearchParams({}, { replace: true });
  };

  const finish = async (event) => {
    event.preventDefault();
    if (complete.isPending) return;
    const sampleWardrobe = draft.wardrobe === 'sample';
    try {
      const result = await complete.mutateAsync({
        preferences: {
          occasions: draft.occasions,
          defaultOccasion: draft.defaultOccasion,
          city: draft.city,
          tempUnit: draft.tempUnit,
        },
        sampleWardrobe,
      });
      saveDraft(user?.id, null);
      if (sampleWardrobe && result?.importedCount) {
        toast.success(`Added ${result.importedCount} sample pieces to your wardrobe`);
      }
      navigate('/', { replace: true });
    } catch {
      // The error Alert below explains what happened; the button is ready to retry.
    }
  };

  const signOut = async () => {
    setSigningOut(true);
    try {
      await logout();
      toast.show({ message: 'Signed out' });
    } catch {
      setSigningOut(false);
    }
  };

  return (
    <div className="welcome-page">
      <header className="welcome-page__header">
        <Logo size="md" />
        <div className="welcome-page__header-actions">
          <ThemeToggle />
          <Button
            color="inherit"
            startIcon={<LogoutOutlined />}
            onClick={signOut}
            loading={signingOut}
            className="welcome-page__signout"
          >
            Sign out
          </Button>
        </div>
      </header>

      <main className="welcome-page__main" id="main-content">
        <form
          className="welcome-page__card"
          onSubmit={step === 1 ? goToWardrobeStep : finish}
          noValidate
          aria-labelledby={headingId}
        >
          <div className="welcome-page__progress">
            <p className="welcome-page__step">
              Step {step} of 2{firstName && step === 1 ? <span> · Welcome, {firstName}</span> : null}
            </p>
            <div className="welcome-page__bar" aria-hidden="true">
              <span className="welcome-page__bar-segment welcome-page__bar-segment--on" />
              <span className={cx('welcome-page__bar-segment', step === 2 && 'welcome-page__bar-segment--on')} />
            </div>
          </div>

          <div className="welcome-page__titles">
            <h1 ref={headingRef} id={headingId} tabIndex={-1} className="welcome-page__title">
              {copy.title}
            </h1>
            <p className="welcome-page__subtitle">{copy.subtitle}</p>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={step} className="welcome-page__body" {...stepMotion}>
              {step === 1 ? (
                <WelcomePreferencesStep values={draft} onChange={update} showErrors={showErrors} />
              ) : (
                <WelcomeWardrobeStep
                  value={draft.wardrobe}
                  onChange={(wardrobe) => update({ wardrobe })}
                  labelledBy={headingId}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {step === 2 && complete.isError ? (
            <Alert severity="error" role="alert" className="welcome-page__alert">
              {complete.error?.message || 'Could not finish setting up. Try again.'}
            </Alert>
          ) : null}

          <div className="welcome-page__actions">
            {step === 2 ? (
              <Button
                variant="outlined"
                color="inherit"
                size="large"
                startIcon={<ArrowBackOutlined />}
                onClick={goBack}
                disabled={complete.isPending}
              >
                Back
              </Button>
            ) : (
              <span />
            )}
            {step === 1 ? (
              <Button type="submit" variant="contained" size="large" endIcon={<ArrowForwardOutlined />}>
                Continue
              </Button>
            ) : (
              <Button type="submit" variant="contained" size="large" loading={complete.isPending}>
                Go to Today
              </Button>
            )}
          </div>
        </form>
      </main>
    </div>
  );
}
