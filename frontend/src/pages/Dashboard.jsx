import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../api"
import Navbar from "../components/Navbar"
import StockCard from "../components/StockCard"
import ChangeCard from "../components/ChangeCard"

function Dashboard() {
  const navigate = useNavigate()

  const user = JSON.parse(
    localStorage.getItem("user") || "null"
  )

  const [watchlists, setWatchlists] = useState([])
  const [selectedList, setSelectedList] = useState(null)
  const [stocks, setStocks] = useState([])
  const [changes, setChanges] = useState([])
  const [symbol, setSymbol] = useState("")
  const [newList, setNewList] = useState("")
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  async function loadWatchlists() {
    try {
      const response = await api.get("/watchlists")
      setWatchlists(response.data)

      if (response.data.length > 0) {
        setSelectedList((current) =>
          current || response.data[0].id
        )
      }
    } catch {
      setError("Unable to load watchlists")
    }
  }

  async function loadStocks(listId) {
    if (!listId) return

    try {
      const response = await api.get(
        `/watchlists/${listId}/stocks`
      )

      setStocks(response.data)
    } catch {
      setError("Unable to load stocks")
    }
  }

  async function loadChanges(listId) {
    if (!listId) return

    try {
      const response = await api.get(
        `/watchlists/${listId}/changes`
      )

      setChanges(response.data)
    } catch {
      setError("Unable to load market changes")
    }
  }

  useEffect(() => {
    async function load() {
      setLoading(true)
      await loadWatchlists()
      setLoading(false)
    }

    load()
  }, [])

  useEffect(() => {
    if (selectedList) {
      loadStocks(selectedList)
      loadChanges(selectedList)
    }
  }, [selectedList])

  async function addStock(e) {
    e.preventDefault()

    if (!symbol.trim() || !selectedList) return

    setError("")
    setMessage("")

    try {
      await api.post(
        `/watchlists/${selectedList}/stocks`,
        {
          symbol: symbol.toUpperCase()
        }
      )

      setSymbol("")
      setMessage("Stock added successfully")

      await loadStocks(selectedList)
      await loadChanges(selectedList)
      await loadWatchlists()
    } catch (error) {
      setError(
        error.response?.data?.detail ||
        "Unable to add stock"
      )
    }
  }

  async function removeStock(stockSymbol) {
    try {
      await api.delete(
        `/watchlists/${selectedList}/stocks/${stockSymbol}`
      )

      await loadStocks(selectedList)
      await loadChanges(selectedList)
      await loadWatchlists()
    } catch {
      setError("Unable to remove stock")
    }
  }

  async function createWatchlist(e) {
    e.preventDefault()

    if (!newList.trim()) return

    try {
      const response = await api.post(
        "/watchlists",
        {
          name: newList
        }
      )

      setNewList("")
      await loadWatchlists()
      setSelectedList(response.data.id)
      setMessage("Watchlist created")
    } catch {
      setError("Unable to create watchlist")
    }
  }

  async function checkMarket() {
  if (!selectedList) return

  setMessage("Checking market...")
  setError("")

  try {
    const response = await api.post(
      `/watchlists/${selectedList}/check`
    )

    setChanges(response.data.changes)

    await loadStocks(selectedList)
    await loadWatchlists()

    setMessage(
      `${response.data.stocks_checked} stocks checked successfully`
    )
  } catch (error) {
    setError(
      error.response?.data?.detail ||
      "Market check failed"
    )
  }
}

  const highImpact = changes.filter(
    (item) =>
      item.severity === "high" ||
      item.severity === "critical"
  ).length

  const moderate = changes.filter(
    (item) => item.severity === "moderate"
  ).length

  const totalChange = changes.reduce(
    (sum, item) =>
      sum + Math.abs(Number(item.price_change || 0)),
    0
  )

  return (
    <div className="app-page">
      <Navbar user={user} />

      <main className="dashboard">
        <section className="dashboard-header">
          <div>
            <div className="eyebrow">
              MARKET INTELLIGENCE
            </div>

            <h1>
              Good morning, {user?.name || "Investor"}.
            </h1>

            <p>
              Here's what changed in your market today.
            </p>
          </div>

          <button
            className="check-btn"
            onClick={checkMarket}
          >
            ↻ Check Market
          </button>
        </section>

        {error && (
          <div className="error-message dashboard-message">
            {error}
          </div>
        )}

        {message && (
          <div className="success-message dashboard-message">
            {message}
          </div>
        )}

        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">
              WATCHLIST STOCKS
            </div>

            <div className="stat-value">
              {stocks.length}
            </div>

            <div className="stat-description">
              Stocks you're tracking
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">
              HIGH IMPACT
            </div>

            <div className="stat-value">
              {highImpact}
            </div>

            <div className="stat-description">
              Changes needing attention
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">
              MODERATE
            </div>

            <div className="stat-value">
              {moderate}
            </div>

            <div className="stat-description">
              Worth keeping an eye on
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">
              MARKET MOVEMENT
            </div>

            <div className="stat-value">
              {totalChange.toFixed(1)}%
            </div>

            <div className="stat-description">
              Combined absolute movement
            </div>
          </div>
        </section>

        <section className="dashboard-layout">
          <div className="main-column">
            <div className="section-header">
              <div>
                <h2>What Changed?</h2>

                <p>
                  The most meaningful movements since
                  your last check.
                </p>
              </div>

              <span className="live-status">
                ● LIVE DATA
              </span>
            </div>

            <div className="change-list">
              {changes.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">◎</div>

                  <h3>
                    Nothing to report yet
                  </h3>

                  <p>
                    Add stocks to your watchlist and
                    check the market to start tracking
                    meaningful changes.
                  </p>
                </div>
              ) : (
                changes.map((stock) => (
                  <ChangeCard
                    key={stock.symbol}
                    stock={stock}
                  />
                ))
              )}
            </div>
          </div>

          <aside className="side-column">
            <div className="panel">
              <div className="panel-header">
                <div>
                  <h3>Your Watchlists</h3>
                  <span>
                    {watchlists.length} lists
                  </span>
                </div>
              </div>

              <div className="watchlist-tabs">
                {watchlists.map((list) => (
                  <button
                    key={list.id}
                    className={
                      selectedList === list.id
                        ? "watchlist-tab active"
                        : "watchlist-tab"
                    }
                    onClick={() =>
                      setSelectedList(list.id)
                    }
                  >
                    <span>{list.name}</span>
                    <small>
                      {list.stock_count}
                    </small>
                  </button>
                ))}
              </div>

              <form
                className="create-list-form"
                onSubmit={createWatchlist}
              >
                <input
                  value={newList}
                  onChange={(e) =>
                    setNewList(e.target.value)
                  }
                  placeholder="New watchlist..."
                />

                <button>+</button>
              </form>
            </div>

            <div className="panel">
              <div className="panel-header">
                <div>
                  <h3>Add a Stock</h3>
                  <span>
                    Add to your selected watchlist
                  </span>
                </div>
              </div>

              <form
                className="add-stock-form"
                onSubmit={addStock}
              >
                <input
                  value={symbol}
                  onChange={(e) =>
                    setSymbol(e.target.value)
                  }
                  placeholder="Enter symbol e.g. AAPL"
                />

                <button className="primary-btn">
                  Add Stock
                </button>
              </form>
            </div>

            <div className="panel">
              <div className="panel-header">
                <div>
                  <h3>Tracked Stocks</h3>
                  <span>
                    {stocks.length} securities
                  </span>
                </div>
              </div>

              <div className="mini-stock-list">
                {stocks.map((stock) => (
                  <div
                    className="mini-stock"
                    key={stock.symbol}
                  >
                    <button
                      onClick={() =>
                        navigate(
                          `/stock/${stock.symbol}`
                        )
                      }
                    >
                      <strong>
                        {stock.symbol}
                      </strong>

                      <span>
                        View details →
                      </span>
                    </button>

                    <button
                      className="mini-remove"
                      onClick={() =>
                        removeStock(stock.symbol)
                      }
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>

        <section className="stocks-section">
          <div className="section-header">
            <div>
              <h2>Market Overview</h2>

              <p>
                Your watchlist at a glance.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="loading">
              Loading market data...
            </div>
          ) : (
            <div className="stock-grid">
              {changes.map((stock) => (
                <StockCard
                  key={stock.symbol}
                  stock={stock}
                  onRemove={removeStock}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default Dashboard