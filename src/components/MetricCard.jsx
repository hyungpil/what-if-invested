export default function MetricCard({ title, value, change }) {
  return (
    <div className="bg-slate-800 rounded-2xl p-4 shadow-lg border border-slate-700">
      <div className="text-sm text-slate-400 mb-2">
        {title}
      </div>

      <div className="text-2xl font-bold">
        {value}
      </div>

      {change && (
        <div className={`mt-2 text-sm ${change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
          {change}
        </div>
      )}
    </div>
  )
}