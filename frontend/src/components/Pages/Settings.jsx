import React, { useState, useEffect } from "react";
import BackButton from '../BackButton';

function Settings() {
  // Load saved theme
  const [dark, setDark] = useState(
    localStorage.getItem("theme") === "dark"
  );

  // Apply dark class + save
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <div className="flex items-center justify-center w-full h-full bg-background px-4 overflow-hidden">

      <div className="w-full max-w-4xl">
        {/* Page Title */}
        <div className="mb-6 ruled">
          <div className="flex items-center gap-3 mb-3">
            <BackButton fallbackRoute="/db" />
            <h1 className="text-3xl md:text-4xl font-display font-bold">
              Settings
            </h1>
          </div>
          <p className="muted mt-2 ml-15 text-sm">
            Manage your preferences and profile
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">

          {/* Profile Settings */}
          <div className="card p-6">
            <h2 className="text-xl font-display font-semibold mb-4">
              Profile
            </h2>

            <div className="flex flex-col gap-4">
              <input type="text" placeholder="Full Name" className="input" />
              <input type="email" placeholder="Email Address" className="input" />
              <button className="btn btn-accent">Save profile</button>
            </div>
          </div>

          {/* Preferences */}
          <div className="card p-6">
            <h2 className="text-xl font-display font-semibold mb-4">
              Preferences
            </h2>

            <div className="flex flex-col gap-4">

              {/* Dark Mode Toggle */}
              <div className="flex justify-between items-center">
                <span className="font-medium text-sm">Dark mode</span>

                <button
                  onClick={() => setDark(!dark)}
                  aria-pressed={dark}
                  aria-label="Toggle dark mode"
                  className="w-12 h-6.5 flex items-center rounded-full p-1 transition-colors duration-300"
                  style={{ background: dark ? 'var(--color-teal)' : 'var(--color-muted)' }}
                >
                  <div
                    className={`w-4.5 h-4.5 bg-white rounded-full shadow-md transform transition-all duration-300 ${
                      dark ? "translate-x-5.5" : ""
                    }`}
                  />
                </button>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm">AI suggestions</span>
                <input type="checkbox" defaultChecked className="accent-gold" />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm">Email notifications</span>
                <input type="checkbox" className="accent-gold" />
              </div>

            </div>
          </div>

          {/* Account */}
          <div className="card p-6 md:col-span-2">
            <h2 className="text-xl font-display font-semibold mb-4">
              Account
            </h2>

            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <p className="text-sm">
                  Delete your account permanently
                </p>
                <p className="text-sm muted">
                  This action cannot be undone.
                </p>
              </div>

              <button className="btn text-sm shrink-0" style={{ background: 'var(--color-brick)', color: '#fff' }}>
                Delete account
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Settings;
