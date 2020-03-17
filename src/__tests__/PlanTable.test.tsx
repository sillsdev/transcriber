import React from 'react';
import { setGlobal } from 'reactn';
import { Section, Project, Plan, PlanType } from '../model';
import { DataProvider } from '../mods/react-orbitjs';
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
import PlanTable from '../components/PlanTable';

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

const tree = (props?: any) => (
  <DataProvider dataStore={memory}>
    <Provider store={store}>
      <PlanTable {...props} />
    </Provider>
  </DataProvider>
);

const addProjects = async () => {
  const project1: Project = {
    type: 'project',
    attributes: {
      name: 'Fulfulde',
    },
  } as any;
  schema.initializeRecord(project1);
  setGlobal({ ...globals, project: project1.id });
  await memory.update(t => t.addRecord(project1));
  const project2: Project = {
    type: 'project',
    attributes: {
      name: 'Ewondo',
    },
  } as any;
  schema.initializeRecord(project2);
  await memory.update(t => t.addRecord(project2));
  return [project1, project2];
};

const addPlan = async (project1: Project) => {
  const planType: PlanType = {
    type: 'plantype',
    attributes: {
      name: 'Scripture',
    },
  } as any;
  schema.initializeRecord(planType);
  await memory.update(t => t.addRecord(planType));
  const plan: Plan = {
    type: 'plan',
    attributes: {
      name: 'Genesis',
    },
  } as any;
  schema.initializeRecord(plan);
  await memory.update(t => t.addRecord(plan));
  await memory.update(t => t.replaceRelatedRecord(plan, 'plantype', planType));
  await memory.update(t => t.replaceRelatedRecord(plan, 'project', project1));
  return plan;
};

afterEach(cleanup);

test('can render PlanTable snapshot', async () => {
  const { getByText, container } = render(tree());
  await waitForElement(() => getByText(/^Add Plan$/i));
  expect(container.firstChild).toMatchSnapshot();
});

test('PlanTable displays plans in project name and type', async () => {
  const [project1] = await addProjects();
  await addPlan(project1);

  const projects = await memory.query(q => q.findRecords('project'));
  const plans = await memory.query(q => q.findRecords('plan'));
  const sections = Array<Section>();
  const { getByText, container } = render(tree({ projects, plans, sections }));
  await waitForElement(() => getByText(/^Genesis$/i));
  const tbody = container.querySelector('tbody');
  const button = tbody && tbody.querySelector('button');

  expect(button).not.toBeFalsy();
  expect(getByText(/^Genesis$/i)).toBeTruthy();
  expect(getByText(/^Scripture/i)).toBeTruthy();
});

test('PlanTable does not display plan of another project', async () => {
  const [project1, project2] = await addProjects();
  await addPlan(project1);

  const projects = await memory.query(q => q.findRecords('project'));
  const plans = await memory.query(q => q.findRecords('plan'));
  const sections = Array<Section>();
  setGlobal({ ...globals, project: project2 });
  const { getByText } = render(tree({ projects, plans, sections }));
  await waitForElement(() => getByText(/^No Data$/i));

  expect(getByText(/^No Data$/i)).toBeTruthy();
});

test('Clicking Add FAB on PlanTable displays dialogue', async () => {
  const [project1] = await addProjects();
  await addPlan(project1);

  const projects = await memory.query(q => q.findRecords('project'));
  const plans = await memory.query(q => q.findRecords('plan'));
  const sections = Array<Section>();
  const { getByText } = render(tree({ projects, plans, sections }));
  await waitForElement(() => getByText(/^Genesis$/i));
  fireEvent.click(getByText('Add Plan'));
  await waitForElement(() => getByText(/^Type the name/i));
  expect(getByText('Add')).toBeDisabled();
});
