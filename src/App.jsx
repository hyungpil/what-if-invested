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

  // -----------------------------
  // Yahoo search (Netlify function)
  // -----------------------------
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

  // -----------------------------
  // Simulation
  // -----------------------------
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

  // -----------------------------
  // Chart data
  // -----------------------------
  const chartData = useMemo(() => {
    return Object.entries(portfolioData).map(([name, data]) => ({
      x: data.map(d => d.date),
      y: data.map(d => d.value),
      type: 'scatter',
      mode: 'lines',
      name
    }))
  }, [portfolioData])

  // -----------------------------
  // Metrics (FIX: ticker + font issue)
  // -----------------------------
  const metrics = useMemo(() => {
    return Object.entries(portfolioData).map(([name, data]) => {
      if (!data?.length) return null

      const last = data[data.length - 1]

      const returnPct =
        ((last.value / last.invested) - 1) * 100

      return {
        name,
        value: last.value,
        invested: last.invested,
        returnPct
      }
    }).filter(Boolean)
  }, [portfolioData])

  // -----------------------------
  // Plotly render (dark only)
  // -----------------------------
  useEffect(() => {
    if (!chartRef.current) return

    Plotly.newPlot(
      chartRef.current,
      chartData,
      {
        title: 'Portfolio Value Over Time',
        paper_bgcolor: '#0f172a',
        plot_bgcolor: '#0f172a',

        legend: {
          orientation: 'h',
          y: -0.2,
          x: 0.5,
          xanchor: 'center',
          font: { color: '#fff' }
        },

        font: {
          color: '#fff'
        },

        height: 600,

        xaxis: {
          gridcolor: '#1f2937',
          color: '#fff'
        },

        yaxis: {
          gridcolor: '#1f2937',
          color: '#fff'
        },

        margin: {
          t: 50,
          l: 50,
          r: 30,
          b: 100
        }
      },
      { responsive: true }
    )
  }, [chartData])

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <div className="bg-slate-950 text-white min-h-screen">
      <div className="max-w-7xl mx-auto p-6">

        {/* HEADER */}
        <div className="flex justify-between items-start mb-8">

          <div>
            <h1 className="text-4xl font-bold mb-2">
              💰 Investment Tracker
            </h1>

            {/* 복원된 설명 */}
            <p className="text-slate-400 text-sm">
              What if you invested $100 monthly on the last trading day?
            </p>
            <p className="text-slate-500 text-xs mt-2">
              Korean stocks are converted using FX rate at each investment date.
            </p>
          </div>

          <button
            className="p-3 rounded-xl bg-slate-800"
          >
            <Moon />
          </button>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* LEFT PANEL */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

            <div className="text-lg font-semibold mb-4">
              Configuration
            </div>

            <div className="space-y-4">

              {/* DATE */}
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-800 p-2 rounded"
              />

              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-800 p-2 rounded"
              />

              {/* AMOUNT */}
              <input
                type="number"
                value={monthlyInvestment}
                onChange={(e) =>
                  setMonthlyInvestment(Number(e.target.value))
                }
                className="w-full bg-slate-800 p-2 rounded"
              />

              {/* SEARCH */}
              <input
                placeholder="Search assets..."
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value)
                  searchYahoo(e.target.value)
                }}
                className="w-full bg-slate-800 p-2 rounded"
              />

              {/* SEARCH RESULTS */}
              {searchResults.length > 0 && (
                <div className="bg-slate-800 rounded p-2 max-h-40 overflow-auto">
                  {searchResults.map((item) => (
                    <button
                      key={item.symbol}
                      className="block w-full text-left p-2 hover:bg-slate-700"
                      onClick={() => {
                        const label = item.shortname || item.symbol

                        if (!selected.includes(label)) {
                          setSelected([...selected, label])
                        }

                        setSearchResults([])
                        setSearchText('')
                      }}
                    >
                      <div className="text-sm font-medium">
                        {item.shortname || item.symbol}
                      </div>
                      <div className="text-xs text-slate-400">
                        {item.symbol}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* TICKERS (복구 핵심) */}
              <div className="mt-4 space-y-2">
                {Object.keys(PREDEFINED_TICKERS).map((t) => (
                  <label key={t} className="flex gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selected.includes(t)}
                      onChange={() => {
                        if (selected.includes(t)) {
                          setSelected(selected.filter(x => x !== t))
                        } else {
                          setSelected([...selected, t])
                        }
                      }}
                    />
                    {t}
                  </label>
                ))}
              </div>

              <button
                onClick={runSimulation}
                className="w-full bg-blue-600 p-2 rounded mt-4"
              >
                {loading ? 'Loading...' : 'Run Simulation'}
              </button>

            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="lg:col-span-3">

            {/* METRICS (ticker 정상 표시) */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {metrics.map((m) => (
                <MetricCard
                  key={m.name}
                  title={m.name}
                  value={`$${m.value.toFixed(0)}`}
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