import { useCallback, useEffect, useState } from 'react';
import CurrentWeather from './CurrentWeather';
import ForecastList from './ForecastList';
import HourlyChart from './HourlyChart';
import LoadingSkeleton from './LoadingSkeleton';
import ErrorState from './ErrorState';
import { fetchWeatherBundle } from '../services/weatherApi';
import { buildWeatherViewModel } from '../utils/transformWeatherData';

const DEFAULT_COORDS = {
  latitude: null,
  longitude: null,
};

const GEO_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 600000,
};

const friendlyGeoError = (error) => {
  if (!error?.code) {
    return 'Unable to detect your current location. Please try again.';
  }

  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'Location access was denied. Enable location permission in your browser and retry.';
    case error.POSITION_UNAVAILABLE:
      return 'Your location could not be determined. Please check your device location settings.';
    case error.TIMEOUT:
      return 'Location request timed out. Please retry with a stronger GPS/network signal.';
    default:
      return 'Unable to detect your current location. Please try again.';
  }
};

const WeatherCard = () => {
  const [units, setUnits] = useState('metric');
  const [coords, setCoords] = useState(DEFAULT_COORDS);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const resolveLocation = useCallback(() => {
    setError('');
    setLoading(true);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported in this browser.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (geoError) => {
        setError(friendlyGeoError(geoError));
        setLoading(false);
      },
      GEO_OPTIONS,
    );
  }, []);

  const loadWeather = useCallback(async () => {
    if (!coords.latitude || !coords.longitude) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetchWeatherBundle(coords.latitude, coords.longitude, units);
      const viewModel = buildWeatherViewModel(response);
      setWeather(viewModel);
    } catch (fetchError) {
      setError(fetchError.message || 'Failed to fetch weather data.');
    } finally {
      setLoading(false);
    }
  }, [coords.latitude, coords.longitude, units]);

  useEffect(() => {
    resolveLocation();
  }, [resolveLocation]);

  useEffect(() => {
    loadWeather();
  }, [loadWeather]);

  const handleUnitToggle = (targetUnit) => {
    if (targetUnit !== units) {
      setUnits(targetUnit);
    }
  };

  if (loading && !weather) {
    return <LoadingSkeleton />;
  }

  if (error && !weather) {
    return <ErrorState message={error} onRetry={resolveLocation} />;
  }

  return (
    <section className="glass-card rounded-[2rem] p-6 sm:p-8 lg:p-10">
      {error ? (
        <div className="mb-4 rounded-2xl border border-amber-400/45 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
          {error}
        </div>
      ) : null}

      {loading ? <div className="mb-3 text-xs uppercase tracking-[0.2em] text-cyan-200">Refreshing weather...</div> : null}

      {weather ? (
        <div className="space-y-7">
          <CurrentWeather weather={weather} units={units} onToggleUnit={handleUnitToggle} />
          <ForecastList forecast={weather.daily} units={units} />
          <HourlyChart hourly={weather.hourly} units={units} />
        </div>
      ) : null}
    </section>
  );
};

export default WeatherCard;
