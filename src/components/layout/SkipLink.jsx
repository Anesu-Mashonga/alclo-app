import './SkipLink.scss';

/**
 * First focusable element on every app page. Moves focus to <main id={targetId}> without
 * touching the URL hash (which the router would treat as a navigation).
 */
export default function SkipLink({ targetId = 'main-content', children = 'Skip to content' }) {
  const handleClick = (event) => {
    const target = document.getElementById(targetId);
    if (!target) return;
    event.preventDefault();
    target.focus({ preventScroll: false });
  };

  return (
    <a className="skip-link" href={`#${targetId}`} onClick={handleClick}>
      {children}
    </a>
  );
}
