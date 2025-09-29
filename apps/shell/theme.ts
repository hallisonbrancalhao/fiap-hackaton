import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

const panelTheme = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#F1F8F3',
      100: '#DDEFE2',
      200: '#C1E0C8',
      300: '#9CCEAA',
      400: '#72B986',
      500: '#4BA666',
      600: '#3F8D55',
      700: '#2F6C41',
      800: '#235336',
      900: '#173A25',
      950: '#0F2618'
    }
  },
  colorScheme: {
    light: {
      primary: {
        color: '{primary.500}',
        contrastColor: '#ffffff',
        hoverColor: '{primary.600}',
        activeColor: '{primary.700}'
      },
      secondary: {
        color: '{secondary.500}',
        contrastColor: '#ffffff',
        hoverColor: '{secondary.600}',
        activeColor: '{secondary.700}'
      },
      highlight: {
        background: '{primary.50}',
        focusBackground: '{primary.100}',
        color: '{primary.700}',
        focusColor: '{primary.800}'
      }
    },
    dark: {
      primary: {
        color: '{primary.200}',
        contrastColor: '#ffffff',
        hoverColor: '{primary.300}',
        activeColor: '{primary.400}'
      },
      secondary: {
        color: '{secondary.200}',
        contrastColor: '#ffffff',
        hoverColor: '{secondary.300}',
        activeColor: '{secondary.400}'
      },
      highlight: {
        background: '{primary.100}',
        focusBackground: '{primary.200}',
        color: '{primary.900}',
        focusColor: '{primary.950}'
      }
    }
  }
});

export default {
  preset: panelTheme,
	options: {
		darkModeSelector: false
	}
}
