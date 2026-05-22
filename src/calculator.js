export function calculatePortfolio(
  data,
  initialInvestment,
  exchangeRateMap = {},
  currency = 'USD'
) {
  if (!Array.isArray(data) || data.length === 0) {
    return []
  }

  // 🔥 KRW 자산만 환율 적용
  const useExchangeRate =
    currency === 'KRW'

  const first = data[0]

  // 🔥 시작일 환율 없으면 가장 가까운 이전값 사용
  const rateAtStart =
    exchangeRateMap[first.date] ?? 1

  const entryPrice =
    useExchangeRate
      ? first.price / rateAtStart
      : first.price

  // 🔥 방어
  if (
    typeof entryPrice !== 'number' ||
    isNaN(entryPrice) ||
    entryPrice <= 0
  ) {
    return []
  }

  const sharesOwned =
    initialInvestment / entryPrice

  return data.map(item => {

    // 🔥 해당 날짜 환율 없으면 직전 환율 유지
    const rate =
      exchangeRateMap[item.date] ?? rateAtStart

    const currentPrice =
      useExchangeRate
        ? item.price / rate
        : item.price

    // 🔥 NaN 방어
    if (
      typeof currentPrice !== 'number' ||
      isNaN(currentPrice)
    ) {
      return null
    }

    return {
      date: item.date,
      invested: initialInvestment,
      value: sharesOwned * currentPrice
    }
  })
  .filter(Boolean)
}