import DialogContent from '@mui/material/DialogContent';
import cx from '@/components/common/cx';
import DialogHeader from '@/components/common/DialogHeader';
import Kbd from '@/components/common/Kbd';
import ResponsiveDialog from '@/components/common/ResponsiveDialog';
import { IS_MAC, MOD_KEY_LABEL } from '@/hooks/useHotkeys';
import { SHORTCUT_SECTIONS } from './shortcuts';
import './ShortcutsDialog.scss';

const keyLabel = (key) => (key === 'mod' ? MOD_KEY_LABEL : key);

/** Spoken form of a key combination, e.g. "Ctrl plus K" or "G, then W". */
function spokenKeys(shortcut) {
  const keys = shortcut.keys.map((key) => (key === 'mod' ? (IS_MAC ? 'Command' : 'Control') : key));
  if (shortcut.then) return keys.join(', then ');
  if (shortcut.alt) return keys.join(' or ');
  return keys.join(' plus ');
}

/**
 * Keyboard shortcuts, grouped into Navigation, Actions and Lists. Shows Ctrl or the Command
 * symbol depending on the platform. Contract: <ShortcutsDialog open onClose />.
 */
export default function ShortcutsDialog({ open, onClose }) {
  return (
    <ResponsiveDialog open={open} onClose={onClose} maxWidth="md" className="shortcuts-dialog">
      <DialogHeader
        title="Keyboard shortcuts"
        subtitle="They work anywhere except while you are typing in a field."
        onClose={onClose}
      />
      <DialogContent className="shortcuts-dialog__content">
        {SHORTCUT_SECTIONS.map((section) => (
          <section
            key={section.id}
            className={cx('shortcuts-dialog__group', `shortcuts-dialog__group--${section.id}`)}
            aria-labelledby={`shortcuts-${section.id}`}
          >
            <h3 id={`shortcuts-${section.id}`} className="shortcuts-dialog__group-title">
              {section.title}
            </h3>
            <dl className="shortcuts-dialog__list">
              {section.shortcuts.map((shortcut) => (
                <div key={shortcut.label} className="shortcuts-dialog__row">
                  <dt className="shortcuts-dialog__label">
                    {shortcut.label}
                    {shortcut.where ? <span className="shortcuts-dialog__where">{shortcut.where}</span> : null}
                  </dt>
                  <dd className="shortcuts-dialog__keys">
                    <span className="u-visually-hidden">{spokenKeys(shortcut)}</span>
                    <span className="shortcuts-dialog__visual" aria-hidden>
                      {shortcut.keys.map((key, index) => (
                        <span key={key} className="shortcuts-dialog__key">
                          {index > 0 && shortcut.then ? <span className="shortcuts-dialog__sep">then</span> : null}
                          {index > 0 && shortcut.alt ? <span className="shortcuts-dialog__sep">or</span> : null}
                          <Kbd>{keyLabel(key)}</Kbd>
                        </span>
                      ))}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </DialogContent>
    </ResponsiveDialog>
  );
}
