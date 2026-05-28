import { createTheme } from '@mui/material/styles';

export const boxTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#032774',       // Azul Royal
      light: '#0a3d9e',
      dark: '#021a4a',
    },
    secondary: {
      main: '#E06820',       // Laranja Box
      light: '#f07a30',
      dark: '#b85010',
    },
    background: {
      default: '#0A0A0A',
      paper: '#111827',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#9CA3AF',
    },
  },
  typography: {
    fontFamily: '"Barlow", "Roboto", sans-serif',
    h1: { fontFamily: '"Barlow Condensed", "Roboto Condensed", sans-serif', fontWeight: 700 },
    h2: { fontFamily: '"Barlow Condensed", "Roboto Condensed", sans-serif', fontWeight: 700 },
    h3: { fontFamily: '"Barlow Condensed", "Roboto Condensed", sans-serif', fontWeight: 600 },
    h4: { fontFamily: '"Barlow Condensed", "Roboto Condensed", sans-serif', fontWeight: 600 },
    h5: { fontFamily: '"Barlow Condensed", "Roboto Condensed", sans-serif', fontWeight: 600 },
    h6: { fontFamily: '"Barlow Condensed", "Roboto Condensed", sans-serif', fontWeight: 600 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '1rem',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: '1px solid #1F2937',
        },
      },
    },
  },
});