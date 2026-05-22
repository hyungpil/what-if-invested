import { useEffect, useMemo, useRef, useState } from 'react'
import Plotly from 'plotly.js-dist'

import { PREDEFINED_TICKERS } from './tickers'
import { fetchYahooData } from './api'
import { calculatePortfolio } from './calculator'
import MetricCard from './components/MetricCard'

import { Moon } from 'lucide-react'

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
  const [searchResults, setSearchResults] = useState([])
  const [portfolioData, setPortfolioData] = useState({})

  // -----------------------
  // SEARCH
  // -----------------------
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

  // -----------------------
  // SIMULATION
  // -----------------------
  async function runSimulation() {
    setLoading(true)

    try {
      const results = {}

      for (const name of selected) {
        const symbol = PREDEFINED_TICKERS[name]

        const raw = await fetchYahooData(symbol, startDate, endDate)

        results[name] = calculatePortfolio(
          raw,
          monthlyInvestment
        )
      }

      setPortfolioData(results)
    } catch (e) {
      console.error(e)
      alert(e.message)
    }

    setLoading(false)
  }

  useEffect(() => {
    runSimulation()
  }, [])

  // -----------------------
  // CHART
  // -----------------------
  const chartData = useMemo(() => {
    return Object.entries(portfolioData).map(([name, data]) => ({
      x: data.map(d => d.date),
      y: data.map(d => d.value),
      type: 'scatter',
      mode: 'lines',
      name
    }))
  }, [portfolioData])

  // -----------------------
  // METRICS
  // -----------------------
  const metrics = useMemo(() => {
    return Object.entries(portfolioData)
      .map(([name, data]) => {
        if (!data?.length) return null

        const last = data[data.length - 1]

        const returnPct =
          ((last.value / last.invested) - 1) * 100

        return {
          name,
          value: last.value,
          returnPct
        }
      })
      .filter(Boolean)
  }, [portfolioData])

  // -----------------------
  // PLOTLY
  // -----------------------
  useEffect(() => {
    if (!chartRef.current) return

    Plotly.newPlot(
      chartRef.current,
      chartData,
      {
        paper_bgcolor: '#0f172a',
        plot_bgcolor: '#0f172a',

        legend: {
          orientation: 'h',
          y: -0.2,
          x: 0.5,
          xanchor: 'center',
          font: { color: '#fff' }
        },

        font: { color: '#fff' },

        height: 600,

        xaxis: { gridcolor: '#1f2937' },
        yaxis: { gridcolor: '#1f2937' },

        margin: { t: 50, l: 50, r: 30, b: 100 }
      },
      { responsive: true }
    )
  }, [chartData])

  // -----------------------
  // UI
  // -----------------------
  return (
    <div className="bg-slate-950 text-white min-h-screen">

      <div className="max-w-7xl mx-auto p-6">

        {/* HEADER */}
        <div className="flex justify-between mb-8">

          <div>
            <h1 className="text-4xl font-bold mb-2">
              💰 Investment Tracker
            </h1>

            <p className="text-slate-400">
              What if invested at that time
            </p>

            <p className="text-slate-500 text-sm mt-2">
              • Monthly $100 investment on last trading day<br/>
              • FX adjusted for Korean stocks
            </p>
          </div>

          <button className="p-3 bg-slate-800 rounded-xl">
            <Moon />
          </button>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* LEFT */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

            <div className="space-y-4">

              {/* DATE INPUT (CUSTOM ICON OVERLAY) */}
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-800 p-2 pr-10 rounded text-white"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white">
                  📅
                </div>
              </div>

              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-slate-800 p-2 pr-10 rounded text-white"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white">
                  📅
                </div>
              </div>

              {/* INVEST */}
              <input
                type="number"
                value={monthlyInvestment}
                onChange={(e) =>
                  setMonthlyInvestment(Number(e.target.value))
                }
                className="w-full bg-slate-800 p-2 rounded text-white"
              />

              {/* SEARCH */}
              <input
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value)
                  searchYahoo(e.target.value)
                }}
                className="w-full bg-slate-800 p-2 rounded text-white"
                placeholder="Search assets..."
              />

              {/* RESULTS */}
              {searchResults.length > 0 && (
                <div className="bg-slate-800 rounded p-2 max-h-40 overflow-auto">
                  {searchResults.map(item => (
                    <button
                      key={item.symbol}
                      onClick={() => {
                        const label = item.shortname || item.symbol

                        if (!selected.includes(label)) {
                          setSelected([...selected, label])
                        }

                        setSearchResults([])
                        setSearchText('')
                      }}
                      className="block w-full text-left p-2 hover:bg-slate-700"
                    >
                      {item.shortname || item.symbol}
                    </button>
                  ))}
                </div>
              )}

              {/* TICKERS (LIMITED) */}
              <div className="space-y-2 max-h-64 overflow-auto">
                {Object.keys(PREDEFINED_TICKERS)
                  .slice(0, 8)
                  .map(t => (
                    <label key={t} className="flex gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selected.includes(t)}
                        onChange={() => {
                          setSelected(prev =>
                            prev.includes(t)
                              ? prev.filter(x => x !== t)
                              : [...prev, t]
                          )
                        }}
                      />
                      {t}
                    </label>
                  ))}
              </div>

              <button
                onClick={runSimulation}
                className="w-full bg-blue-600 p-2 rounded"
              >
                {loading ? 'Loading...' : 'Run Simulation'}
              </button>

            </div>
          </div>

          {/* RIGHT */}
          <div className="lg:col-span-3">

            {/* METRICS */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {metrics.map(m => (
                <MetricCard
                  key={m.name}
                  title={m.name}
                  value={`$${Math.round(m.value).toLocaleString()}`}
                  change={`${m.returnPct.toFixed(2)}%`}
                />
              ))}
            </div>

            {/* CHART */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div ref={chartRef} />
            </div>

          </div>

        </div>
      </div>
    </div>
  )
}