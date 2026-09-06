import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FileText } from "lucide-react";
import ThemeToggle from "../ui/ThemeToggle";
import { isAuthed, logout } from "../../lib/auth";

const LINKS = [
  { label: "Home", path: "/home" },
  { label: "Templates", path: "/templates" },
  { label: "ATS Checker", path: "/ats" },
];

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(isAuthed());

  // Re-check auth state on every navigation (covers login/logout/register)
  useEffect(() => {
    setAuthed(isAuthed());
  }, [location.pathname]);

  function handleLogout() {
    logout();
    setAuthed(false);
    navigate("/");
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border animate-fade">
      <div className="w-full flex items-center justify-between gap-4 pl-4 pr-4 md:pl-6 md:pr-8 py-3 md:py-4">
        <Link to={authed ? "/db" : "/home"} className="flex items-center gap-3 shrink-0">
       <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-sm">
  <FileText className="h-6 w-6 text-white" strokeWidth={2.25} />
</div>
          <div className="hidden sm:block leading-tight">
            <div className="text-xl md:text-2xl font-display font-bold tracking-tight">
              AI Resume Builder
            </div>
            <div className="text-xs md:text-sm muted">Draft, review, and pass the ATS check</div>
          </div>
        </Link>

      {/* 
  This navbar only shows when the user is LOGGED OUT.
  Why: once logged in, the sidebar already has Home, Dashboard, 
  Create Resume, ATS Checker, Settings — so showing these same 
  links again up here would just be repeated/confusing.
*/}
{!authed && (
  <nav className="hidden md:flex items-center gap-1" aria-label="Primary">
    {LINKS.map(({ label, path }) => (
      <Link
        key={path}
        to={path}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          location.pathname === path
            ? "bg-secondary text-foreground"   // style when this link is the current page
            : "text-muted-foreground hover:bg-secondary hover:text-foreground" // style otherwise
        }`}
      >
        {label}
      </Link>
    ))}
  </nav>
)}

        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle />
          {authed ? (
            <button onClick={handleLogout} className="btn btn-secondary text-sm py-1.5 px-3">
              Log out
            </button>
          ) : (
            <>
              <Link to="/" className="btn btn-secondary text-sm py-1.5 px-3">
                Log in
              </Link>
              <Link to="/register" className="btn btn-primary text-sm py-1.5 px-3">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Navbar;