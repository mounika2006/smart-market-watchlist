import httpx
from datetime import datetime


async def get_stock(symbol):
    symbol = symbol.upper().strip()

    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"

    headers = {
        "User-Agent": "Mozilla/5.0"
    }

    try:
        async with httpx.AsyncClient(
            timeout=15,
            headers=headers,
            follow_redirects=True
        ) as client:
            response = await client.get(url)

        if response.status_code != 200:
            print("Yahoo response:", response.status_code)
            print(response.text[:500])
            return None

        data = response.json()

        chart = data.get("chart", {})
        result = chart.get("result")

        if not result:
            print("Yahoo returned no result for:", symbol)
            return None

        meta = result[0].get("meta", {})

        price = meta.get("regularMarketPrice")
        previous_price = meta.get("previousClose")
        volume = meta.get("regularMarketVolume", 0)

        if price is None:
            print("No price returned for:", symbol)
            return None

        return {
            "symbol": symbol,
            "name": meta.get("longName") or meta.get("shortName") or symbol,
            "price": round(float(price), 2),
            "volume": float(volume or 0),
            "previous_price": float(previous_price) if previous_price is not None else None,
            "previous_volume": 0,
            "currency": meta.get("currency", "USD"),
            "market": meta.get("exchangeName", "Unknown"),
            "updated_at": datetime.utcnow().isoformat(),
            "source": "Yahoo Finance",
            "stale": False
        }

    except Exception as e:
        print("Market API error:", repr(e))
        return None