export function calculatePortfolio(
  data,
  monthlyInvestment
) {

  if (!data.length) {
    return []
  }

  let sharesOwned = 0
  let totalInvested = 0

  return data.map((item) => {

    const sharesBought =
      monthlyInvestment / item.price

    sharesOwned += sharesBought

    totalInvested += monthlyInvestment

    return {
      date: item.date,
      invested: totalInvested,
      value: sharesOwned * item.price
    }
  })
}