export async function handler(event) {
  try {
    const { symbol, period1, period2 } = event.queryStringParameters

    const url =
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}` +
      `?period1=${period1}&period2=${period2}&interval=1d`

    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    })

    const text = await response.text()

    let data
    try {
      data = JSON.parse(text)
    } catch (e) {
      console.error("Yahoo JSON parse failed:", text)
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify([])
      }
    }

    const result = data?.chart?.result?.[0]
    const quote = result?.indicators?.quote?.[0]
    const timestamps = result?.timestamp

    if (!result || !quote || !timestamps) {
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify([])
      }
    }

    const formatted = timestamps
      .map((t, i) => ({
        date: new Date(t * 1000).toISOString().slice(0, 10),
        price: quote.close?.[i]
      }))
      .filter(d => typeof d.price === "number")

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(formatted)
    }

  } catch (err) {
    console.error("FUNCTION ERROR:", err)

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify([])
    }
  }
}