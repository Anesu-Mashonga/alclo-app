import { createTheme } from '@mui/material/styles';

const baseTypography = {
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  h1: { fontWeight: 800, letterSpacing: '-0.02em' },
  h2: { fontWeight: 700, letterSpacing: '-0.01em' },
  h3: { fontWeight: 700, letterSpacing: '-0.01em' },
  h4: { fontWeight: 600 },
  h5: { fontWeight: 600 },
  h6: { fontWeight: 600 },
  subtitle1: { fontWeight: 500 },
  subtitle2: { fontWeight: 500 },
  button: { fontWeight: 600, textTransform: 'none', letterSpacing: '0.01em' },
};

const baseComponents = {
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        padding: '10px 20px',
        boxShadow: 'none',
        '&:hover': { boxShadow: 'none' },
      },
      containedPrimary: {
        background: 'linear-gradient(135deg, #5C6BC0 0%, #3949AB 100%)',
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 16,
        boxShadow: '0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)',
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      rounded: { borderRadius: 16 },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: { borderRadius: 8, fontWeight: 500 },
    },
  },
  MuiTextField: {
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: 12,
        },
      },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: { borderRadius: 20 },
    },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: { borderRadius: '0 20px 20px 0' },
    },
  },
};

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#5C6BC0',
      light: '#7986CB',
      dark: '#3949AB',
      contrastText: '#fff',
    },
    secondary: {
      main: '#FF7043',
      light: '#FF8A65',
      dark: '#E64A19',
      contrastText: '#fff',
    },
    success: { main: '#66BB6A' },
    warning: { main: '#FFA726' },
    error: { main: '#EF5350' },
    info: { main: '#42A5F5' },
    background: {
      default: '#F5F6FA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1A1D2E',
      secondary: '#6B7280',
    },
  },
  typography: baseTypography,
  components: baseComponents,
  shape: { borderRadius: 12 },
});

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#7986CB',
      light: '#9FA8DA',
      dark: '#5C6BC0',
      contrastText: '#fff',
    },
    secondary: {
      main: '#FF8A65',
      light: '#FFAB91',
      dark: '#FF7043',
      contrastText: '#fff',
    },
    success: { main: '#81C784' },
    warning: { main: '#FFB74D' },
    error: { main: '#EF9A9A' },
    info: { main: '#64B5F6' },
    background: {
      default: '#0F1117',
      paper: '#1A1D2E',
    },
    text: {
      primary: '#F1F3F9',
      secondary: '#9AA3B5',
    },
  },
  typography: baseTypography,
  components: {
    ...baseComponents,
    MuiButton: {
      styleOverrides: {
        ...baseComponents.MuiButton.styleOverrides,
        containedPrimary: {
          background: 'linear-gradient(135deg, #7986CB 0%, #5C6BC0 100%)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
          backgroundImage: 'none',
        },
      },
    },
  },
  shape: { borderRadius: 12 },
});
