import { useNavigate } from "react-router-dom"

function ChangeCard({ stock }) {
  const navigate = useNavigate()

  const positive = stock.price_change >= 0

  return (
    <div
      className="change-card"
      onClick={() => navigate(`/stock/${stock.symbol}`)}
    >
      <div className="change-main">
        <div className="change-symbol">
          {stock.symbol}
        </div>

        <div className="change-reason">
          {stock.reason}
        </div>
      </div>

      <div className="change-middle">
        <strong>
          {stock.currency === "INR" ? "₹" : "$"}
          {Number(stock.price).toFixed(2)}
        </strong>

        <span className={positive ? "positive" : "negative"}>
          {positive ? "+" : ""}
          {Number(stock.price_change).toFixed(2)}%
        </span>
      </div>

      <div className="change-score">
        <span>Impact</span>
        <strong>{stock.score}</strong>
      </div>

      <div className={`severity ${stock.severity}`}>
        {stock.severity}
      </div>
    </div>
  )
}

export default ChangeCard