const ForecastList = ({ forecast, units }) => {
  return (
    <section className="enter-slide space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">7-Day Forecast</h2>
        <span className="text-xs uppercase tracking-[0.14em] text-slate-400">High / Low ({units === 'metric' ? 'C' : 'F'})</span>
      </div>

      <div className="scrollbar-thin flex gap-3 overflow-x-auto pb-1">
        {forecast.map((day) => (
          <article
            key={day.id}
            className={`min-w-[120px] flex-1 rounded-2xl border p-3 transition hover:-translate-y-0.5 ${
              day.isToday
                ? 'border-cyan-300/45 bg-cyan-300/15 shadow-[0_0_0_1px_rgba(103,232,249,0.2)]'
                : 'border-white/10 bg-slate-900/30'
            }`}
          >
            <p className="text-sm font-semibold text-white">{day.day}</p>
            <img src={day.iconUrl} alt={day.description} className="my-2 h-10 w-10" />
            <p className="text-sm text-slate-200 capitalize">{day.description}</p>
            <p className="mt-2 text-sm font-semibold text-slate-100">{day.high}° / <span className="text-slate-400">{day.low}°</span></p>
          </article>
        ))}
      </div>
    </section>
  );
};

export default ForecastList;
