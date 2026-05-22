export default function MetricCard({ title, value, change }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
      
      <div className="text-slate-400 text-sm">
        {title}
      </div>

      <div className="text-xl font-bold mt-1 text-white">
        {value}
      </div>

      <div className="text-xs mt-2 text-slate-400">
        {change}
      </div>

    </div>
  )
}