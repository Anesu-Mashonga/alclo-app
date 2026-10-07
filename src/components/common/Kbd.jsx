import cx from './cx';
import './Kbd.scss';

/** Keyboard key chip: <Kbd>Ctrl</Kbd><Kbd>K</Kbd> */
export default function Kbd({ children, className, ...rest }) {
  return (
    <kbd className={cx('kbd', className)} {...rest}>
      {children}
    </kbd>
  );
}
