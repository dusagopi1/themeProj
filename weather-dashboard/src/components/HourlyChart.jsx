import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const tooltipStyle = {
  background: 'rgba(8, 18, 32, 0.88)',
  border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: '12px',
  color: '#f8fafc',
};

const HourlyChart = ({ hourly, units }) => {
  return (
    <section className="enter-fade space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Hourly Temperature</h2>
        <span className="text-xs uppercase tracking-[0.14em] text-slate-400">Next 30 Hours</span>
      </div>

      <div className="h-72 rounded-3xl border border-white/10 bg-slate-950/40 p-4 sm:p-6">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={hourly} margin={{ top: 12, right: 8, left: -16, bottom: 8 }}>
            <defs>
              <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#67e8f9" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.15} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" vertical={false} />
            <XAxis
              dataKey="time"
              tick={{ fill: '#cbd5e1', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `${value}°`}
            />
            <Tooltip
              formatter={(value) => [`${value}° ${units === 'metric' ? 'C' : 'F'}`, 'Temp']}
              contentStyle={tooltipStyle}
              cursor={{ stroke: 'rgba(103,232,249,0.4)', strokeWidth: 1 }}
            />
            <Line
              type="monotone"
              dataKey="temperature"
              stroke="url(#tempGradient)"
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 1, fill: '#c4f1ff', stroke: '#164e63' }}
              activeDot={{ r: 6, fill: '#a5f3fc', stroke: '#0f172a', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};

export default HourlyChart;
