import * as React from 'react';
import { hot } from 'react-hot-loader';
import { ThemeProvider, createTheme } from '@mui/material';
import DataChanges from './hoc/DataChanges';
import { UnsavedProvider } from './context/UnsavedContext';
import SnackBarProvider from './hoc/SnackBar';
import { HotKeyProvider } from './context/HotKeyContext';
import routes from './routes/NavRoutes';
export const HeadHeight = 64;

const theme = createTheme({
  palette: {
    primary: {
      main: '#135CB9',
    },
    secondary: {
      main: '#00A7E1',
    },
  },
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

export default hot(module)(App);
