import { lightColors, darkColors, type Colors } from './colors';
import { typography, type Typography } from './typography';
import { spacing, borderRadius, type Spacing, type BorderRadius } from './spacing';

export interface Theme {
  colors: Colors;
  typography: Typography;
  spacing: Spacing;
  borderRadius: BorderRadius;
  isDark: boolean;
}

export const lightTheme: Theme = {
  colors: lightColors,
  typography,
  spacing,
  borderRadius,
  isDark: false,
};

export const darkTheme: Theme = {
  colors: darkColors,
  typography,
  spacing,
  borderRadius,
  isDark: true,
};

export { lightColors, darkColors, typography, spacing, borderRadius };