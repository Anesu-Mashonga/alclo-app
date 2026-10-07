import cx from '@/components/common/cx';
import './AuthForm.scss';

/**
 * Form wrapper for the auth pages: native validation off (we show our own inline messages),
 * consistent field rhythm. Pass `ref` to reach the form element.
 *
 * Props: every <form> prop, plus className.
 */
export default function AuthForm({ className, children, ...props }) {
  return (
    <form noValidate className={cx('auth-form', className)} {...props}>
      {children}
    </form>
  );
}

/**
 * The "New to Alclo? Create an account" style line under a form.
 * Props: children, className.
 */
export function AuthAltLine({ children, className }) {
  return <p className={cx('auth-form__alt', className)}>{children}</p>;
}
