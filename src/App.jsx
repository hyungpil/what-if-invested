import { useEffect, useMemo, useRef, useState } from 'react'
import Plotly from 'plotly.js-dist'

import { PREDEFINED_TICKERS } from './tickers'
import { fetchYahooData } from './api'
import { calculatePortfolio } from './calculator'
import MetricCard from './components/MetricCard'

import { Moon, Sun } from 'lucide-react'

export default function App() {
  const today = new Date().toISOString().slice(0, 10)

  const chartRef = useRef(null)

  const [darkMode, setDarkMode] = useState(true)
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
    if (!query) {
      setSearchResults([])
      return
    }

    try {
      const response = await fetch(`/.netlify/functions/search?q=${query}`)
      const json = await response.json()
      setSearchResults(json.quotes?.slice(0, 10) || [])
    } catch (err) {
      console.error(err)
    }
  }

  async function runSimulation() {
    setLoading(true)

    try {
      const results = {}

      const res = await fetch(
        `/.netlify/functions/exchangeRate?start=${startDate}&end=${endDate}`
      )

      const exchangeRateMap = await res.json()

      for (const name of selected) {
        const symbol = PREDEFINED_TICKERS[name]

        const raw = await fetchYahooData(
          symbol,
          startDate,
          endDate
        )

        results[name] = calculatePortfolio(
          raw,
          monthlyInvestment,
          exchangeRateMap
        )
      }

      setPortfolioData(results)
    } catch (err) {
      console.error(err)
      alert(err.message)
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

  const metrics = useMemo(() => {
    return Object.entries(portfolioData)
      .map(([name, data]) => {
        if (!data.length) return null

        const final = data[data.length - 1]

        const returnPct = (
          ((final.value / final.invested) - 1) * 100
        ).toFixed(1)

        return {
          name,
          invested: final.invested,
          value: final.value,
          returnPct
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
        title: 'Portfolio Value Over Time',
        paper_bgcolor: darkMode ? '#1e293b' : '#ffffff',
        plot_bgcolor: darkMode ? '#1e293b' : '#ffffff',
        font: {
          color: darkMode ? '#ffffff' : '#111827'
        },
        legend: {
          orientation: 'h',
          y: -0.2,
          x: 0.5,
          xanchor: 'center'
        },
        height: 600,
        xaxis: {
          gridcolor: darkMode ? '#334155' : '#e5e7eb'
        },
        yaxis: {
          gridcolor: darkMode ? '#334155' : '#e5e7eb'
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
  }, [chartData, darkMode])

  return (
    <div className={darkMode ? 'bg-slate-900 text-white min-h-screen' : 'bg-white text-slate-900 min-h-screen'}>

      <div className="max-w-7xl mx-auto p-6">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">

          <div>
            <h1 className="text-4xl font-bold mb-2">
              💰 Investment Tracker
            </h1>

            <p className="text-slate-400">
              What if invested at that time
            </p>

            <p className="text-slate-500 text-sm mt-2">
              • Monthly $100 investment on last trading day<br/>
              • KR stocks converted using FX rate
            </p>
          </div>

          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-3 rounded-xl bg-slate-800"
          >
            {darkMode ? <Sun /> : <Moon />}
          </button>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* LEFT PANEL */}
          <div className={`rounded-2xl p-6 border ${
            darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
          }`}>

            <div className="text-xl font-semibold mb-6">
              Configuration
            </div>

            <div className="space-y-5">

              {/* START DATE */}
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`w-full p-3 border rounded-lg ${
                  darkMode
                    ? 'bg-slate-900 border-slate-600 text-white'
                    : 'bg-white border-slate-300 text-black'
                }`}
              />

              {/* END DATE */}
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={`w-full p-3 border rounded-lg ${
                  darkMode
                    ? 'bg-slate-900 border-slate-600 text-white'
                    : 'bg-white border-slate-300 text-black'
                }`}
              />

              {/* INVESTMENT */}
              <input
                type="number"
                value={monthlyInvestment}
                onChange={(e) =>
                  setMonthlyInvestment(Number(e.target.value))
                }
                className={`w-full p-3 border rounded-lg ${
                  darkMode
                    ? 'bg-slate-900 border-slate-600 text-white'
                    : 'bg-white border-slate-300 text-black'
                }`}
              />

              {/* SEARCH */}
              <input
                type="text"
                placeholder="Search Yahoo Finance..."
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value)
                  searchYahoo(e.target.value)
                }}
                className={`w-full p-3 border rounded-lg ${
                  darkMode
                    ? 'bg-slate-900 border-slate-600 text-white'
                    : 'bg-white border-slate-300 text-black'
                }`}
              />

              <button
                onClick={runSimulation}
                className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-semibold"
              >
                {loading ? 'Loading...' : 'Run Simulation'}
              </button>

            </div>
          </div>

          {/* RIGHT */}
          <div className="lg:col-span-3">

            {/* METRICS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {metrics.map((m) => (
                <MetricCard key={m.name} {...m} darkMode={darkMode} />
              ))}
            </div>

            {/* CHART */}
            <div className={`rounded-2xl p-4 border ${
              darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
            }`}>
              <div ref={chartRef} />
            </div>

          </div>

        </div>
      </div>
    </div>
  )
}