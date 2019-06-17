import React from 'react';
import { Router } from 'react-router-dom';
import { setGlobal } from 'reactn';
import { DataProvider } from 'react-orbitjs';
import { Provider } from 'react-redux';
import store from '../store';
import { createMuiTheme } from '@material-ui/core';
import Store from '@orbit/store';
import { Schema } from '@orbit/data';
import { schema, keyMap } from '../schema';
import history from '../history';
import { render, cleanup, waitForElement } from '@testing-library/react';
import 'jest-dom/extend-expect';
import ProjectTable from '../routes/ProjectTable';
import Auth from '../auth/Auth';

const auth = new Auth();

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
        <ProjectTable auth={auth} {...props} />
      </Router>
    </Provider>
  </DataProvider>
);

const addOrgGroupAndProject = async (orgName: string, projName: string) => {
  const organization = {
    type: 'organization',
    attributes: {
      name: orgName,
    },
  } as any;
  (schema as Schema).initializeRecord(organization);
  setGlobal({ ...globals, organization: organization.id });
  await (dataStore as Store).update(t => t.addRecord(organization));
  const group = {
    type: 'group',
    attributes: {
      name: 'Africa',
    },
  } as any;
  (schema as Schema).initializeRecord(group);
  await (dataStore as Store).update(t => t.addRecord(group));
  await (dataStore as Store).update(t =>
    t.replaceRelatedRecord({ type: 'group', id: group.id }, 'owner', {
      type: 'organization',
      id: organization.id,
    })
  );
  const project = {
    type: 'project',
    attributes: {
      name: projName,
    },
  } as any;
  (schema as Schema).initializeRecord(project);
  await (dataStore as Store).update(t => t.addRecord(project));
  await (dataStore as Store).update(t =>
    t.replaceRelatedRecord({ type: 'project', id: project.id }, 'group', {
      type: 'group',
      id: group.id,
    })
  );
};

afterEach(cleanup);

test('can render ProjectTable snapshot', async () => {
  const { getByText, container } = render(tree());
  const TestTable = await waitForElement(() => getByText(/^Description$/i));
  expect(container.firstChild).toMatchSnapshot();
});

test('displays project of selected organization', async () => {
  await addOrgGroupAndProject('SIL', 'Genesis');

  const groups = await (dataStore as Store).query(q => q.findRecords('group'));
  const projects = await (dataStore as Store).query(q =>
    q.findRecords('project')
  );

  const { getByText, container } = render(tree({ projects, groups }));
  const TestTable = await waitForElement(() => getByText(/^Genesis$/i));
  // expect(getByText(/^Genesis$/i)).toHaveTextContent('Genesis');
  const body = container.querySelector('tbody');
  const projectButtons = body && body.querySelectorAll('button');
  projectButtons &&
    projectButtons.forEach(i => {
      if (i.innerText && /^[a-z]/i.test(i.innerText))
        expect(i.innerText).toBe('Genesis');
    });
});

test('displays only projects of selected organization', async () => {
  await addOrgGroupAndProject('SIL', 'Genesis');
  await addOrgGroupAndProject('FCBH', 'Luke');

  const groups = await (dataStore as Store).query(q => q.findRecords('group'));
  const projects = await (dataStore as Store).query(q =>
    q.findRecords('project')
  );

  const { getByText, container } = render(tree({ projects, groups }));
  const TestTable = await waitForElement(() => getByText(/^Luke$/i));
  const body = container.querySelector('tbody');
  const projectButtons = body && body.querySelectorAll('button');
  projectButtons &&
    projectButtons.forEach(i => {
      expect(i.innerText).not.toBe('Genesis');
    });
});
