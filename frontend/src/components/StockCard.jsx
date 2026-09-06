import { useNavigate } from "react-router-dom"

function StockCard({ stock, onRemove }) {
  const navigate = useNavigate()

  const positive = stock.price_change >= 0

  return (
    <div className="stock-card">
      <div className="stock-card-top">
        <div>
          <div className="symbol">
            {stock.symbol}
          </div>

          <div className="stock-name">
            {stock.name}
          </div>
        </div>

        <span className={`severity ${stock.severity}`}>
          {stock.severity}
        </span>
      </div>

      <div className="stock-price">
        {stock.currency === "INR" ? "₹" : "$"}
        {Number(stock.price).toFixed(2)}
      </div>

      <div className={`price-change ${positive ? "positive" : "negative"}`}>
        {positive ? "+" : ""}
        {Number(stock.price_change).toFixed(2)}%
      </div>

      <div className="stock-info">
        <div>
          <span>Change Score</span>
          <strong>{stock.score}/100</strong>
        </div>

        <div>
          <span>Volume Change</span>
          <strong>
            {Number(stock.volume_change).toFixed(1)}%
          </strong>
        </div>
      </div>

      <div className="reason">
        <span>Why it matters</span>
        <p>{stock.reason}</p>
      </div>

      <div className="card-actions">
        <button
          className="view-btn"
          onClick={() => navigate(`/stock/${stock.symbol}`)}
        >
          View Details
        </button>

        <button
          className="remove-btn"
          onClick={() => onRemove(stock.symbol)}
        >
          Remove
        </button>
      </div>
    </div>
  )
}

export default StockCard