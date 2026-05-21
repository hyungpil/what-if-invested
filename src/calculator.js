export function calculatePortfolio(
  data,
  monthlyInvestment,
  exchangeRateMap = {}
) {
  if (!data.length) return []

  let sharesOwned = 0
  let totalInvested = 0

  return data.map((item) => {

    const rate = exchangeRateMap[item.date] ?? 1
    const priceInUsd = item.price / rate

    const sharesBought = monthlyInvestment / priceInUsd

    sharesOwned += sharesBought
    totalInvested += monthlyInvestment

    return {
      date: item.date,
      invested: totalInvested,
      value: sharesOwned * priceInUsd
    }
  })
}