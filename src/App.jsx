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
  const [searchResults, setSearchResults] = useState([])
  const [portfolioData, setPortfolioData] = useState({})

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
      const res = await fetch(`/.netlify/functions/search?q=${query}`)
      const json = await res.json()
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

        const final = data[data.length - 1]

        const returnPct =
          ((final.value / final.invested) - 1) * 100

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
        font: { color: darkMode ? '#ffffff' : '#111827' },

        legend: {
          orientation: 'h',
          y: -0.2,
          x: 0.5,
          xanchor: 'center'
        },

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
        },

        height: 600
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
          </div>

          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-3 rounded-xl bg-slate-800"
          >
            {darkMode ? <Sun /> : <Moon />}
          </button>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* LEFT */}
          <div className={`rounded-2xl p-6 border ${
            darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
          }`}>

            <div className="text-xl font-semibold mb-6">
              Configuration
            </div>

            <div className="space-y-4">

              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-3 border rounded-lg"
              />

              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-3 border rounded-lg"
              />

              <input
                type="number"
                value={monthlyInvestment}
                onChange={(e) =>
                  setMonthlyInvestment(Number(e.target.value))
                }
                className="w-full p-3 border rounded-lg"
              />

              <input
                type="text"
                placeholder="Search assets..."
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value)
                  searchYahoo(e.target.value)
                }}
                className="w-full p-3 border rounded-lg"
              />

              {/* SEARCH RESULTS */}
              {searchResults.length > 0 && (
                <div className="border rounded-lg max-h-48 overflow-auto">
                  {searchResults.map(item => {
                    const label = item.shortname || item.symbol

                    return (
                      <button
                        key={item.symbol}
                        className="w-full text-left p-2 hover:bg-slate-700"
                        onClick={() => {
                          if (!PREDEFINED_TICKERS[label]) {
                            PREDEFINED_TICKERS[label] = item.symbol
                          }

                          if (!selected.includes(label)) {
                            setSelected([...selected, label])
                          }

                          setSearchText('')
                          setSearchResults([])
                        }}
                      >
                        {label} ({item.symbol})
                      </button>
                    )
                  })}
                </div>
              )}

              {/* ✅ TICKER LIST (복구 핵심) */}
              <div className="mt-4 max-h-64 overflow-auto space-y-2">

                {filteredTickers.map(ticker => {
                  const checked = selected.includes(ticker)

                  return (
                    <label key={ticker} className="flex items-center gap-2">

                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          if (checked) {
                            setSelected(selected.filter(x => x !== ticker))
                          } else {
                            setSelected([...selected, ticker])
                          }
                        }}
                      />

                      <span>{ticker}</span>

                    </label>
                  )
                })}
              </div>

              <button
                onClick={runSimulation}
                className="w-full bg-blue-600 py-3 rounded-xl"
              >
                {loading ? 'Loading...' : 'Run Simulation'}
              </button>

            </div>
          </div>

          {/* RIGHT */}
          <div className="lg:col-span-3">

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">

              {metrics.map(m => (
                <MetricCard key={m.name} {...m} />
              ))}

            </div>

            <div className="rounded-2xl p-4 border bg-slate-800">
              <div ref={chartRef} />
            </div>

          </div>

        </div>

      </div>
    </div>
  )
}