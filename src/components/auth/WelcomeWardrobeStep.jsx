import AddOutlined from '@mui/icons-material/AddOutlined';
import RadioGroup from '@mui/material/RadioGroup';
import { SAMPLE_BY_KEY } from '@/data/wardrobeItems';
import WardrobeChoiceCard from './WardrobeChoiceCard';
import './WelcomeWardrobeStep.scss';

const STRIP_KEYS = [
  'light-wash-denim-jacket',
  'ivory-cable-knit',
  'olive-cargo-pants',
  'burgundy-platform-derbies',
  'brown-cowboy-hat',
  'lilac-suede-belt-bag',
];
const STRIP = STRIP_KEYS.map((key) => SAMPLE_BY_KEY[key]).filter((item) => item?.image);
const EMPTY_SLOTS = [0, 1, 2, 3, 4, 5];

function SampleStrip() {
  return (
    <span className="welcome-wardrobe__strip">
      {STRIP.map((item) => (
        <span key={item.key} className="welcome-wardrobe__well">
          <img src={item.image} alt="" decoding="async" draggable={false} />
        </span>
      ))}
    </span>
  );
}

function EmptyStrip() {
  return (
    <span className="welcome-wardrobe__strip">
      {EMPTY_SLOTS.map((slot) => (
        <span key={slot} className="welcome-wardrobe__slot">
          {slot === 0 ? <AddOutlined className="welcome-wardrobe__add" /> : null}
        </span>
      ))}
    </span>
  );
}

/**
 * Step 2 of onboarding: start with the sample wardrobe or start empty.
 *
 * Props: value ('sample' | 'empty'), onChange(value), labelledBy (id of the step heading).
 */
export default function WelcomeWardrobeStep({ value, onChange, labelledBy }) {
  return (
    <RadioGroup
      name="wardrobe-start"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-labelledby={labelledBy}
      className="welcome-wardrobe"
    >
      <WardrobeChoiceCard
        value="sample"
        checked={value === 'sample'}
        title="Start with the sample wardrobe"
        description="About 45 pieces you can edit or delete later."
        media={<SampleStrip />}
      />
      <WardrobeChoiceCard
        value="empty"
        checked={value === 'empty'}
        title="Start empty"
        description="Add your own pieces one at a time."
        media={<EmptyStrip />}
      />
    </RadioGroup>
  );
}
