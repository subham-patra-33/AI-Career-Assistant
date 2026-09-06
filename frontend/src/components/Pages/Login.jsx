import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../../lib/api";

function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

const handleSubmit = async (e) => {
  e.preventDefault();
  setError(null);

  if (!username || !password) {
    setError('Please enter username and password');
    return;
  }

  setLoading(true);

  try {
    const resp = await API.login(username, password);

    console.log("Login response:", resp); // 🔍 debug

    // ✅ SAFE CHECK
    if (resp && resp.token) {
      localStorage.setItem('token', resp.token);

      // ✅ redirect ONLY if token exists
      navigate("/db");
    } else {
      setError(resp?.message || 'Invalid username or password');
    }

  } catch (err) {
    console.error(err);
    setError(err?.response?.data?.message || err.message || 'Login error');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="flex items-center justify-center w-full h-full bg-background px-4 sm:px-6 md:px-8">

      <div className="card w-full max-w-md p-8 animate-slide-up">

        <div className="mx-auto mb-5 h-11 w-11 rounded-md border-2 border-foreground flex items-center justify-center font-display font-bold text-sm">
          A/R
        </div>

        <h1 className="text-2xl font-display font-bold text-center mb-2">Welcome back</h1>
        <p className="text-center muted mb-6 text-sm">Sign in to pick up your draft</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:gap-5">
          <label className="label">Username</label>
          <input
            type="text"
            placeholder="Your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input"
            required
            aria-label="Username"
          />

          <label className="label">Password</label>
          <input
            type="password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            required
            aria-label="Password"
          />

          {error && (
            <div className="text-sm text-brick bg-brick/10 border border-brick/30 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary mt-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner" /> Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </button>

          <div className="text-center mt-2 text-sm muted">
            Need an account?{' '}
            <Link to="/register" className="text-gold font-semibold hover:underline">
              Register
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;