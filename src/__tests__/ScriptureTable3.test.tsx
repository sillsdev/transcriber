import React from 'react';
import { setGlobal } from 'reactn';
import { DataProvider } from '../mods/react-orbitjs';
import { Provider } from 'react-redux';
import configureStore from '../store';
import { memory } from '../schema';
import {
  render,
  fireEvent,
  cleanup,
  waitForElement,
} from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import ScriptureTable from '../components/ScriptureTable';

const store = configureStore();

const globals = {
  organization: null,
  orgRole: 'admin',
  project: null,
  projRole: 'admin',
  plan: null,
  tab: 0,
  group: '',
  user: null,
  lang: 'en',
  memory: memory,
};
setGlobal(globals);

const tree = (
  <DataProvider dataStore={memory}>
    <Provider store={store}>
      <ScriptureTable
        cols={{
          SectionSeq: 0,
          SectionnName: 1,
          PassageSeq: 2,
          Book: 3,
          Reference: 4,
          Title: 5,
        }}
      />
    </Provider>
  </DataProvider>
);

afterEach(cleanup);

test('ScriptureTable AddSection button adds first section', async () => {
  const { getByText, container } = render(tree);
  await waitForElement(() => getByText(/^Section$/i));
  const body = container.querySelector('tbody');
  let count = body && body.children.length;
  count = count ? count : 0;
  fireEvent.click(getByText(/Add Section/i));
  expect(body).not.toBeFalsy();
  expect(body && body.children.length).toBe(count + 2); // not condensed
  // sequence number column should be 1
  expect(body && body.childNodes[1].childNodes[1].textContent).toBe('1');
});
