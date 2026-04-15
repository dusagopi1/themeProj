const daySlots = Array.from({ length: 7 });

const LoadingSkeleton = () => {
  return (
    <div className="glass-card rounded-[2rem] p-6 sm:p-8 lg:p-10 animate-pulse">
      <div className="h-6 w-36 rounded-full bg-slate-700/70" />
      <div className="mt-4 h-10 w-64 rounded-xl bg-slate-700/70" />
      <div className="mt-6 h-20 w-52 rounded-2xl bg-slate-700/70" />

      <div className="mt-8 flex gap-3 overflow-hidden">
        {daySlots.map((_, index) => (
          <div key={index} className="h-28 min-w-[120px] rounded-2xl bg-slate-800/70" />
        ))}
      </div>

      <div className="mt-8 h-64 rounded-3xl bg-slate-800/70" />
    </div>
  );
};

export default LoadingSkeleton;
