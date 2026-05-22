export async function handler(event) {
  try {
    const { symbol, period1, period2 } =
      event.queryStringParameters

    const url =
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}` +
      `?period1=${period1}&period2=${period2}&interval=1d`

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    })

    // 🔴 Yahoo 자체 에러 방어
    if (!response.ok) {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          currency: 'USD',
          data: []
        })
      }
    }

    const data = await response.json()

    const result = data?.chart?.result?.[0]

    // 🔴 구조 방어
    if (
      !result ||
      !Array.isArray(result.timestamp)
    ) {
      console.error(
        'Yahoo invalid result:',
        data
      )

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          currency: 'USD',
          data: []
        })
      }
    }

    // 🔥 currency 추가
    const currency =
      result?.meta?.currency || 'USD'

    // 🔴 close 우선, 없으면 adjclose fallback
    const close =
      result?.indicators?.quote?.[0]?.close || []

    const adjClose =
      result?.indicators?.adjclose?.[0]?.adjclose || []

    const timestamps = result.timestamp

    const formatted = timestamps
      .map((t, i) => {

        const price =
          typeof close[i] === 'number'
            ? close[i]
            : typeof adjClose[i] === 'number'
            ? adjClose[i]
            : null

        return {
          date: new Date(t * 1000)
            .toISOString()
            .slice(0, 10),

          price
        }
      })

      // 🔴 null / NaN 제거
      .filter(
        d =>
          typeof d.price === 'number' &&
          !isNaN(d.price)
      )

    return {
      statusCode: 200,

      headers: {
        'Access-Control-Allow-Origin': '*'
      },

      body: JSON.stringify({
        currency,
        data: formatted
      })
    }

  } catch (err) {

    console.error(
      'Yahoo function error:',
      err
    )

    // 🔴 절대 502 안 터지게
    return {
      statusCode: 200,

      headers: {
        'Access-Control-Allow-Origin': '*'
      },

      body: JSON.stringify({
        currency: 'USD',
        data: []
      })
    }
  }
}