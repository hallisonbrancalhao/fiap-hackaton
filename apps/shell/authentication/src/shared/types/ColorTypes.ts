export interface PrimaryColors {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
}

export interface SecondaryColors {
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
}

export interface TertiaryColors {
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
}

export interface SurfaceColors {
  surfaceDim: string;
  surface: string;
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  onSurface: string;
  onSurfaceVariant: string;
  outline: string;
  outlineVariant: string;
}

export interface ErrorColors {
  error: string;
  onError: string;
  errorContainer: string;
}

export interface AdditionalColors {
  scrim: string;
  shadow: string;
}

export interface MaterialColorScheme extends 
  PrimaryColors, 
  SecondaryColors, 
  TertiaryColors, 
  SurfaceColors, 
  ErrorColors, 
  AdditionalColors {}


export const DEFAULT_COLOR_SCHEME: MaterialColorScheme = {
  // Primary Colors
  primary: '#006E2C',
  onPrimary: '#FFFFFF',
  primaryContainer: '#1ED760',
  onPrimaryContainer: '#006E2C',

  // Secondary Colors
  secondary: '#226C34',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#A5F2AB',
  onSecondaryContainer: '#226C34',

  // Tertiary Colors
  tertiary: '#006689',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#4FC7FF',
  onTertiaryContainer: '#006689',

  // Surface Colors
  surfaceDim: '#DDD9D9',
  surface: '#FCF8F8',
  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerLow: '#F6F3F2',
  surfaceContainer: '#F1EDEC',
  surfaceContainerHigh: '#EBE7E7',
  surfaceContainerHighest: '#E5E2E1',
  onSurface: '#1C1B1B',
  onSurfaceVariant: '#444748',
  outline: '#747878',
  outlineVariant: '#C4C7C8',

  // Error Colors
  error: '#BA1A1A',
  onError: '#FFFFFF',
  errorContainer: '#FFDAD6',

  scrim: '#000000',
  shadow: '#000000'
};

export type ColorRole = keyof MaterialColorScheme;

export type CSSColorProperty = `--color-${string}`;
