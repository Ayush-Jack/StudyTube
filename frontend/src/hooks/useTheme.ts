'use client';
import { useEffect, useState } from 'react';

export function useTheme() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // On mount — read from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('studytube-theme') as 'dark' | 'light' | null;
    const initial = saved ?? 'dark';
    setTheme(initial);
    applyTheme(initial);
  }, []);

  function applyTheme(t: 'dark' | 'light') {
    const html = document.documentElement;
    // smooth transition class
    html.classList.add('theme-switching');
    setTimeout(() => html.classList.remove('theme-switching'), 400);
    // apply
    if (t === 'light') {
      html.classList.add('light');
    } else {
      html.classList.remove('light');
    }
  }

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
    localStorage.setItem('studytube-theme', next);
  }

  return { theme, toggleTheme };
}
