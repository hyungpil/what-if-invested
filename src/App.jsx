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
      JSON.stringify({
        selected,
        monthlyInvestment
      })
    )
  }, [selected, monthlyInvestment])

  async function searchYahoo(query) {

    if (!query) {
      setSearchResults([])
      return
    }

    try {

      const response = await fetch(
        `/.netlify/functions/search?q=${query}`
      )

      const json = await response.json()

      setSearchResults(
        json.quotes?.slice(0, 10) || []
      )

    } catch (err) {
      console.error(err)
    }
  }

  async function runSimulation() {
    setLoading(true)

    try {
      const results = {}

      // 1) 환율 데이터 먼저 가져오기 (Netlify Function)
      const res = await fetch(
        `/.netlify/functions/exchangeRate?start=${startDate}&end=${endDate}`
      )

      const exchangeRateMap = await res.json()

      // 2) 자산별 시뮬레이션
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
    const traces = []

    Object.entries(portfolioData).forEach(([name, data]) => {
      traces.push({
        x: data.map(d => d.date),
        y: data.map(d => d.value),
        type: 'scatter',
        mode: 'lines',
        name
      })
    })

    return traces
  }, [portfolioData])

  const filteredTickers = Object.keys(
    PREDEFINED_TICKERS
  ).filter((ticker) =>
    ticker.toLowerCase().includes(
      searchText.toLowerCase()
    )
  )

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
        paper_bgcolor: '#1e293b',
        plot_bgcolor: '#1e293b',
        legend: {
          orientation: 'h',
          y: -0.2,
          x: 0.5,
          xanchor: 'center'
        },
        font: {
          color: '#ffffff'
        },
        height: 600,
        xaxis: {
          gridcolor: '#334155'
        },
        yaxis: {
          gridcolor: '#334155'
        },
        margin: {
          t: 50,
          l: 50,
          r: 30,
          b: 100
        }
      },
      {
        responsive: true
      }
    )
  }, [chartData])

  return (
    <div className={`${darkMode ? 'bg-slate-900 text-white' : 'bg-white text-black'} min-h-screen`}>

      <div className="max-w-7xl mx-auto p-6">

        <div className="flex justify-between items-center mb-8">

          <div>
            <h1 className="text-4xl font-bold mb-2">
              💰 Investment Tracker
            </h1>

            <p className="text-slate-400">
              What if invested at that time
            </p>

            <p className="text-slate-500 text-sm mt-2 leading-relaxed">
              • Monthly $100 investment on the last trading day of each month<br/>
              • Korean stocks are converted to USD using the exchange rate at that time
            </p>
          </div>

          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-3 rounded-xl bg-slate-800"
          >
            {darkMode ? <Sun /> : <Moon />}
          </button>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">

          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">

            <div className="text-xl font-semibold mb-6">
              Configuration
            </div>

            <div className="space-y-5">

              <div>
                <label className="block mb-2 text-sm text-slate-400">
                  Start Date
                </label>

                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm text-slate-400">
                  End Date
                </label>

                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm text-slate-400">
                  Monthly Investment ($)
                </label>

                <input
                  type="number"
                  value={monthlyInvestment}
                  onChange={(e) =>
                    setMonthlyInvestment(Number(e.target.value))
                  }
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm text-slate-400">
                  Assets
                </label>

                <input
                  type="text"
                  placeholder="Search Yahoo Finance..."
                  value={searchText}
                  onChange={(e) => {

                    setSearchText(e.target.value)

                    searchYahoo(e.target.value)
                  }}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 mb-3"
                />

                {searchResults.length > 0 && (
                  <div className="mb-4 max-h-48 overflow-auto border border-slate-700 rounded-lg">

                    {searchResults.map((item) => {

                      const label =
                        item.shortname || item.symbol

                      return (
                        <button
                          key={item.symbol}
                          onClick={() => {

                            if (!PREDEFINED_TICKERS[label]) {
                              PREDEFINED_TICKERS[label] =
                                item.symbol
                            }

                            if (!selected.includes(label)) {
                              setSelected([
                                ...selected,
                                label
                              ])
                            }

                            setSearchText('')
                            setSearchResults([])
                          }}
                          className="w-full text-left p-3 hover:bg-slate-700 border-b border-slate-800"
                        >

                          <div className="font-medium">
                            {label}
                          </div>

                          <div className="text-xs text-slate-400">
                            {item.symbol}
                          </div>

                        </button>
                      )
                    })}
                  </div>
                )}

                <div className="space-y-2 max-h-72 overflow-auto">

                  {filteredTickers.map((ticker) => {
                    const checked = selected.includes(ticker)

                    return (
                      <label
                        key={ticker}
                        className="flex items-center gap-3"
                      >

                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            if (checked) {
                              setSelected(
                                selected.filter(x => x !== ticker)
                              )
                            } else {
                              setSelected([
                                ...selected,
                                ticker
                              ])
                            }
                          }}
                        />

                        <span className="text-sm">
                          {ticker}
                        </span>

                      </label>
                    )
                  })}

                </div>
              </div>

              <button
                onClick={runSimulation}
                className="w-full bg-blue-600 hover:bg-blue-700 transition rounded-xl py-3 font-semibold"
              >
                {loading ? 'Loading...' : 'Run Simulation'}
              </button>

            </div>

          </div>

          <div className="lg:col-span-3">

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">

              {metrics.map((metric) => (
                <MetricCard
                  key={metric.name}
                  title={metric.name}
                  value={`$${metric.value.toFixed(0)}`}
                  change={`${metric.returnPct > 0 ? '+' : ''}${metric.returnPct}%`}
                />
              ))}

            </div>

            <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">

              <div
                ref={chartRef}
                className="w-full"
              />

            </div>

          </div>

        </div>

      </div>

    </div>
  )
}