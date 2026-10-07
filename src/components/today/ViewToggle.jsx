import GridViewOutlined from '@mui/icons-material/GridViewOutlined';
import ViewQuiltOutlined from '@mui/icons-material/ViewQuiltOutlined';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

/** Tiles / Flat lay segmented control for the outfit card. */
export default function ViewToggle({ value, onChange }) {
  return (
    <ToggleButtonGroup
      exclusive
      size="small"
      value={value}
      onChange={(_event, next) => {
        if (next) onChange(next);
      }}
      aria-label="Outfit view"
      className="today-outfit__view"
    >
      <ToggleButton value="tiles">
        <GridViewOutlined aria-hidden />
        Tiles
      </ToggleButton>
      <ToggleButton value="flatlay">
        <ViewQuiltOutlined aria-hidden />
        Flat lay
      </ToggleButton>
    </ToggleButtonGroup>
  );
}
