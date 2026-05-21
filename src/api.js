export async function fetchYahooData(
  symbol,
  startDate,
  endDate
) {
  const period1 = Math.floor(
    new Date(startDate).getTime() / 1000
  )

  const period2 = Math.floor(
    new Date(endDate).getTime() / 1000
  )

  const url =
    `/.netlify/functions/yahoo` +
    `?symbol=${encodeURIComponent(symbol)}` +
    `&period1=${period1}` +
    `&period2=${period2}`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`HTTP Error: ${response.status}`)
  }

  const json = await response.json()

  console.log(symbol, json)

  // Yahoo error handling
  if (
    !json.chart ||
    !json.chart.result ||
    !json.chart.result.length
  ) {
    console.error('Yahoo API Error:', json)

    return []
  }

  const result = json.chart.result[0]

  if (
    !result.timestamp ||
    !result.indicators ||
    !result.indicators.adjclose
  ) {
    return []
  }

  const timestamps = result.timestamp

  const prices =
    result.indicators.adjclose[0].adjclose

  return timestamps
    .map((t, i) => ({
      date: new Date(t * 1000),
      price: prices[i]
    }))
    .filter(item => item.price != null)
}