"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider, Theme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { useSession } from 'next-auth/react';

// Theme types
export type ThemeMode = 'light' | 'dark' | 'auto';
export type ColorScheme = 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'pink' | 'indigo' | 'teal';

interface ThemeSettings {
  mode: ThemeMode;
  colorScheme: ColorScheme;
  fontSize: 'small' | 'medium' | 'large';
  borderRadius: 'none' | 'small' | 'medium' | 'large';
  density: 'comfortable' | 'compact' | 'spacious';
}

interface ThemeContextType {
  theme: Theme;
  settings: ThemeSettings;
  updateSettings: (newSettings: Partial<ThemeSettings>) => void;
  toggleMode: () => void;
  resetToDefault: () => void;
}

const defaultSettings: ThemeSettings = {
  mode: 'light',
  colorScheme: 'blue',
  fontSize: 'medium',
  borderRadius: 'medium',
  density: 'comfortable'
};

// Color palettes for different schemes
const colorPalettes = {
  blue: {
    primary: '#1976d2',
    secondary: '#dc004e',
    success: '#2e7d32',
    warning: '#ed6c02',
    error: '#d32f2f',
    info: '#0288d1'
  },
  green: {
    primary: '#2e7d32',
    secondary: '#9c27b0',
    success: '#2e7d32',
    warning: '#ed6c02',
    error: '#d32f2f',
    info: '#0288d1'
  },
  purple: {
    primary: '#7b1fa2',
    secondary: '#e91e63',
    success: '#2e7d32',
    warning: '#ed6c02',
    error: '#d32f2f',
    info: '#0288d1'
  },
  orange: {
    primary: '#f57c00',
    secondary: '#9c27b0',
    success: '#2e7d32',
    warning: '#ed6c02',
    error: '#d32f2f',
    info: '#0288d1'
  },
  red: {
    primary: '#d32f2f',
    secondary: '#9c27b0',
    success: '#2e7d32',
    warning: '#ed6c02',
    error: '#d32f2f',
    info: '#0288d1'
  },
  pink: {
    primary: '#c2185b',
    secondary: '#9c27b0',
    success: '#2e7d32',
    warning: '#ed6c02',
    error: '#d32f2f',
    info: '#0288d1'
  },
  indigo: {
    primary: '#303f9f',
    secondary: '#9c27b0',
    success: '#2e7d32',
    warning: '#ed6c02',
    error: '#d32f2f',
    info: '#0288d1'
  },
  teal: {
    primary: '#00796b',
    secondary: '#9c27b0',
    success: '#2e7d32',
    warning: '#ed6c02',
    error: '#d32f2f',
    info: '#0288d1'
  }
};

// Font size configurations
const fontSizeConfigs = {
  small: {
    htmlFontSize: 14,
    fontSize: 14,
    h1: 24,
    h2: 20,
    h3: 18,
    h4: 16,
    h5: 14,
    h6: 12
  },
  medium: {
    htmlFontSize: 16,
    fontSize: 16,
    h1: 28,
    h2: 24,
    h3: 20,
    h4: 18,
    h5: 16,
    h6: 14
  },
  large: {
    htmlFontSize: 18,
    fontSize: 18,
    h1: 32,
    h2: 28,
    h3: 24,
    h4: 20,
    h5: 18,
    h6: 16
  }
};

// Border radius configurations
const borderRadiusConfigs = {
  none: 0,
  small: 4,
  medium: 8,
  large: 16
};

