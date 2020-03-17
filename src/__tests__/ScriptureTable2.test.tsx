import React from 'react';
import { setGlobal } from 'reactn';
import { DataProvider } from 'react-orbitjs';
import { Provider } from 'react-redux';
import configureStore from '../store';
import Memory from '@orbit/memory';
import { schema, keyMap } from '../schema';
import {
  render,
  fireEvent,
  cleanup,
  waitForElement,
} from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import ScriptureTable from '../components/ScriptureTable';
import { ActivityStates, Plan, Section, Passage } from '../model';

const store = configureStore();

const memory = new Memory({ schema, keyMap });

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
  schema: schema,
  keyMap: keyMap,
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

const addOneSection = async () => {
  memory.cache.reset();
  keyMap.reset();
  const plan: Plan = {
    type: 'plan',
    attributes: {
      name: 'Genesis',
    },
  } as any;
  schema.initializeRecord(plan);
  setGlobal({ ...globals, plan: plan.id });
  await memory.update(t => t.addRecord(plan));
  const section: Section = {
    type: 'section',
    attributes: {
      sequencenum: 1,
      name: 'Creation',
    },
  } as any;
  schema.initializeRecord(section);
  await memory.update(t => t.addRecord(section));
  await memory.update(t => t.replaceRelatedRecord(section, 'plan', plan));
  return section;
};

const addPassageToSection = async (section: Section) => {
  const passage: Passage = {
    type: 'passage',
    attributes: {
      sequencenum: 1,
      book: 'GEN',
      reference: '1:1-20',
      position: 0,
      state: ActivityStates.NoMedia,
      hold: false,
      title: 'Seven Days',
    },
  } as any;
  schema.initializeRecord(passage);
  await memory.update(t => [
    t.addRecord(passage),
    t.replaceRelatedRecord(passage, 'section', section),
  ]);
  return passage;
};

afterEach(cleanup);

test('ScriptureTable Select passage row', async () => {
  const section = await addOneSection();
  await addPassageToSection(section);

  const { getByText, getAllByTestId, getByTestId } = render(tree);
  await waitForElement(() => getByText(/^Creation$/i));
  const box = getAllByTestId('check')[1];
  fireEvent.click(box.querySelector('input') as HTMLElement);
  await waitForElement(() => getByTestId('checked'));
  expect(true);
});

test('ScriptureTable Delete passage row gives confirmation', async () => {
  const section = await addOneSection();
  await addPassageToSection(section);

  const { getByText, getAllByTestId, getByTestId } = render(tree);
  await waitForElement(() => getByText(/^Creation$/i));
  const box = getAllByTestId('check')[1];
  fireEvent.click(box.querySelector('input') as HTMLElement);
  await waitForElement(() => getByTestId('checked'));
  fireEvent.click(getByText(/Action/i));
  await waitForElement(() => getByText(/Delete/i));
  fireEvent.click(getByText(/Delete/i));
  await waitForElement(() => getByText(/Confirmation/i));
  expect(true);
});

test('ScriptureTable Delete passage row removes row', async () => {
  const section = await addOneSection();
  await addPassageToSection(section);

  const { getByText, getAllByTestId, getByTestId, container } = render(tree);
  await waitForElement(() => getByText(/^Creation$/i));
  const box = getAllByTestId('check')[1];
  fireEvent.click(box.querySelector('input') as HTMLElement);
  await waitForElement(() => getByTestId('checked'));
  fireEvent.click(getByText(/Action/i));
  await waitForElement(() => getByText(/Delete/i));
  fireEvent.click(getByText(/Delete/i));
  await waitForElement(() => getByText(/Confirmation/i));
  fireEvent.click(getByText(/Yes/i));
  const body = container.querySelector('tbody');
  expect(body && body.children.length).toBe(2);
});

test('ScriptureTable Delete section row removes rows', async () => {
  const section = await addOneSection();
  await addPassageToSection(section);

  const { getByText, getAllByTestId, container } = render(tree);
  await waitForElement(() => getByText(/^Creation$/i));
  const box = getAllByTestId('check')[0];
  fireEvent.click(box.querySelector('input') as HTMLElement);
  await waitForElement(() => getAllByTestId('checked'));
  expect(getAllByTestId('checked').length).toBe(2);
  fireEvent.click(getByText(/Action/i));
  await waitForElement(() => getByText(/Delete/i));
  fireEvent.click(getByText(/Delete/i));
  await waitForElement(() => getByText(/Confirmation/i));
  fireEvent.click(getByText(/Yes/i));
  const body = container.querySelector('tbody');
  expect(body && body.children.length).toBe(1); // just the header
});
