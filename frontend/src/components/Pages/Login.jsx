import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../../lib/api";

function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // ==========================================================
  // LOGIN
  // ==========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!username || !password) {
      setError("Please enter username and password");
      return;
    }

    setLoading(true);

    try {
      const resp = await API.login(username, password);

      console.log("Login response:", resp);

      // ======================================================
      // SUCCESSFUL LOGIN
      // ======================================================

      if (resp && resp.token) {
        localStorage.setItem("token", resp.token);

        // Open HOME after login
        navigate("/home");
      } else {
        setError(
          resp?.message ||
          "Invalid username or password"
        );
      }

    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Login error"
      );

    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div
      className="
        min-h-screen
        w-full
        flex
        items-center
        justify-center
        bg-background
        px-4
        py-8
        sm:px-6
        md:px-8
      "
    >

      {/* ====================================================
          LOGIN CARD
      ==================================================== */}

      <div
        className="
          card
          w-full
          max-w-md
          p-6
          sm:p-8
          animate-slide-up
        "
      >

        {/* LOGO */}

        <div
          className="
            mx-auto
            mb-5
            flex
            h-11
            w-11
            items-center
            justify-center
            rounded-md
            border-2
            border-foreground
            font-display
            text-sm
            font-bold
          "
        >
          A/R
        </div>


        {/* TITLE */}

        <h1
          className="
            mb-2
            text-center
            text-2xl
            font-display
            font-bold
          "
        >
          Welcome back
        </h1>


        <p
          className="
            muted
            mb-6
            text-center
            text-sm
          "
        >
          Sign in to pick up your draft
        </p>


        {/* LOGIN FORM */}

        <form
          onSubmit={handleSubmit}
          className="
            flex
            flex-col
            gap-4
            sm:gap-5
          "
        >

          {/* USERNAME */}

          <div>
            <label
              htmlFor="username"
              className="label"
            >
              Username
            </label>

            <input
              id="username"
              type="text"
              placeholder="Your username"
              value={username}
              onChange={(e) =>
                setUsername(e.target.value)
              }
              className="input"
              required
              autoComplete="username"
            />
          </div>


          {/* PASSWORD */}

          <div>
            <label
              htmlFor="password"
              className="label"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              className="input"
              required
              autoComplete="current-password"
            />
          </div>


          {/* ERROR */}

          {error && (
            <div
              className="
                rounded-md
                border
                border-brick/30
                bg-brick/10
                px-3
                py-2
                text-sm
                text-brick
              "
              role="alert"
            >
              {error}
            </div>
          )}


          {/* SIGN IN */}

          <button
            type="submit"
            className="
              btn
              btn-primary
              mt-1
            "
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner" />
                Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </button>


          {/* REGISTER */}

          <div
            className="
              muted
              mt-2
              text-center
              text-sm
            "
          >
            Need an account?{" "}

            <Link
              to="/register"
              className="
                text-gold
                font-semibold
                hover:underline
              "
            >
              Register
            </Link>
          </div>

        </form>

      </div>

    </div>
  );
}

export default Login;