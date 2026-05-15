import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#e8e8e8] rounded-xl px-3 py-2 shadow-lg text-[12px]">
      <p className="text-[#888] mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="font-semibold text-[#0f0f0f]">{p.name}: <span style={{ color: p.color }}>{p.value}</span></p>
      ))}
    </div>
  );
};

export function AreaChartWidget({ data, dataKey, color = "#db4035", height = 160 }: {
  data: any[]; dataKey: string; color?: string; height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
        <defs>
          <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.15} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#bbb" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#bbb" }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fill={`url(#grad-${dataKey})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function BarChartWidget({ data, dataKey, color = "#db4035", height = 160 }: {
  data: any[]; dataKey: string; color?: string; height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#bbb" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#bbb" }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} maxBarSize={32} />
      </BarChart>
    </ResponsiveContainer>
  );
}
