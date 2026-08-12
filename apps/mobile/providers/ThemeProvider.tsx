import { createContext, PropsWithChildren, useContext } from 'react';
import { useColorScheme } from 'react-native';
import { palette } from '@/lib/theme';

type Theme = { [K in keyof typeof palette.light]: string };
const ThemeContext = createContext<Theme>(palette.light);

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemTheme = useColorScheme();
  return <ThemeContext.Provider value={systemTheme === 'dark' ? palette.dark : palette.light}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
