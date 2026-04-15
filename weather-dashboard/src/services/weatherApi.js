const API_BASE_URL = 'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline';
const API_KEY = import.meta.env.VITE_VISUAL_CROSSING_API_KEY || 'YOUR_VISUAL_CROSSING_API_KEY';

const assertApiKeyPresent = () => {
  if (!API_KEY || API_KEY === 'YOUR_VISUAL_CROSSING_API_KEY') {
    throw new Error('Missing Visual Crossing API key. Set VITE_VISUAL_CROSSING_API_KEY in your .env file.');
  }
};

const fetchJson = async (url) => {
  const response = await fetch(url);

  if (!response.ok) {
    let detail = 'Unable to fetch weather data.';

    try {
      const payload = await response.json();
      detail = payload?.message || detail;
      if (response.status === 401) {
        detail = 'Invalid Visual Crossing API key. Check your key and try again.';
      }
    } catch {
      // Fallback to a generic message when the API payload is not JSON.
    }

    throw new Error(detail);
  }

  return response.json();
};

export const fetchWeatherBundle = async (lat, lon, units = 'metric') => {
  assertApiKeyPresent();
  const unitGroup = units === 'metric' ? 'metric' : 'us';
  const endpoint = `${API_BASE_URL}/${lat},${lon}?key=${API_KEY}&include=current,hours,days&unitGroup=${unitGroup}`;
  return fetchJson(endpoint);
};
