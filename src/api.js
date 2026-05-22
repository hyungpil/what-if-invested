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
    throw new Error(
      `HTTP Error: ${response.status}`
    )
  }

  const json = await response.json()

  console.log(
    'FULL RESPONSE:',
    JSON.stringify(json, null, 2)
  )

  // 🔥 핵심 수정
  if (
    !json ||
    !Array.isArray(json.data)
  ) {
    console.error(
      'Invalid Yahoo response:',
      json
    )

    return {
      currency: 'USD',
      data: []
    }
  }

  return {
    currency:
      json.currency || 'USD',

    data: json.data
  }
}

export async function fetchExchangeRate(
  startDate,
  endDate
) {

  try {

    const period1 = Math.floor(
      new Date(startDate).getTime() / 1000
    )

    const period2 = Math.floor(
      new Date(endDate).getTime() / 1000
    )

    const url =
      `/.netlify/functions/yahoo` +
      `?symbol=KRW=X` +
      `&period1=${period1}` +
      `&period2=${period2}`

    const res = await fetch(url)

    if (!res.ok) {
      return {}
    }

    const json = await res.json()

    // 🔥 여기 수정
    if (
      !json ||
      !Array.isArray(json.data)
    ) {
      console.error(
        'Invalid exchange rate response:',
        json
      )

      return {}
    }

    const map = {}

    json.data.forEach(item => {
      map[item.date] = item.price
    })

    return map

  } catch (err) {

    console.error(
      'Exchange Rate Fetch Error:',
      err
    )

    return {}
  }
}