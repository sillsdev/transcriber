import React from 'react';
import { Router } from 'react-router-dom';
import { setGlobal, useGlobal } from 'reactn';
import { DataProvider } from 'react-orbitjs';
import { Provider } from 'react-redux';
import store from '../store';
import { createMuiTheme, MuiThemeProvider } from '@material-ui/core';
import Store from '@orbit/store';
import { Schema } from '@orbit/data';
import { schema, keyMap } from '../schema';
import history from '../history';
import { render, fireEvent, cleanup, waitForElement } from 'react-testing-library';
import 'jest-dom/extend-expect';
import ScriptureTable from '../components/ScriptureTable';

const theme = createMuiTheme({});
  
const dataStore = new Store({ schema, keyMap });
  
const globals = {
    organization: null,
    project: null,
    plan: null,
    user: null,
    initials: null,
    lang: 'en',
    dataStore: dataStore,
    schema: schema,
    keyMap: keyMap,
}
setGlobal(globals);
  
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

const addOneSection = async () => {
    const plan = {
        type: 'plan',
        attributes: {
            name: 'Genesis',
        },
    } as any;
    (schema as Schema).initializeRecord(plan)
    setGlobal({...globals, plan: plan.id})
    await (dataStore as Store).update(t => t.addRecord(plan));
    const section = {
        type: 'section',
        attributes: {
            sequencenum: 1,
            name: 'Creation',
        }
    } as any;
    (schema as Schema).initializeRecord(section);
    await (dataStore as Store).update(t => t.addRecord(section));
    await (dataStore as Store).update(t => t.replaceRelatedRecord(
        {type: 'section', id: section.id},
        'plan',
        {type: 'plan', id: plan.id}
    ));
    // let sections = await (dataStore as Store).query(q => q.findRecords('section'))
    // console.log(sections)
}

afterEach(cleanup);

test('can render ScriptureTable snapshot', async () => {
    const { getByText, container } = render(tree);
    const TestScriptureTable = await waitForElement(() =>
        getByText(/^Section$/i),
    );
    expect(container.firstChild).toMatchSnapshot();
});

test('ScriptureTable renders on section line', async () => {
    await addOneSection();
    const { getByText } = render(tree);
    const TestScriptureTable = await waitForElement(() =>
        getByText(/^Creation$/i),
    );
    expect(getByText(/^Creation$/i)).toHaveTextContent('Creation');
});