import { useEffect } from 'react';
import cx from '@/components/common/cx';
import ThemeToggle from '@/components/common/ThemeToggle';
import Logo from '@/components/layout/Logo';
import AuthMosaic from './AuthMosaic';
import './AuthLayout.scss';

// Sibling auth pages, warmed while idle so moving between them never shows the full-page loader.
const preloadAuthPages = () =>
  Promise.all([
    import('@/pages/auth/LoginPage'),
    import('@/pages/auth/SignupPage'),
    import('@/pages/auth/ForgotPasswordPage'),
    import('@/pages/auth/WelcomePage'),
  ]).catch(() => {
    // The real navigation retries; nothing to report here.
  });

/**
 * Split-screen frame for sign in, sign up and password reset.
 * md and up: form column on the left, lookbook mosaic on the right. Below md: form only.
 *
 * Props: children (the page content), className.
 */
export default function AuthLayout({ children, className }) {
  useEffect(() => {
    const idle = window.requestIdleCallback ?? ((callback) => window.setTimeout(callback, 600));
    const cancel = window.cancelIdleCallback ?? window.clearTimeout;
    const handle = idle(preloadAuthPages);
    return () => cancel(handle);
  }, []);

  return (
    <div className={cx('auth-layout', className)}>
      <div className="auth-layout__column">
        <header className="auth-layout__header">
          <Logo size="md" />
          <ThemeToggle className="auth-layout__theme" />
        </header>
        <main className="auth-layout__main" id="main-content">
          <div className="auth-layout__content">{children}</div>
        </main>
        <footer className="auth-layout__footer">
          <span>&copy; 2026 Alclo</span>
          <span>Your wardrobe is saved in this browser.</span>
        </footer>
      </div>
      <aside className="auth-layout__aside" aria-label="Alclo lookbook">
        <AuthMosaic />
      </aside>
    </div>
  );
}
