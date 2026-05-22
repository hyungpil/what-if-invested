export default function MetricCard({ title, value, change, darkMode }) {
  return (
    <div
      className={`
        rounded-2xl p-4 shadow-lg border
        ${darkMode
          ? 'bg-slate-800 border-slate-700'
          : 'bg-white border-slate-200'
        }
      `}
    >
      <div className={`text-sm mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
        {title}
      </div>

      <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
        {value}
      </div>

      {change && (
        <div className={`mt-2 text-sm ${
          change.startsWith('+')
            ? 'text-green-500'
            : 'text-red-500'
        }`}>
          {change}
        </div>
      )}
    </div>
  )
}