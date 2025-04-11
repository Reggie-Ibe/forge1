// src/theme.js
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#e53935', // vivid red
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#9e9e9e', // neutral grey
      contrastText: '#000000',
    },
    background: {
      default: '#121212', // black base
      paper: '#1e1e1e',   // slightly lighter for cards and panels
    },
    text: {
      primary: '#ffffff',
      secondary: '#bdbdbd',
    },
    error: {
      main: '#ff5252',
    },
    warning: {
      main: '#ffa726',
    },
    info: {
      main: '#29b6f6',
    },
    success: {
      main: '#66bb6a',
    },
    divider: '#424242',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: 14,
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1e1e1e',
          color: '#ffffff',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#1e1e1e',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#1e1e1e',
          color: '#ffffff',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        containedPrimary: {
          backgroundColor: '#e53935',
          '&:hover': {
            backgroundColor: '#d32f2f',
          },
        },
        containedSecondary: {
          backgroundColor: '#757575',
          '&:hover': {
            backgroundColor: '#616161',
          },
        },
      },
    },
  },
});

export default theme;
