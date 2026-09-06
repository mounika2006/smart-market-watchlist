import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import api from "../api"

function Register() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: "",
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
      await api.post(
        "/auth/register",
        form
      )

      navigate("/login")
    } catch (error) {
      setError(
        error.response?.data?.detail ||
        "Registration failed"
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
            YOUR MARKET. YOUR WATCHLIST.
          </div>

          <h1>
            Never wonder
            <span> what changed.</span>
          </h1>

          <p>
            Build personalized watchlists and get
            meaningful market insights every time you return.
          </p>
        </div>
      </div>

      <div className="auth-right">
        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >
          <h2>Create account</h2>

          <p className="auth-subtitle">
            Start tracking the market smarter
          </p>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <label>Name</label>

          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Your name"
            required
          />

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
            placeholder="Create a password"
            required
          />

          <button
            className="primary-btn"
            disabled={loading}
          >
            {loading
              ? "Creating account..."
              : "Create Account"}
          </button>

          <p className="auth-switch">
            Already have an account?
            <Link to="/login">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}

export default Register