export default function MetricCard({ title, value, change }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
      <div className="text-slate-400 text-sm">{title}</div>

      <div className="text-xl font-semibold mt-1">
        {value}
      </div>

      <div className="text-sm mt-2 text-slate-300">
        {change}
      </div>
    </div>
  )
}