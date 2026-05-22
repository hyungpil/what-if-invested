export function calculatePortfolio(
  data,
  initialInvestment,
  exchangeRateMap = {}
) {
  if (!data.length) return []

  const first = data[0]

  const rateAtStart = exchangeRateMap[first.date] ?? 1
  const entryPriceUsd = first.price / rateAtStart

  const sharesOwned = initialInvestment / entryPriceUsd

  return data.map((item) => {
    const rate = exchangeRateMap[item.date] ?? 1
    const priceUsd = item.price / rate

    return {
      date: item.date,
      invested: initialInvestment,
      value: sharesOwned * priceUsd
    }
  })
}