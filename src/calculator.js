export function calculatePortfolio(
  data,
  monthlyInvestment,
  symbol,
  exchangeRateMap
) {

  if (!data.length) {
    return []
  }

  let sharesOwned = 0
  let totalInvested = 0

  return data.map((item) => {

    let adjustedPrice = item.price

    // ⭐ 한국 주식이면 환율 적용
    if (symbol.includes('.KS')) {
      const monthKey = item.date.slice(0, 7)
      const rate = exchangeRateMap?.[monthKey]

      if (rate) {
        adjustedPrice = item.price / rate
      }
    }

    const sharesBought =
      monthlyInvestment / adjustedPrice

    sharesOwned += sharesBought
    totalInvested += monthlyInvestment

    return {
      date: item.date,
      invested: totalInvested,
      value: sharesOwned * adjustedPrice
    }
  })
}