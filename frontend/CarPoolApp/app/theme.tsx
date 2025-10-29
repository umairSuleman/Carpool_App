export const lightTheme = {
  background: '#FFFFFF',
  text: '#1A1A1A',
  primary: '#007AFF',
  secondary: '#f0f0f0',
  border: '#eee',
  danger: '#FF3B30',
  inputBackground: '#f0f0f0',
  cardBackground: '#FFFFFF',
};

export const darkTheme = {
  background: '#1A1A1A',
  text: '#FFFFFF',
  primary: '#0A84FF',
  secondary: '#2C2C2E',
  border: '#38383A',
  danger: '#FF453A',
  inputBackground: '#2C2C2E',
  cardBackground: '#2C2C2E',
};


import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';

type Theme = typeof lightTheme;
type ThemeContextType = {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const colorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(colorScheme === 'dark');

  useEffect(() => {
    setIsDark(colorScheme === 'dark');
  }, [colorScheme]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};