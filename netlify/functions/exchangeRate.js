export async function handler(event) {
  const { start, end } = event.queryStringParameters

  const url = `https://api.frankfurter.app/${start}..${end}?from=USD&to=KRW`

  try {
    const res = await fetch(url)
    const data = await res.json()

    // 날짜별 환율 map으로 변환
    const rates = data.rates || {}

    const result = {}

    Object.entries(rates).forEach(([date, value]) => {
      result[date] = value.KRW
    })

    return {
      statusCode: 200,
      body: JSON.stringify(result)
    }
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    }
  }
}