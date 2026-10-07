import AcUnitOutlined from '@mui/icons-material/AcUnitOutlined';
import AirOutlined from '@mui/icons-material/AirOutlined';
import CloudOutlined from '@mui/icons-material/CloudOutlined';
import GrainOutlined from '@mui/icons-material/GrainOutlined';
import ThunderstormOutlined from '@mui/icons-material/ThunderstormOutlined';
import UmbrellaOutlined from '@mui/icons-material/UmbrellaOutlined';
import WbSunnyOutlined from '@mui/icons-material/WbSunnyOutlined';
import { createElement } from 'react';

const ICONS = {
  clear: WbSunnyOutlined,
  clouds: CloudOutlined,
  rain: UmbrellaOutlined,
  drizzle: GrainOutlined,
  storm: ThunderstormOutlined,
  snow: AcUnitOutlined,
  wind: AirOutlined,
};

/**
 * Weather condition icon (MUI Outlined). Decorative unless you pass `titleAccess`,
 * so render the condition label next to it.
 *
 * Props: condition ('clear' | 'clouds' | 'rain' | 'drizzle' | 'storm' | 'snow' | 'wind'),
 * plus any SvgIcon prop (fontSize, className, titleAccess, sx).
 */
export default function WeatherIcon({ condition, ...iconProps }) {
  const icon = ICONS[condition] ?? CloudOutlined;
  return createElement(icon, {
    'aria-hidden': iconProps.titleAccess ? undefined : true,
    ...iconProps,
  });
}