// Density configurations
const densityConfigs = {
  comfortable: {
    spacing: 8,
    componentHeight: 40,
    componentPadding: 16
  },
  compact: {
    spacing: 4,
    componentHeight: 32,
    componentPadding: 8
  },
  spacious: {
    spacing: 16,
    componentHeight: 48,
    componentPadding: 24
  }
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const { data: session } = useSession();
  const [settings, setSettings] = useState<ThemeSettings>(defaultSettings);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('themeSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      } catch (error) {
        console.error('Failed to parse theme settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('themeSettings', JSON.stringify(settings));
  }, [settings]);

  // Create Material-UI theme based on settings
  const createMuiTheme = (settings: ThemeSettings): Theme => {
    const colors = colorPalettes[settings.colorScheme];
    const fontSize = fontSizeConfigs[settings.fontSize];
    const borderRadius = borderRadiusConfigs[settings.borderRadius];
    const density = densityConfigs[settings.density];

    // Determine actual mode (handle 'auto')
    const actualMode = settings.mode === 'auto' 
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : settings.mode;

    return createTheme({
      palette: {
        mode: actualMode,
        primary: {
          main: colors.primary,
          light: actualMode === 'dark' ? colors.primary : undefined,
          dark: actualMode === 'dark' ? colors.primary : undefined,
          contrastText: actualMode === 'dark' ? '#fff' : '#fff'
        },
        secondary: {
          main: colors.secondary,
          light: actualMode === 'dark' ? colors.secondary : undefined,
          dark: actualMode === 'dark' ? colors.secondary : undefined,
          contrastText: '#fff'
        },
        success: {
          main: colors.success,
          light: actualMode === 'dark' ? colors.success : undefined,
          dark: actualMode === 'dark' ? colors.success : undefined,
          contrastText: '#fff'
        },
        warning: {
          main: colors.warning,
          light: actualMode === 'dark' ? colors.warning : undefined,
          dark: actualMode === 'dark' ? colors.warning : undefined,
          contrastText: '#fff'
        },
        error: {
          main: colors.error,
          light: actualMode === 'dark' ? colors.error : undefined,
          dark: actualMode === 'dark' ? colors.error : undefined,
          contrastText: '#fff'
        },
        info: {
          main: colors.info,
          light: actualMode === 'dark' ? colors.info : undefined,
          dark: actualMode === 'dark' ? colors.info : undefined,
          contrastText: '#fff'
        },
        background: {
          default: actualMode === 'dark' ? '#121212' : '#fafafa',
          paper: actualMode === 'dark' ? '#1e1e1e' : '#fff'
        },
        text: {
          primary: actualMode === 'dark' ? '#fff' : 'rgba(0, 0, 0, 0.87)',
          secondary: actualMode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)'
        }
      },
      typography: {
        htmlFontSize: fontSize.htmlFontSize,
        fontSize: fontSize.fontSize,
        h1: {
          fontSize: fontSize.h1,
          fontWeight: 600
        },
        h2: {
          fontSize: fontSize.h2,
          fontWeight: 600
        },
        h3: {
          fontSize: fontSize.h3,
          fontWeight: 600
        },
        h4: {
          fontSize: fontSize.h4,
          fontWeight: 600
        },
        h5: {
          fontSize: fontSize.h5,
          fontWeight: 600
        },
        h6: {
          fontSize: fontSize.h6,
          fontWeight: 600
        }
      },
      shape: {
        borderRadius: borderRadius
      },
      spacing: density.spacing,
      components: {
        MuiButton: {
          styleOverrides: {
            root: {
              height: density.componentHeight,
              padding: `0 ${density.componentPadding}px`,
              borderRadius: borderRadius,
              textTransform: 'none',
              fontWeight: 500
            }
          }
        },
        MuiTextField: {
          styleOverrides: {
            root: {
              '& .MuiOutlinedInput-root': {
                height: density.componentHeight,
                borderRadius: borderRadius
              }
            }
          }
        },
        MuiCard: {
          styleOverrides: {
            root: {
              borderRadius: borderRadius * 2,
              boxShadow: actualMode === 'dark' 
                ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
                : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }
          }
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              borderRadius: borderRadius
            }
          }
        },
        MuiChip: {
          styleOverrides: {
            root: {
              borderRadius: borderRadius
            }
          }
        },
        MuiAppBar: {
          styleOverrides: {
            root: {
              backgroundColor: actualMode === 'dark' ? '#1e1e1e' : '#fff',
              color: actualMode === 'dark' ? '#fff' : 'rgba(0, 0, 0, 0.87)',
              boxShadow: actualMode === 'dark' 
                ? '0 2px 4px rgba(0, 0, 0, 0.3)'
                : '0 2px 4px rgba(0, 0, 0, 0.1)'
            }
          }
        }
      }
    });
  };

  const theme = createMuiTheme(settings);

  const updateSettings = (newSettings: Partial<ThemeSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const toggleMode = () => {
    setSettings(prev => ({
      ...prev,
      mode: prev.mode === 'light' ? 'dark' : prev.mode === 'dark' ? 'auto' : 'light'
    }));
  };

  const resetToDefault = () => {
    setSettings(defaultSettings);
  };

  const value: ThemeContextType = {
    theme,
    settings,
    updateSettings,
    toggleMode,
    resetToDefault
  };

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
