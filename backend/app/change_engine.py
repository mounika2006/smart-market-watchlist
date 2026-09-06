def calculate_change(
    current_price,
    previous_price,
    current_volume,
    previous_volume
):
    if previous_price is None:
        return {
            "score": 0,
            "severity": "normal",
            "price_change": 0,
            "volume_change": 0,
            "reason": "First observation"
        }

    if previous_price == 0:
        price_change = 0
    else:
        price_change = (
            (current_price - previous_price)
            / previous_price
        ) * 100

    if previous_volume and previous_volume > 0:
        volume_change = (
            (current_volume - previous_volume)
            / previous_volume
        ) * 100
    else:
        volume_change = 0

    price_score = min(
        abs(price_change) * 8,
        60
    )

    volume_score = min(
        abs(volume_change) * 0.2,
        30
    )

    score = min(
        round(price_score + volume_score),
        100
    )

    if score >= 80:
        severity = "critical"
    elif score >= 60:
        severity = "high"
    elif score >= 30:
        severity = "moderate"
    else:
        severity = "normal"

    if price_change <= -5:
        reason = "Large price decline"
    elif price_change >= 5:
        reason = "Large price increase"
    elif abs(volume_change) >= 100:
        reason = "Unusually high trading volume"
    elif abs(price_change) >= 2:
        reason = "Meaningful price movement"
    else:
        reason = "No major movement"

    return {
        "score": score,
        "severity": severity,
        "price_change": round(price_change, 2),
        "volume_change": round(volume_change, 2),
        "reason": reason
    }