export async function handler(event) {

  const query =
    event.queryStringParameters.q

  try {

    const response = await fetch(
      `https://query1.finance.yahoo.com/v1/finance/search?q=${query}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      }
    )

    const data = await response.json()

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(data)
    }

  } catch (err) {

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err.message
      })
    }
  }
}