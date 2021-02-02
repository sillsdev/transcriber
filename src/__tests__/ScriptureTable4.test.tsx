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
import { ActivityStates, Plan, Section, Passage } from '../model';

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

const addOneSection = async () => {
  memory.cache.reset();
  memory.keyMap.reset();
  const plan: Plan = {
    type: 'plan',
    attributes: {
      name: 'Genesis',
    },
  } as any;
  memory.schema.initializeRecord(plan);
  setGlobal({ ...globals, plan: plan.id });
  await memory.update((t) => t.addRecord(plan));
  const section: Section = {
    type: 'section',
    attributes: {
      sequencenum: 1,
      name: 'Creation',
    },
  } as any;
  memory.schema.initializeRecord(section);
  await memory.update((t) => [
    t.addRecord(section),
    t.replaceRelatedRecord(section, 'plan', plan),
  ]);
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
  memory.schema.initializeRecord(passage);
  await memory.update((t) => [
    t.addRecord(passage),
    t.replaceRelatedRecord(passage, 'section', section),
  ]);
  return passage;
};

afterEach(cleanup);

// test('ScriptureTable AddSection button adds second section when no passages in previous section', async () => {
//   await addOneSection();

//   const { getByText, container } = render(tree);
//   await waitForElement(() => getByText(/^Creation$/i));
//   fireEvent.click(getByText(/Add Section/i));
//   const body = container.querySelector('tbody');
//   expect(body).not.toBeFalsy();
//   expect(body && body.children.length).toBe(4); // not condensed
//   // sequence number column should be 2
//   expect(body && body.children[2].children[1].textContent).toBe('2');
// });

test('ScriptureTable Delete action with nothing selected', async () => {
  const section = await addOneSection();
  await addPassageToSection(section);

  const { getByText } = render(tree);
  await waitForElement(() => getByText(/^Creation$/i));
  fireEvent.click(getByText(/Action/i));
  await waitForElement(() => getByText(/Delete/i));
  fireEvent.click(getByText(/Delete/i));
  await waitForElement(() => getByText(/Please select row/i));
  expect(true);
});
