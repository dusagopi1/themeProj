const ErrorState = ({ message, onRetry }) => {
  return (
    <div className="glass-card rounded-[2rem] p-8 text-center sm:p-10">
      <p className="text-sm uppercase tracking-[0.2em] text-rose-300">Weather Unavailable</p>
      <h2 className="mt-3 text-2xl font-semibold text-white">We could not load your weather right now</h2>
      <p className="mx-auto mt-3 max-w-xl text-slate-300">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-6 rounded-full bg-cyan-300 px-6 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-cyan-200"
      >
        Try Again
      </button>
    </div>
  );
};

export default ErrorState;
