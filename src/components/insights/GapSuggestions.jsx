import CloseOutlined from '@mui/icons-material/CloseOutlined';
import TaskAltOutlined from '@mui/icons-material/TaskAltOutlined';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { AnimatePresence, motion } from 'motion/react';
import EmptyState from '@/components/common/EmptyState';
import ItemThumb from '@/components/common/ItemThumb';
import { useToast } from '@/context/ToastContext';
import { typeLabel } from '@/data/taxonomy';
import useLocalStorage from '@/hooks/useLocalStorage';
import { formatCurrency } from '@/lib/format';
import './GapSuggestions.scss';

const HIDDEN_KEY = 'alclo.insights.hiddenGaps';
const EASE = [0.2, 0, 0, 1];

/**
 * "Worth adding": gaps in the wardrobe matched to a catalogue product. Informational only,
 * there is nothing to buy. Each card can be hidden (per browser) with Undo.
 */
export default function GapSuggestions({ gaps }) {
  const toast = useToast();
  const [hidden, setHidden] = useLocalStorage(HIDDEN_KEY, []);
  const hiddenSet = new Set(Array.isArray(hidden) ? hidden : []);
  const visible = gaps.filter((gap) => !hiddenSet.has(gap.id));
  const hiddenHere = gaps.length - visible.length;

  const hide = (gap) => {
    setHidden((prev) => [...new Set([...(Array.isArray(prev) ? prev : []), gap.id])]);
    toast.show({
      message: `Hid "${gap.title}"`,
      action: {
        label: 'Undo',
        onClick: () => setHidden((prev) => (Array.isArray(prev) ? prev.filter((id) => id !== gap.id) : [])),
      },
    });
  };

  const showHidden = () => setHidden((prev) => (Array.isArray(prev) ? prev.filter((id) => !gaps.some((g) => g.id === id)) : []));

  if (!gaps.length) {
    return (
      <EmptyState
        compact
        titleComponent="h3"
        icon={TaskAltOutlined}
        title="Your wardrobe covers the basics"
        description="We look for gaps such as rain layers and work pieces. Nothing stands out right now."
      />
    );
  }

  return (
    <div className="gap-suggestions">
      {visible.length ? (
        <ul className="gap-suggestions__grid">
          <AnimatePresence initial={false}>
            {visible.map((gap) => (
              <motion.li
                key={gap.id}
                layout
                className="gap-card"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.16, ease: [0.3, 0, 1, 1] } }}
                transition={{ duration: 0.2, ease: EASE }}
              >
                <ItemThumb item={gap.product} size="md" ratio="1/1" className="gap-card__thumb" />
                <div className="gap-card__body">
                  <p className="gap-card__eyebrow">{gap.title}</p>
                  <h3 className="gap-card__name">{gap.product.name}</h3>
                  <p className="gap-card__meta u-tabular">
                    {typeLabel(gap.product.type)} · {formatCurrency(gap.product.price)}
                  </p>
                  <p className="gap-card__reason">{gap.reason}</p>
                </div>
                <Tooltip title="Hide suggestion">
                  <IconButton
                    className="gap-card__hide"
                    size="small"
                    aria-label={`Hide suggestion: ${gap.title}`}
                    onClick={() => hide(gap)}
                  >
                    <CloseOutlined fontSize="small" />
                  </IconButton>
                </Tooltip>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      ) : (
        <EmptyState
          compact
          titleComponent="h3"
          icon={TaskAltOutlined}
          title="You hid every suggestion"
          description="Bring them back any time."
          action={
            <Button variant="outlined" color="inherit" onClick={showHidden}>
              Show hidden suggestions
            </Button>
          }
        />
      )}
      {visible.length && hiddenHere ? (
        <Button className="gap-suggestions__restore" variant="text" color="inherit" size="small" onClick={showHidden}>
          Show {hiddenHere} hidden
        </Button>
      ) : null}
    </div>
  );
}
