import * as React from 'react';
import { ThemeProvider, createTheme } from '@mui/material';
import DataChanges from './hoc/DataChanges';
import { UnsavedProvider } from './context/UnsavedContext';
import SnackBarProvider from './hoc/SnackBar';
import { HotKeyProvider } from './context/HotKeyContext';
import routes from './routes/NavRoutes';
import { title } from 'node:process';
export const HeadHeight = 64;

const theme = createTheme({
  palette: {
    primary: {
      main: '#135CB9', //Original: 135CB9, Better color: 1D9F90
    },
    secondary: {
      main: '#00A7E1', //Original: 00A7E1, Better color: 25CBB8
    },
  },
  typography: {
    button: {
      textTransform: 'capitalize'
    }
  }
});

function App() {
  return (
    <UnsavedProvider>
      <DataChanges>
        <SnackBarProvider>
          <HotKeyProvider>
            <ThemeProvider theme={theme}>{routes}</ThemeProvider>
          </HotKeyProvider>
        </SnackBarProvider>
      </DataChanges>
    </UnsavedProvider>
  );
}

export default App;
