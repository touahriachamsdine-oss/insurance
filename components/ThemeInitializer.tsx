"use client";

import { useEffect } from 'react';

export default function ThemeInitializer() {
  useEffect(() => {
    try {
      const theme = localStorage.getItem('theme') || 'light';
      document.documentElement.classList.add(theme);
    } catch (e) {
      // Ignore localStorage issues in private mode or unsupported browsers
    }
  }, []);

  return null;
}
