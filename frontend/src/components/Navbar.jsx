import { useNavigate } from "react-router-dom"

function Navbar({ user }) {
  const navigate = useNavigate()

  function logout() {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    navigate("/login")
  }

  return (
    <nav className="navbar">
      <div className="brand" onClick={() => navigate("/")}>
        <div className="brand-icon">M</div>

        <div>
          <h2>MarketWatch</h2>
          <span>Smart Market Watchlist</span>
        </div>
      </div>

      <div className="nav-right">
        <span className="user-name">
          {user?.name || "Investor"}
        </span>

        <button className="logout-btn" onClick={logout}>
          Logout
        </button>
      </div>
    </nav>
  )
}

export default Navbar