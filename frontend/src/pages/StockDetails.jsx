import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import api from "../api"
import Navbar from "../components/Navbar"

function StockDetails() {
  const { symbol } = useParams()
  const navigate = useNavigate()

  const user = JSON.parse(
    localStorage.getItem("user") || "null"
  )

  const [stock, setStock] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  async function loadStock() {
    try {
      const response = await api.get(
        `/stocks/${symbol}`
      )

      setStock(response.data)
    } catch (error) {
      setError(
        error.response?.data?.detail ||
        "Unable to load stock"
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStock()
  }, [symbol])

  if (loading) {
    return (
      <div className="app-page">
        <Navbar user={user} />

        <div className="loading-page">
          Loading stock...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="app-page">
        <Navbar user={user} />

        <div className="error-page">
          <h2>{error}</h2>

          <button
            className="primary-btn"
            onClick={() => navigate("/")}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const positive = stock.price_change >= 0

  return (
    <div className="app-page">
      <Navbar user={user} />

      <main className="stock-detail-page">
        <button
          className="back-btn"
          onClick={() => navigate("/")}
        >
          ← Back to Dashboard
        </button>

        <section className="stock-hero">
          <div>
            <div className="eyebrow">
              STOCK DETAILS
            </div>

            <div className="detail-symbol">
              {stock.symbol}
            </div>

            <div className="detail-name">
              {stock.name}
            </div>
          </div>

          <div className="detail-price">
            <div>
              {stock.currency === "INR"
                ? "₹"
                : "$"}
              {Number(stock.price).toFixed(2)}
            </div>

            <span
              className={
                positive
                  ? "positive"
                  : "negative"
              }
            >
              {positive ? "+" : ""}
              {Number(stock.price_change).toFixed(2)}%
            </span>
          </div>
        </section>

        <section className="detail-grid">
          <div className="detail-panel">
            <span>CHANGE SCORE</span>

            <strong>
              {stock.score}
              <small>/100</small>
            </strong>

            <div className="score-bar">
              <div
                style={{
                  width: `${stock.score}%`
                }}
              />
            </div>

            <p>
              Overall significance of the movement
            </p>
          </div>

          <div className="detail-panel">
            <span>PRICE CHANGE</span>

            <strong
              className={
                positive
                  ? "positive"
                  : "negative"
              }
            >
              {positive ? "+" : ""}
              {Number(
                stock.price_change
              ).toFixed(2)}%
            </strong>

            <p>
              Movement since your previous observation
            </p>
          </div>

          <div className="detail-panel">
            <span>VOLUME CHANGE</span>

            <strong>
              {Number(
                stock.volume_change
              ).toFixed(2)}%
            </strong>

            <p>
              Change in trading activity
            </p>
          </div>

          <div className="detail-panel">
            <span>SEVERITY</span>

            <strong>
              <span
                className={`severity ${stock.severity}`}
              >
                {stock.severity}
              </span>
            </strong>

            <p>
              Current attention level
            </p>
          </div>
        </section>

        <section className="why-panel">
          <div className="why-icon">!</div>

          <div>
            <div className="eyebrow">
              WHY IT MATTERS
            </div>

            <h2>{stock.reason}</h2>

            <p>
              The Smart Market Watchlist engine
              detected this movement based on the
              difference between your previous
              observation and the latest available
              market data.
            </p>
          </div>
        </section>

        <section className="metadata-panel">
          <h2>Market Information</h2>

          <div className="metadata-grid">
            <div>
              <span>Market</span>
              <strong>{stock.market}</strong>
            </div>

            <div>
              <span>Currency</span>
              <strong>{stock.currency}</strong>
            </div>

            <div>
              <span>Data Source</span>
              <strong>{stock.source}</strong>
            </div>

            <div>
              <span>Last Checked</span>
              <strong>
                {stock.last_checked
                  ? new Date(
                      stock.last_checked
                    ).toLocaleString()
                  : "First observation"}
              </strong>
            </div>

            <div>
              <span>Latest Update</span>
              <strong>
                {new Date(
                  stock.updated_at
                ).toLocaleString()}
              </strong>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default StockDetails