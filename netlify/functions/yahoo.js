const data = await response.json()

const result = data?.chart?.result?.[0]

if (!result || !result.timestamp || !result.indicators?.quote?.[0]) {
  console.error("Yahoo empty result:", data)

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify([])   // ❗ 502 방지 핵심
  }
}

const quote = result.indicators.quote[0]
const timestamps = result.timestamp

const formatted = timestamps
  .map((t, i) => {
    const close = quote.close?.[i]

    return {
      date: new Date(t * 1000).toISOString().slice(0, 10),
      price: typeof close === 'number' ? close : null
    }
  })
  .filter(d => d.price !== null) // 🔥 핵심

return {
  statusCode: 200,
  headers: {
    'Access-Control-Allow-Origin': '*'
  },
  body: JSON.stringify(formatted)
}