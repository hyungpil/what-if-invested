export async function handler(event) {
  try {
    const { symbol, period1, period2 } = event.queryStringParameters

    const url =
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}` +
      `?period1=${period1}&period2=${period2}&interval=1mo`

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    })

    const data = await response.json()

    const result = data?.chart?.result?.[0]
    const quote = result?.indicators?.quote?.[0]

    const timestamps = result?.timestamp || []

    const formatted = timestamps.map((t, i) => ({
      date: new Date(t * 1000).toISOString().slice(0, 10),
      price: quote?.close?.[i]   // ✅ close만 사용
    }))

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(formatted)
    }

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    }
  }
}