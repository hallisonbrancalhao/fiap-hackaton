import { useCallback, useEffect, useState } from 'react';
import type { MaterialColorScheme, ColorRole } from '../../shared/types/ColorTypes';

export const useTheme = () => {
  const [colorScheme, setColorScheme] = useState<MaterialColorScheme | null>(null);

  useEffect(() => {
    const initializeColorScheme = () => {
      const root = document.documentElement;
      const computedStyle = getComputedStyle(root);
      
      const scheme: MaterialColorScheme = {
        // Primary Colors
        primary: computedStyle.getPropertyValue('--color-primary').trim() || '#006E2C',
        onPrimary: computedStyle.getPropertyValue('--color-on-primary').trim() || '#FFFFFF',
        primaryContainer: computedStyle.getPropertyValue('--color-primary-container').trim() || '#1ED760',
        onPrimaryContainer: computedStyle.getPropertyValue('--color-on-primary-container').trim() || '#006E2C',

        // Secondary Colors
        secondary: computedStyle.getPropertyValue('--color-secondary').trim() || '#226C34',
        onSecondary: computedStyle.getPropertyValue('--color-on-secondary').trim() || '#FFFFFF',
        secondaryContainer: computedStyle.getPropertyValue('--color-secondary-container').trim() || '#A5F2AB',
        onSecondaryContainer: computedStyle.getPropertyValue('--color-on-secondary-container').trim() || '#226C34',

        // Tertiary Colors
        tertiary: computedStyle.getPropertyValue('--color-tertiary').trim() || '#006689',
        onTertiary: computedStyle.getPropertyValue('--color-on-tertiary').trim() || '#FFFFFF',
        tertiaryContainer: computedStyle.getPropertyValue('--color-tertiary-container').trim() || '#4FC7FF',
        onTertiaryContainer: computedStyle.getPropertyValue('--color-on-tertiary-container').trim() || '#006689',

        // Surface Colors
        surfaceDim: computedStyle.getPropertyValue('--color-surface-dim').trim() || '#DDD9D9',
        surface: computedStyle.getPropertyValue('--color-surface').trim() || '#FCF8F8',
        surfaceContainerLowest: computedStyle.getPropertyValue('--color-surface-container-lowest').trim() || '#FFFFFF',
        surfaceContainerLow: computedStyle.getPropertyValue('--color-surface-container-low').trim() || '#F6F3F2',
        surfaceContainer: computedStyle.getPropertyValue('--color-surface-container').trim() || '#F1EDEC',
        surfaceContainerHigh: computedStyle.getPropertyValue('--color-surface-container-high').trim() || '#EBE7E7',
        surfaceContainerHighest: computedStyle.getPropertyValue('--color-surface-container-highest').trim() || '#E5E2E1',
        onSurface: computedStyle.getPropertyValue('--color-on-surface').trim() || '#1C1B1B',
        onSurfaceVariant: computedStyle.getPropertyValue('--color-on-surface-variant').trim() || '#444748',
        outline: computedStyle.getPropertyValue('--color-outline').trim() || '#747878',
        outlineVariant: computedStyle.getPropertyValue('--color-outline-variant').trim() || '#C4C7C8',

        // Error Colors
        error: computedStyle.getPropertyValue('--color-error').trim() || '#BA1A1A',
        onError: computedStyle.getPropertyValue('--color-on-error').trim() || '#FFFFFF',
        errorContainer: computedStyle.getPropertyValue('--color-error-container').trim() || '#FFDAD6',

        // Additional Colors
        scrim: computedStyle.getPropertyValue('--color-scrim').trim() || '#000000',
        shadow: computedStyle.getPropertyValue('--color-shadow').trim() || '#000000'
      };

      setColorScheme(scheme);
    };

    initializeColorScheme();
  }, []);

  const getColor = useCallback((role: ColorRole): string => {
    if (!colorScheme) return '';
    return colorScheme[role];
  }, [colorScheme]);

  const setColor = useCallback((role: ColorRole, value: string) => {
    const root = document.documentElement;
    const cssProperty = `--color-${role.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
    root.style.setProperty(cssProperty, value);
    
    // Update local state
    if (colorScheme) {
      setColorScheme(prev => prev ? { ...prev, [role]: value } : null);
    }
  }, [colorScheme]);

  /**
   * Apply a complete color scheme
   */
  const applyColorScheme = useCallback((scheme: MaterialColorScheme) => {
    const root = document.documentElement;
    
    Object.entries(scheme).forEach(([role, value]) => {
      const cssProperty = `--color-${role.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      root.style.setProperty(cssProperty, value);
    });
    
    setColorScheme(scheme);
  }, []);

  /**
   * Reset to default color scheme
   */
  const resetToDefault = useCallback(() => {
    const root = document.documentElement;
    
    // Reset all CSS custom properties to their default values
    const defaultValues = {
      '--color-primary': '#006E2C',
      '--color-on-primary': '#FFFFFF',
      '--color-primary-container': '#1ED760',
      '--color-on-primary-container': '#006E2C',
      '--color-secondary': '#226C34',
      '--color-on-secondary': '#FFFFFF',
      '--color-secondary-container': '#A5F2AB',
      '--color-on-secondary-container': '#226C34',
      '--color-tertiary': '#006689',
      '--color-on-tertiary': '#FFFFFF',
      '--color-tertiary-container': '#4FC7FF',
      '--color-on-tertiary-container': '#006689',
      '--color-surface-dim': '#DDD9D9',
      '--color-surface': '#FCF8F8',
      '--color-surface-container-lowest': '#FFFFFF',
      '--color-surface-container-low': '#F6F3F2',
      '--color-surface-container': '#F1EDEC',
      '--color-surface-container-high': '#EBE7E7',
      '--color-surface-container-highest': '#E5E2E1',
      '--color-on-surface': '#1C1B1B',
      '--color-on-surface-variant': '#444748',
      '--color-outline': '#747878',
      '--color-outline-variant': '#C4C7C8',
      '--color-error': '#BA1A1A',
      '--color-on-error': '#FFFFFF',
      '--color-error-container': '#FFDAD6',
      '--color-scrim': '#000000',
      '--color-shadow': '#000000'
    };

    Object.entries(defaultValues).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });

    // Re-initialize the color scheme
    window.location.reload();
  }, []);

  return {
    colorScheme,
    getColor,
    setColor,
    applyColorScheme,
    resetToDefault,
    isInitialized: !!colorScheme
  };
};
