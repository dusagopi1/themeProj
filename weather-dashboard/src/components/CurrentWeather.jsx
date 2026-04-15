const UnitToggle = ({ units, onToggle }) => {
  return (
    <div className="inline-flex rounded-full border border-white/20 bg-slate-950/35 p-1">
      <button
        type="button"
        onClick={() => onToggle('metric')}
        className={`rounded-full px-3 py-1 text-xs font-semibold tracking-wide transition ${
          units === 'metric' ? 'bg-cyan-300 text-slate-900' : 'text-slate-200 hover:bg-white/10'
        }`}
      >
        C
      </button>
      <button
        type="button"
        onClick={() => onToggle('imperial')}
        className={`rounded-full px-3 py-1 text-xs font-semibold tracking-wide transition ${
          units === 'imperial' ? 'bg-cyan-300 text-slate-900' : 'text-slate-200 hover:bg-white/10'
        }`}
      >
        F
      </button>
    </div>
  );
};

const CurrentWeather = ({ weather, units, onToggleUnit }) => {
  const speedLabel = units === 'metric' ? 'm/s' : 'mph';

  return (
    <section className="enter-fade flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-300/80">Current Location</p>
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">{weather.location}</h1>
        <div className="flex items-start gap-3 sm:gap-4">
          <img src={weather.iconUrl} alt={weather.condition} className="h-20 w-20 object-contain" />
          <div>
            <p className="text-7xl font-semibold leading-none text-white sm:text-8xl">{weather.currentTemp}°</p>
            <p className="mt-1 text-base text-slate-300 capitalize">{weather.condition}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-3xl border border-white/12 bg-slate-900/35 p-5 backdrop-blur-sm md:min-w-52">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium uppercase tracking-[0.15em] text-slate-300/80">Units</p>
          <UnitToggle units={units} onToggle={onToggleUnit} />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm text-slate-200">
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Feels Like</p>
            <p className="mt-1 text-lg font-semibold">{weather.feelsLike}°</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Humidity</p>
            <p className="mt-1 text-lg font-semibold">{weather.humidity}%</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Wind</p>
            <p className="mt-1 text-lg font-semibold">{weather.windSpeed} {speedLabel}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CurrentWeather;
