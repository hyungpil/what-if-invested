import { useEffect, useMemo, useRef, useState } from 'react'
import Plotly from 'plotly.js-dist'

import { PREDEFINED_TICKERS } from './tickers'
import { fetchYahooData } from './api'
import { calculatePortfolio } from './calculator'
import MetricCard from './components/MetricCard'

export default function App() {
  const today = new Date().toISOString().slice(0, 10)
  const chartRef = useRef(null)

  const [loading, setLoading] = useState(false)

  const [startDate, setStartDate] = useState('2025-01-01')
  const [endDate, setEndDate] = useState(today)
  const [monthlyInvestment, setMonthlyInvestment] = useState(100)

  const [selected, setSelected] = useState([
    'S&P 500',
    'NASDAQ 100',
    'Samsung Electronics',
    'SK Hynix',
    'KOSPI',
    'KOSDAQ'
  ])

  const [searchText, setSearchText] = useState('')
  const [portfolioData, setPortfolioData] = useState([])
  const [searchResults, setSearchResults] = useState([])

  useEffect(() => {
    const saved = localStorage.getItem('investment-settings')
    if (saved) {
      const parsed = JSON.parse(saved)
      setSelected(parsed.selected || [])
      setMonthlyInvestment(parsed.monthlyInvestment || 100)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(
      'investment-settings',
      JSON.stringify({ selected, monthlyInvestment })
    )
  }, [selected, monthlyInvestment])

  async function searchYahoo(query) {
    if (!query) return setSearchResults([])

    try {
      const res = await fetch(`/.netlify/functions/search?q=${query}`)
      const json = await res.json()
      setSearchResults(json.quotes?.slice(0, 10) || [])
    } catch (e) {
      console.error(e)
    }
  }

  async function runSimulation() {
    setLoading(true)

    try {
      const results = {}

      for (const name of selected) {
        const symbol = PREDEFINED_TICKERS[name]

        const raw = await fetchYahooData(
          symbol,
          startDate,
          endDate
        )

        results[name] = calculatePortfolio(
          raw,
          monthlyInvestment
        )
      }

      setPortfolioData(results)
    } catch (e) {
      console.error(e)
    }

    setLoading(false)
  }

  useEffect(() => {
    runSimulation()
  }, [])

  const chartData = useMemo(() => {
    return Object.entries(portfolioData).map(([name, data]) => ({
      x: data.map(d => d.date),
      y: data.map(d => d.value),
      type: 'scatter',
      mode: 'lines',
      name
    }))
  }, [portfolioData])

  const filteredTickers = Object.keys(PREDEFINED_TICKERS).filter(t =>
    t.toLowerCase().includes(searchText.toLowerCase())
  )

  const metrics = useMemo(() => {
    return Object.entries(portfolioData)
      .map(([name, data]) => {
        if (!data.length) return null

        const last = data[data.length - 1]

        return {
          name,
          invested: last.invested,
          value: last.value,
          returnPct: (((last.value / last.invested) - 1) * 100).toFixed(1)
        }
      })
      .filter(Boolean)
  }, [portfolioData])

  useEffect(() => {
    if (!chartRef.current) return

    Plotly.newPlot(
      chartRef.current,
      chartData,
      {
        paper_bgcolor: '#0f172a',
        plot_bgcolor: '#0f172a',
        font: { color: '#fff' },
        legend: {
          orientation: 'h',
          x: 0,
          y: -0.25,
          xanchor: 'left',
          font: { size: 12, color: '#fff' }
        },
        xaxis: { gridcolor: '#1e293b' },
        yaxis: { gridcolor: '#1e293b' },
        margin: { t: 30, l: 40, r: 20, b: 80 }
      },
      { responsive: true }
    )
  }, [chartData])

  return (
    <div className="bg-slate-900 text-white min-h-screen">
      <div className="max-w-7xl mx-auto p-6">

        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            💰 Investment Tracker
          </h1>

          <p className="text-slate-400">
            What if invested at that time
          </p>

          <p className="text-slate-500 text-sm mt-2">
            • Korean stocks are converted to USD using the exchange rate at that time
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* LEFT */}
          <div className="bg-slate-800 rounded-2xl p-6">

            <div className="text-lg font-semibold mb-4">
              Configuration
            </div>

            <div className="space-y-4">

              {/* START DATE */}
              <div>
                <div className="text-xs text-slate-400 mb-1">
                  Start Date
                </div>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full bg-slate-900 p-3 rounded-lg text-white"
                />
              </div>

              {/* END DATE */}
              <div>
                <div className="text-xs text-slate-400 mb-1">
                  End Date
                </div>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full bg-slate-900 p-3 rounded-lg text-white"
                />
              </div>

              {/* MONTHLY INVESTMENT */}
              <div>
                <div className="text-xs text-slate-400 mb-1">
                  Monthly Investment ($)
                </div>
                <input
                  type="number"
                  value={monthlyInvestment}
                  onChange={e =>
                    setMonthlyInvestment(Number(e.target.value))
                  }
                  className="w-full bg-slate-900 p-3 rounded-lg text-white"
                />
              </div>

              {/* ASSETS SEARCH */}
              <div>
                <div className="text-xs text-slate-400 mb-1">
                  Assets
                </div>

                <input
                  placeholder="Search assets..."
                  value={searchText}
                  onChange={e => {
                    setSearchText(e.target.value)
                    searchYahoo(e.target.value)
                  }}
                  className="w-full bg-slate-900 p-3 rounded-lg text-white"
                />

                {searchResults.length > 0 && (
                  <div className="bg-slate-900 rounded-lg max-h-40 overflow-auto mt-2 border border-slate-700">
                    {searchResults.map(item => (
                      <button
                        key={item.symbol}
                        onClick={() => {
                          const label = item.shortname || item.symbol

                          if (!selected.includes(label)) {
                            setSelected([...selected, label])
                          }

                          setSearchText('')
                          setSearchResults([])
                        }}
                        className="w-full text-left p-2 hover:bg-slate-700 text-sm"
                      >
                        <div className="text-white">{label}</div>
                        <div className="text-xs text-slate-400">
                          {item.symbol}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* TICKER LIST (FULL + SCROLL) */}
              <div>
                <div className="text-xs text-slate-400 mb-2">
                  Assets List
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
                  {Object.keys(PREDEFINED_TICKERS).map(t => {
                    const checked = selected.includes(t)

                    return (
                      <label
                        key={t}
                        className="flex gap-2 text-sm items-center"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            setSelected(prev =>
                              prev.includes(t)
                                ? prev.filter(x => x !== t)
                                : [...prev, t]
                            )
                          }}
                        />
                        <span className="text-slate-200">{t}</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* RUN BUTTON */}
              <button
                onClick={runSimulation}
                className="w-full bg-blue-600 p-3 rounded-xl mt-4 font-semibold"
              >
                {loading ? 'Loading...' : 'Run Simulation'}
              </button>

            </div>
          </div>

          {/* RIGHT */}
          <div className="lg:col-span-3">

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
              {metrics.map(m => (
                <MetricCard
                  key={m.name}
                  title={m.name}
                  value={`$${Number(m.value).toLocaleString()}`}
                  change={`${m.returnPct > 0 ? '+' : ''}${m.returnPct}%`}
                />
              ))}
            </div>

            <div className="bg-slate-800 rounded-2xl p-4">
              <div ref={chartRef} />
            </div>

          </div>

        </div>
      </div>
    </div>
  )
}