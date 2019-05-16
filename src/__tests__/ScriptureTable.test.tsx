import React from 'react';
import { Router } from 'react-router-dom';
import { setGlobal } from 'reactn';
import { DataProvider } from 'react-orbitjs';
import { Provider } from 'react-redux';
import store from '../store';
import { createMuiTheme, MuiThemeProvider } from '@material-ui/core';
import Store from '@orbit/store';
import { schema, keyMap } from '../schema';
import history from '../history';
import { render, fireEvent, cleanup, waitForElement } from 'react-testing-library';
import 'jest-dom/extend-expect';
import ScriptureTable from '../components/ScriptureTable';

  const theme = createMuiTheme({});
  
  const dataStore = new Store({ schema, keyMap });
  
  setGlobal({
    organization: null,
    project: null,
    plan: null,
    user: null,
    initials: null,
    lang: 'en',
    dataStore: dataStore,
    schema: schema,
    keyMap: keyMap,
  });
  
afterEach(cleanup);

test('can render ScriptureTable snapshot', async () => {
    const tree = (
      <DataProvider dataStore={dataStore}>
        <Provider store={store}>
          <Router history={history}>
            <MuiThemeProvider theme={theme}>
              <ScriptureTable />
            </MuiThemeProvider>
          </Router>
        </Provider>
      </DataProvider>
    );
    const { getByText, container } = render(tree);
    const TestScriptureTable = await waitForElement(() =>
        getByText(/^Section$/i),
    );
    expect(container.firstChild).toMatchSnapshot();
});