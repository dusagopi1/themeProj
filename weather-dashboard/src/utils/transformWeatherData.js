const DAY_FORMATTER = new Intl.DateTimeFormat('en-US', { weekday: 'short' });
const HOUR_FORMATTER = new Intl.DateTimeFormat('en-US', { hour: 'numeric' });

const getWeatherIcon = (condition) => {
  const conditionLower = (condition || '').toLowerCase();
  const iconMap = {
    'sunny': '☀️',
    'clear': '☀️',
    'partly-cloudy': '⛅',
    'cloudy': '☁️',
    'overcast': '☁️',
    'rain': '🌧️',
    'snow': '❄️',
    'sleet': '🌨️',
    'hail': '🌨️',
    'thunderstorm': '⛈️',
    'wind': '💨',
  };

  for (const [key, icon] of Object.entries(iconMap)) {
    if (conditionLower.includes(key)) return icon;
  }
  return '🌤️';
};

const round = (value) => Math.round(Number(value));

const buildDailyForecast = (days, maxDays = 7) => {
  return (days || [])
    .slice(0, maxDays)
    .map((day, index) => {
      const date = new Date(day.datetime);
      return {
        id: day.datetime,
        day: DAY_FORMATTER.format(date),
        iconUrl: getWeatherIcon(day.icon),
        description: day.description || day.conditions || 'No data',
        high: round(day.tempmax || 0),
        low: round(day.tempmin || 0),
        isToday: index === 0,
      };
    });
};

const buildHourlyTemps = (hours, maxPoints = 10) => {
  return (hours || [])
    .slice(0, maxPoints)
    .map((hour) => {
      const timeStr = hour.datetime.substring(11, 16); // Extract HH:MM
      const [hourPart] = timeStr.split(':');
      const hourNum = parseInt(hourPart, 10);
      const period = hourNum >= 12 ? 'pm' : 'am';
      const displayHour = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;

      return {
        time: `${displayHour}${period}`,
        temperature: round(hour.temp || 0),
      };
    });
};

export const buildWeatherViewModel = (data) => {
  const currentDay = data.days?.[0] || {};
  const currentHour = currentDay.hours?.[0] || {};
  const daily = buildDailyForecast(data.days, 7);
  const hourly = buildHourlyTemps(currentDay.hours, 10);

  return {
    location: data.address || 'Unknown Location',
    condition: currentDay.description || currentDay.conditions || 'Weather data unavailable',
    iconUrl: getWeatherIcon(currentDay.icon),
    currentTemp: round(currentHour.temp || currentDay.temp || 0),
    feelsLike: round(currentHour.feelslike || currentDay.feelslikemax || 0),
    humidity: round(currentHour.humidity || currentDay.humidity || 0),
    windSpeed: round(currentHour.windspeed || currentDay.windspeed || 0),
    daily,
    hourly,
  };
};
