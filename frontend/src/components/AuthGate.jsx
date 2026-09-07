import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isAuthed } from "../lib/auth";


// ============================================================
// AUTH GATE
// ============================================================
//
// Protects pages that require the user to be logged in.
//
// If the user is logged in:
//     → show the requested page
//
// If the user is NOT logged in:
//     → redirect to Login (/)
//
// The original page is stored in location.state.from so it can
// be used later to return the user to the page they wanted.
// ============================================================

export default function AuthGate({ children }) {

  const location = useLocation();

  // Check whether the user currently has a valid
  // authentication token.
  const authenticated = isAuthed();


  // ==========================================================
  // USER IS LOGGED IN
  // ==========================================================

  if (authenticated) {
    return children;
  }


  // ==========================================================
  // USER IS NOT LOGGED IN
  // ==========================================================
  //
  // Redirect to the Login page.
  //
  // Example:
  //
  // User clicks Dashboard
  //       ↓
  // /db
  //       ↓
  // AuthGate
  //       ↓
  // Not authenticated
  //       ↓
  // /
  //       ↓
  // Login page
  //
  // The original destination is preserved in `from`.
  // ==========================================================

  return (
    <Navigate
      to="/"
      replace
      state={{
        from: location.pathname,
        authRequired: true,
      }}
    />
  );
}