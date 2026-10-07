import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import RadioButtonUncheckedOutlined from '@mui/icons-material/RadioButtonUncheckedOutlined';
import cx from '@/components/common/cx';
import { passwordChecks, passwordStrength } from './authValidation';
import './PasswordStrength.scss';

const SEGMENTS = [1, 2, 3, 4];

/**
 * Four-segment strength meter with a Weak / Fair / Good / Strong label and a live checklist
 * of the password rules (icon + text, never colour alone).
 *
 * Props: password, id (so the field can reference it with aria-describedby), className.
 */
export default function PasswordStrength({ password, id, className }) {
  const { score, label } = passwordStrength(password);
  const checks = passwordChecks(password);

  return (
    <div id={id} className={cx('password-strength', `password-strength--score-${score}`, className)}>
      <div className="password-strength__meter-row">
        <div className="password-strength__meter" aria-hidden="true">
          {SEGMENTS.map((segment) => (
            <span
              key={segment}
              className={cx('password-strength__segment', segment <= score && 'password-strength__segment--on')}
            />
          ))}
        </div>
        <span className="password-strength__label">{label ? `Strength: ${label}` : 'Strength'}</span>
      </div>
      <ul className="password-strength__checks">
        {checks.map((check) => (
          <li
            key={check.id}
            className={cx('password-strength__check', check.met && 'password-strength__check--met')}
          >
            {check.met ? (
              <CheckCircleOutlined className="password-strength__icon" aria-hidden />
            ) : (
              <RadioButtonUncheckedOutlined className="password-strength__icon" aria-hidden />
            )}
            <span>{check.label}</span>
            <span className="u-visually-hidden">{check.met ? ', done' : ', not yet'}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
