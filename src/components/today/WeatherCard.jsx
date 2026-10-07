import AirOutlined from '@mui/icons-material/AirOutlined';
import LocationOnOutlined from '@mui/icons-material/LocationOnOutlined';
import MyLocationOutlined from '@mui/icons-material/MyLocationOutlined';
import ThermostatOutlined from '@mui/icons-material/ThermostatOutlined';
import TuneOutlined from '@mui/icons-material/TuneOutlined';
import UmbrellaOutlined from '@mui/icons-material/UmbrellaOutlined';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Skeleton from '@mui/material/Skeleton';
import { useId, useState } from 'react';
import { Link as RouterLink } from 'react-router';
import ErrorState from '@/components/common/ErrorState';
import WeatherIcon from '@/components/common/WeatherIcon';
import cx from '@/components/common/cx';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { conditionLabel } from '@/data/taxonomy';
import { isLiveWeatherAvailable } from '@/hooks/api';
import { formatTime } from '@/lib/dates';
import { formatPercent, formatTemp, formatWind } from '@/lib/format';
import WeatherPreviewPopover from './WeatherPreviewPopover';
import './WeatherCard.scss';

function WeatherSkeleton() {
  return (
    <div className="weather-card__body" aria-hidden>
      <div className="weather-card__now">
        <Skeleton variant="circular" width={48} height={48} />
        <div>
          <Skeleton variant="text" width={110} height={56} />
          <Skeleton variant="text" width={90} />
        </div>
      </div>
      <div className="weather-card__facts">
        {[0, 1, 2, 3].map((index) => (
          <Skeleton key={index} variant="rounded" height={52} />
        ))}
      </div>
      <Skeleton variant="rounded" height={84} />
    </div>
  );
}

function useLocationAction() {
  const { updatePreferences } = useAuth();
  const toast = useToast();
  const [locating, setLocating] = useState(false);

  const locate = () => {
    if (!('geolocation' in navigator)) {
      toast.error('This browser cannot share your location.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await updatePreferences({ coords: { lat: position.coords.latitude, lon: position.coords.longitude } });
          toast.success('Using your location for weather');
        } catch (error) {
          toast.error(error?.message ?? 'Could not save your location.');
        } finally {
          setLocating(false);
        }
      },
      (error) => {
        setLocating(false);
        toast.error(
          error?.code === 1
            ? 'Location access is blocked. Allow it in your browser settings to use it here.'
            : 'Could not find your location. Try again in a moment.',
        );
      },
      { timeout: 10000, maximumAge: 10 * 60 * 1000 },
    );
  };

  return { locate, locating };
}

/**
 * Weather for the user's city: now, feels like, high and low, rain, wind and the next hours.
 * "Try other weather" previews the outfit for a different temperature and condition.
 */
export default function WeatherCard({ weatherQuery, unit = 'C', preview, onPreview, className }) {
  const headingId = useId();
  const { user } = useAuth();
  const { locate, locating } = useLocationAction();
  const [anchorEl, setAnchorEl] = useState(null);
  const [popoverKey, setPopoverKey] = useState(0);
  const weather = weatherQuery.data;
  const canUseLocation = isLiveWeatherAvailable() && user?.preferences?.weatherSource === 'live';
  const isLive = weather?.source === 'live';

  const openPreview = (event) => {
    setPopoverKey((key) => key + 1);
    setAnchorEl(event.currentTarget);
  };

  return (
    <section className={cx('weather-card', className)} aria-labelledby={headingId}>
      <header className="weather-card__header">
        <h2 id={headingId} className="weather-card__city">
          <LocationOnOutlined aria-hidden />
          <span className="u-visually-hidden">Weather in </span>
          {weather?.city ?? user?.preferences?.city ?? 'Weather'}
        </h2>
        {weather ? (
          <span className={cx('weather-card__source', isLive && 'weather-card__source--live')}>
            {isLive ? 'Live weather' : 'Simulated weather'}
          </span>
        ) : null}
      </header>

      {weatherQuery.isPending ? <WeatherSkeleton /> : null}

      {weatherQuery.isError && !weather ? (
        <ErrorState
          compact
          title="Could not load the weather"
          error={weatherQuery.error}
          onRetry={() => weatherQuery.refetch()}
        />
      ) : null}

      {weather ? (
        <div className="weather-card__body">
          <div className="weather-card__now">
            <span className="weather-card__icon">
              <WeatherIcon condition={weather.condition} />
            </span>
            <div className="weather-card__reading">
              <span className="weather-card__temp">{formatTemp(weather.tempC, unit)}</span>
              <span className="weather-card__desc">{weather.description ?? conditionLabel(weather.condition)}</span>
            </div>
          </div>

          <dl className="weather-card__facts">
            <div className="weather-card__fact">
              <dt>
                <ThermostatOutlined aria-hidden />
                Feels like
              </dt>
              <dd>{formatTemp(weather.feelsLikeC, unit)}</dd>
            </div>
            <div className="weather-card__fact">
              <dt>High and low</dt>
              <dd>
                {formatTemp(weather.highC, unit, { unit: false })} / {formatTemp(weather.lowC, unit, { unit: false })}
              </dd>
            </div>
            <div className="weather-card__fact">
              <dt>
                <UmbrellaOutlined aria-hidden />
                Rain chance
              </dt>
              <dd>{formatPercent(weather.precipChance)}</dd>
            </div>
            <div className="weather-card__fact">
              <dt>
                <AirOutlined aria-hidden />
                Wind
              </dt>
              <dd>{formatWind(weather.windKph, unit)}</dd>
            </div>
          </dl>

          {weather.hourly?.length ? (
            <div className="weather-card__hourly-wrap">
              <h3 className="weather-card__subhead">Next 12 hours</h3>
              <ol className="weather-card__hourly">
                {weather.hourly.map((hour, index) => (
                  <li key={hour.time} className="weather-card__hour">
                    <span className="weather-card__hour-time">{index === 0 ? 'Now' : formatTime(hour.time)}</span>
                    <WeatherIcon condition={hour.condition} titleAccess={conditionLabel(hour.condition)} />
                    <span className="weather-card__hour-temp">{formatTemp(hour.tempC, unit, { unit: false })}</span>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}

          {weather.fallbackReason ? <p className="weather-card__note">{weather.fallbackReason}</p> : null}
        </div>
      ) : null}

      <footer className="weather-card__actions">
        <Button
          variant="outlined"
          color="inherit"
          size="small"
          startIcon={<TuneOutlined />}
          aria-haspopup="dialog"
          aria-expanded={Boolean(anchorEl)}
          onClick={openPreview}
          disabled={!weather && !weatherQuery.isError}
          className={cx(preview && 'weather-card__try--active')}
        >
          Try other weather
        </Button>
        {canUseLocation ? (
          <Button
            variant="text"
            color="inherit"
            size="small"
            startIcon={<MyLocationOutlined />}
            loading={locating}
            loadingPosition="start"
            onClick={locate}
          >
            Use my location
          </Button>
        ) : null}
        <Link component={RouterLink} to="/settings?section=preferences" className="weather-card__city-link">
          Change city
        </Link>
      </footer>

      <WeatherPreviewPopover
        key={popoverKey}
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        unit={unit}
        initial={{
          tempC: preview?.tempC ?? Math.round(weather?.tempC ?? 20),
          condition: preview?.condition ?? weather?.condition ?? 'clear',
        }}
        onApply={(next) => {
          setAnchorEl(null);
          onPreview(next);
        }}
        onClose={() => setAnchorEl(null)}
      />
    </section>
  );
}
