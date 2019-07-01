import React from 'react';
import { Router } from 'react-router-dom';
import { setGlobal } from 'reactn';
import { DataProvider } from 'react-orbitjs';
import { Provider } from 'react-redux';
import store from '../store';
import { createMuiTheme } from '@material-ui/core';
import Store from '@orbit/store';
import { schema, keyMap } from '../schema';
import history from '../history';
import { render, cleanup, waitForElement } from '@testing-library/react';
import 'jest-dom/extend-expect';
import MediaTab from '../components/MediaTab';

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
};
setGlobal(globals);

const tree = (props?: any) => (
  <DataProvider dataStore={dataStore}>
    <Provider store={store}>
      <Router history={history}>
        <MediaTab {...props} />
      </Router>
    </Provider>
  </DataProvider>
);

const addMediaFile = async () => {
  const mediaFile = {
    type: 'mediafile',
    attributes: {
      originalFile: 'PAT-LUK-001-001004v01.mp3',
    },
  } as any;
  schema.initializeRecord(mediaFile);
  await dataStore.update(t => t.addRecord(mediaFile));
  return mediaFile.id as string;
};

const addPassageAndSection = async (mediaFileId: string) => {
  const passage = {
    type: 'passage',
    attributes: {
      sequencenum: 1,
      book: 'Luke',
      reference: '1:1-4',
      position: 0,
      state: 'initial',
      hold: false,
      title: 'Introduction',
    },
  } as any;
  schema.initializeRecord(passage);
  await dataStore.update(t => t.addRecord(passage));
  await dataStore.update(t =>
    t.replaceRelatedRecord({ type: 'mediafile', id: mediaFileId }, 'passage', {
      type: 'passage',
      id: passage.id,
    })
  );
  const section = {
    type: 'section',
    attributes: {
      name: 'Jesus is coming',
    },
  } as any;
  schema.initializeRecord(section);
  await dataStore.update(t => t.addRecord(section));
  const passageSection = {
    type: 'passagesection',
  } as any;
  schema.initializeRecord(passageSection);
  await dataStore.update(t => t.addRecord(passageSection));
  await dataStore.update(t =>
    t.replaceRelatedRecord(
      { type: 'passagesection', id: passageSection.id },
      'passage',
      { type: 'passage', id: passage.id }
    )
  );
  await dataStore.update(t =>
    t.replaceRelatedRecord(
      { type: 'passagesection', id: passageSection.id },
      'section',
      { type: 'section', id: section.id }
    )
  );
};

afterEach(cleanup);

test('can render MediaTab snapshot', async () => {
  const { getByText, container } = render(tree());
  const TestMediaTab = await waitForElement(() => getByText(/^File Name$/i));
  expect(container.firstChild).toMatchSnapshot();
  expect(getByText(/No Data/i)).toHaveTextContent('No data');
});

test('media files listed even if no passage', async () => {
  await addMediaFile();

  const { getByText } = render(tree());
  const TestMediaTab = await waitForElement(() => getByText(/^File Name$/i));
  expect(getByText(/PAT-LUK-001-001004v01.mp3/i)).toHaveTextContent(
    'PAT-LUK-001-001004v01.mp3'
  );
});

test('media files passage and section data listed if present', async () => {
  const mediaFileId = await addMediaFile();
  await addPassageAndSection(mediaFileId);

  const { getByText, getAllByText } = render(tree());
  const TestMediaTab = await waitForElement(() =>
    getAllByText(/^PAT-LUK-001-001004v01.mp3$/i)
  );
  expect(getByText(/Jesus is coming/i)).toHaveTextContent('Jesus is coming');
});
