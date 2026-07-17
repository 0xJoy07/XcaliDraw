import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const getInitialTheme = (): Theme => {
  const saved = localStorage.getItem('xcalidraw-theme-preference');
  if (saved === 'light' || saved === 'dark') {
    return saved;
  }
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
};

export const useThemeStore = create<ThemeState>((set) => ({
  theme: getInitialTheme(),
  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('xcalidraw-theme-preference', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return { theme: newTheme };
  }),
  setTheme: (theme: Theme) => set(() => {
    localStorage.setItem('xcalidraw-theme-preference', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return { theme };
  })
}));

// Initialize the theme on load
const currentTheme = getInitialTheme();
if (currentTheme === 'dark') {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}

// Fallback listener for OS changes (only if no local storage preference exists)
if (window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('xcalidraw-theme-preference')) {
      const newTheme = e.matches ? 'dark' : 'light';
      useThemeStore.getState().setTheme(newTheme);
      // Remove it from local storage so it continues to track OS
      localStorage.removeItem('xcalidraw-theme-preference');
    }
  });
}
