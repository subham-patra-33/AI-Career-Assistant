import React, { useEffect, useState } from 'react';

function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('theme');
      if (saved === 'dark') {
        document.documentElement.classList.add('dark');
        setDark(true);
      } else if (saved === 'light') {
        document.documentElement.classList.remove('dark');
        setDark(false);
      } else {
        // follow system preference
        const prefers = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefers) {
          document.documentElement.classList.add('dark');
          setDark(true);
        }
      }
    } catch (err) {
      // ignore
    }
  }, []);

  function toggle() {
    const to = !dark;
    setDark(to);
    try {
      if (to) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', to ? 'dark' : 'light');
    } catch (err) {}
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-card text-card-foreground hover:scale-105 transition-transform duration-150"
    >
      <span className="sr-only">Toggle theme</span>
      {dark ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.293 13.293a8 8 0 11-10.586-10.586 8 8 0 0010.586 10.586z"/></svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zM4.22 4.22a1 1 0 011.42 0L6.64 5.22a1 1 0 11-1.42 1.42L4.22 5.64a1 1 0 010-1.42zM2 10a1 1 0 011-1h1a1 1 0 110 2H3a1 1 0 01-1-1zm8 7a1 1 0 011-1v-1a1 1 0 10-2 0v1a1 1 0 011 1zm5.78-2.78a1 1 0 010 1.42l-1 1a1 1 0 11-1.42-1.42l1-1a1 1 0 011.42 0zM17 9a1 1 0 100 2h1a1 1 0 100-2h-1zM6.64 14.36a1 1 0 011.42 0l1 1a1 1 0 11-1.42 1.42l-1-1a1 1 0 010-1.42z"/></svg>
      )}
      <span className="hidden sm:inline text-sm">{dark ? 'Dark' : 'Light'}</span>
    </button>
  );
}

export default ThemeToggle;
