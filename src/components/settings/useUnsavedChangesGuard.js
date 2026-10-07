import { useEffect, useEffectEvent } from 'react';
import { useBlocker } from 'react-router';
import { useConfirm } from '@/context/ConfirmContext';

const sectionOf = (search) => new URLSearchParams(search).get('section') ?? '';

/**
 * Asks "Discard changes?" before leaving the page or switching settings section while a form
 * has unsaved edits. Opening the item drawer (?item=) does not count as leaving.
 * Also warns on tab close or reload.
 * @param {boolean} dirty
 */
export default function useUnsavedChangesGuard(dirty) {
  const confirm = useConfirm();
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty &&
      (currentLocation.pathname !== nextLocation.pathname ||
        sectionOf(currentLocation.search) !== sectionOf(nextLocation.search)),
  );

  const askToLeave = useEffectEvent(() => {
    let active = true;
    confirm({
      title: 'Discard changes?',
      description: 'Your profile changes have not been saved.',
      confirmLabel: 'Discard',
      cancelLabel: 'Keep editing',
      destructive: true,
    }).then((ok) => {
      if (!active) return;
      if (ok) blocker.proceed();
      else blocker.reset();
    });
    return () => {
      active = false;
    };
  });

  useEffect(() => {
    if (blocker.state === 'blocked') return askToLeave();
    return undefined;
  }, [blocker.state]);

  useEffect(() => {
    if (!dirty) return undefined;
    const onBeforeUnload = (event) => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);
}
