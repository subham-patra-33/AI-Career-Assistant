import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../../lib/api";

function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!name || !username || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const resp = await API.register(name, username, password);
      if (resp && resp.token) {
        localStorage.setItem('token', resp.token);
        navigate('/db');
      } else {
        setError(resp.message || 'Registration failed');
      }
    } catch (err) {
      setError(err.message || 'Registration error');
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
        <h1 className="text-2xl font-display font-bold text-center mb-2">Start your draft</h1>
        <p className="text-center muted mb-6 text-sm">Create an account and open a blank page.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:gap-5">
          <label className="label">Name</label>
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            required
            aria-label="Name"
          />

          <label className="label">Username</label>
          <input
            type="text"
            placeholder="Choose a username"
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

          <button type="submit" className="btn btn-primary mt-2" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner" /> Creating account…
              </>
            ) : (
              "Create account"
            )}
          </button>

          <div className="text-center mt-2 text-sm muted">
            Already have an account?{' '}
            <Link to="/" className="text-gold font-semibold hover:underline">
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Register;
