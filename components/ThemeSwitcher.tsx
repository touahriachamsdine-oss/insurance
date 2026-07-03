'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon, Sparkles } from 'lucide-react';

type Theme = 'light' | 'dark' | 'night';

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('theme') as Theme | null;
    const initial: Theme = stored ?? 'light';
    setTheme(initial);
    const root = document.documentElement;
    root.classList.remove('light', 'dark', 'night');
    root.classList.add(initial);
  }, []);

  const changeTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    const root = document.documentElement;
    root.classList.remove('light', 'dark', 'night');
    root.classList.add(newTheme);
  };

  // Avoid hydration mismatch — render neutral skeleton until mounted
  if (!mounted) {
    return (
      <div className="inline-flex items-center gap-1 p-1 rounded-full"
           style={{ width: 96, height: 32 }} />
    );
  }

  return (
    <div
      className="relative inline-flex items-center gap-0.5 p-1 rounded-full border select-none"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-sage)',
        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.12)',
      }}
    >
      {/* Light Mode — Sun / Cream */}
      <button
        onClick={() => changeTheme('light')}
        title="Light Mode"
        className="relative p-1.5 rounded-full transition-all duration-200 cursor-pointer"
        style={
          theme === 'light'
            ? {
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                boxShadow: '0 1px 4px rgba(0, 0, 0, 0.12)',
                transform: 'scale(1.1)',
              }
            : { color: 'var(--text-faint)' }
        }
      >
        <Sun className="w-3.5 h-3.5" />
      </button>

      {/* Dark Mode — Moon / Forest */}
      <button
        onClick={() => changeTheme('dark')}
        title="Dark Mode"
        className="relative p-1.5 rounded-full transition-all duration-200 cursor-pointer"
        style={
          theme === 'dark'
            ? {
                backgroundColor: 'var(--bg-sage)',
                color: 'var(--text-primary)',
                boxShadow: '0 1px 6px rgba(0, 0, 0, 0.20)',
                transform: 'scale(1.1)',
              }
            : { color: 'var(--text-faint)' }
        }
      >
        <Moon className="w-3.5 h-3.5" />
      </button>

      {/* Night Mode — Sparkles / Midnight Sage */}
      <button
        onClick={() => changeTheme('night')}
        title="Night Mode"
        className="relative p-1.5 rounded-full transition-all duration-200 cursor-pointer"
        style={
          theme === 'night'
            ? {
                backgroundColor: 'var(--bg-sage-deep)',
                color: 'var(--text-primary)',
                boxShadow: '0 1px 8px rgba(0, 0, 0, 0.28)',
                transform: 'scale(1.1)',
              }
            : { color: 'var(--text-faint)' }
        }
      >
        <Sparkles className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
