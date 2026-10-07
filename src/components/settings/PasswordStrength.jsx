import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import RadioButtonUncheckedOutlined from '@mui/icons-material/RadioButtonUncheckedOutlined';
import cx from '@/components/common/cx';
import { PASSWORD_CHECKS, STRENGTH_LABELS, passwordScore } from './passwordRules';
import './PasswordStrength.scss';

const TONES = ['', 'weak', 'fair', 'good', 'strong'];

/**
 * Four-segment strength meter with a text label, plus the live rule checklist.
 * Text always accompanies colour. Pass `id` so the field can reference it with aria-describedby.
 */
export default function PasswordStrength({ value = '', id, className }) {
  const score = passwordScore(value);
  const tone = TONES[score];

  return (
    <div id={id} className={cx('password-strength', tone && `password-strength--${tone}`, className)}>
      <div className="password-strength__meter-row">
        <div className="password-strength__meter" aria-hidden>
          {[1, 2, 3, 4].map((segment) => (
            <span
              key={segment}
              className={cx('password-strength__segment', segment <= score && 'password-strength__segment--on')}
            />
          ))}
        </div>
        <span className="password-strength__label">
          {score ? `Strength: ${STRENGTH_LABELS[score - 1]}` : 'Strength'}
        </span>
      </div>
      <ul className="password-strength__checks">
        {PASSWORD_CHECKS.map((check) => {
          const ok = check.test(value);
          return (
            <li key={check.id} className={cx('password-strength__check', ok && 'password-strength__check--ok')}>
              {ok ? (
                <CheckCircleOutlined className="password-strength__check-icon" aria-hidden />
              ) : (
                <RadioButtonUncheckedOutlined className="password-strength__check-icon" aria-hidden />
              )}
              <span>
                {check.label}
                <span className="u-visually-hidden">{ok ? ', done' : ', not yet'}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
