# Weather Dashboard (React + Tailwind)

A premium-style weather dashboard inspired by modern weather cards with:

- Dark glassmorphism UI and soft gradients
- Auto geolocation and real-time weather
- 7-day forecast strip (based on OpenWeatherMap forecast data)
- Smooth hourly temperature line chart (Recharts)
- Unit toggle (C/F), loading skeleton, and robust error handling

## Tech Stack

- React + Vite
- Tailwind CSS (v4 via Vite plugin)
- Recharts
- OpenWeatherMap API (`/weather` and `/forecast`)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a local env file:

```bash
cp .env.example .env
```

3. Add your OpenWeatherMap key to `.env`:

```env
VITE_OPENWEATHER_API_KEY=YOUR_OPENWEATHERMAP_API_KEY
```

## Run

```bash
npm run dev
```

Vite will print the local URL (usually `http://localhost:5173`).

## Build

```bash
npm run build
```

## Notes

- Geolocation permission is required for location-aware weather.
- If geolocation is denied, the UI shows an actionable error state.
- OpenWeatherMap 5-day/3-hour data is transformed into a daily strip and hourly chart.
