import cx from '@/components/common/cx';
import './Logo.scss';

/**
 * Alclo brand: the monogram mark (rose rounded square with a lowercase "a") and the wordmark.
 *
 * Props: variant 'full' (mark + wordmark, default) | 'mark' | 'wordmark'; size 'sm' | 'md' | 'lg'; className.
 */
export default function Logo({ variant = 'full', size = 'md', className, ...rest }) {
  return (
    <span className={cx('logo', `logo--${size}`, className)} role="img" aria-label="Alclo" {...rest}>
      {variant !== 'wordmark' ? (
        <span className="logo__mark" aria-hidden="true">
          a
        </span>
      ) : null}
      {variant !== 'mark' ? (
        <span className="logo__word" aria-hidden="true">
          alclo
        </span>
      ) : null}
    </span>
  );
}
