// src/components/ThemeSwitcher.jsx — Theme toggle pill
import React from 'react';

const THEMES = [
  { id: 'light', label: '☀️ Light' },
  { id: 'dark',  label: '🌙 Dark'  },
  { id: 'ocean', label: '🌊 Ocean' },
];

function ThemeSwitcher({ theme, setTheme }) {
  return (
    <div className="theme-switcher" role="group" aria-label="Choose theme">
      {THEMES.map(({ id, label }) => (
        <button
          key={id}
          id={`theme-btn-${id}`}
          className={`theme-btn${theme === id ? ' active' : ''}`}
          onClick={() => setTheme(id)}
          aria-pressed={theme === id}
          title={`Switch to ${id} theme`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export default ThemeSwitcher;
