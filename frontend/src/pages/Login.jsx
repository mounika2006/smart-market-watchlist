import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import api from "../api"

function Login() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    email: "",
    password: ""
  })

  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await api.post(
        "/auth/login",
        form
      )

      localStorage.setItem(
        "token",
        response.data.token
      )

      localStorage.setItem(
        "user",
        JSON.stringify(response.data.user)
      )

      navigate("/")
    } catch (error) {
      setError(
        error.response?.data?.detail ||
        "Login failed"
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">
          <div className="brand-icon">M</div>
          <span>MarketWatch</span>
        </div>

        <div className="auth-content">
          <div className="eyebrow">
            SMART MARKET INTELLIGENCE
          </div>

          <h1>
            Know what changed
            <span> before you miss it.</span>
          </h1>

          <p>
            Track your favorite stocks and instantly
            understand the market movements that matter.
          </p>
        </div>
      </div>

      <div className="auth-right">
        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >
          <h2>Welcome back</h2>

          <p className="auth-subtitle">
            Sign in to your market dashboard
          </p>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <label>Email</label>

          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            required
          />

          <label>Password</label>

          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Enter your password"
            required
          />

          <button
            className="primary-btn"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <p className="auth-switch">
            Don't have an account?
            <Link to="/register">
              Create one
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}

export default Login