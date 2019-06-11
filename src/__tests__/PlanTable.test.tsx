import React from 'react';
import { Router } from 'react-router-dom';
import { setGlobal } from 'reactn';
import { Section } from '../model';
import { DataProvider } from 'react-orbitjs';
import { Provider } from 'react-redux';
import store from '../store';
import { createMuiTheme } from '@material-ui/core';
import Store from '@orbit/store';
import { Schema } from '@orbit/data';
import { schema, keyMap } from '../schema';
import history from '../history';
import { render, fireEvent, cleanup, waitForElement } from '@testing-library/react';
import 'jest-dom/extend-expect';
import PlanTable from '../components/PlanTable';
import { MuiThemeProvider } from '@material-ui/core/styles';

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
  
const tree = (props?: any) => (
    <DataProvider dataStore={dataStore}>
      <Provider store={store}>
        <Router history={history}>
          <MuiThemeProvider theme={theme}>
            <PlanTable {...props} />
          </MuiThemeProvider>
        </Router>
      </Provider>
    </DataProvider>
);

const addProjects = async () => {
    const project1 = {
        type: 'project',
        attributes: {
            name: 'Fulfulde',
        },
    } as any;
    (schema as Schema).initializeRecord(project1)
    setGlobal({...globals, project: project1.id})
    await (dataStore as Store).update(t => t.addRecord(project1));
    const project2 = {
        type: 'project',
        attributes: {
            name: 'Ewondo',
        },
    } as any;
    (schema as Schema).initializeRecord(project2)
    await (dataStore as Store).update(t => t.addRecord(project2));
    return [project1.id, project2.id];
};

const addPlan = async (project1: string) => {
    const planType = {
        type: 'plantype',
        attributes: {
            name: 'Scripture',
        }
    } as any;
    (schema as Schema).initializeRecord(planType);
    await (dataStore as Store).update(t => t.addRecord(planType));
    const plan = {
        type: 'plan',
        attributes: {
            name: 'Genesis',
        }
    } as any;
    (schema as Schema).initializeRecord(plan);
    await (dataStore as Store).update(t => t.addRecord(plan));
    await (dataStore as Store).update(t => t.replaceRelatedRecord(
        {type: 'plan', id: plan.id},
        'plantype',
        {type: 'plantype', id: planType.id}
    ));
    await (dataStore as Store).update(t => t.replaceRelatedRecord(
        {type: 'plan', id: plan.id},
        'project',
        {type: 'project', id: project1}
    ));
    return plan.id;
};

afterEach(cleanup);

test('can render PlanTable snapshot', async () => {
    const { getByText, container } = render(tree());
    const TestPlanTable = await waitForElement(() =>
        getByText(/^Sections$/i),
    );
    expect(container.firstChild).toMatchSnapshot();
});

test('PlanTable displays plans in project name and type', async () => {
    const [project1, project2] = await addProjects();
    await addPlan(project1);

    const projects = await (dataStore as Store).query(q => q.findRecords('project'));
    const plans = await (dataStore as Store).query(q => q.findRecords('plan'));
    const sections = Array<Section>();
    const { getByText, container } = render(tree({projects, plans, sections}));
    const TestPlanTable = await waitForElement(() =>
        getByText(/^Genesis$/i),
    );
    const tbody = container.querySelector('tbody');
    const button = tbody && tbody.querySelector('button');

    expect(button).not.toBeFalsy
    expect(getByText(/^Genesis$/i)).toBeTruthy
    expect(getByText(/^Scripture$/i)).toBeTruthy
});

test('PlanTable does not display plan of another project', async () => {
    const [project1, project2] = await addProjects();
    await addPlan(project1);

    const projects = await (dataStore as Store).query(q => q.findRecords('project'));
    const plans = await (dataStore as Store).query(q => q.findRecords('plan'));
    const sections = Array<Section>();
    setGlobal({...globals, project: project2})
    const { getByText } = render(tree({projects, plans, sections}));
    const TestPlanTable = await waitForElement(() =>
        getByText(/^No Data$/i),
    );

    expect(getByText(/^No Data$/i)).toBeTruthy
});

test('Clicking Add FAB on PlanTable displays dialogue', async () => {
    const [project1, project2] = await addProjects();
    await addPlan(project1);

    const projects = await (dataStore as Store).query(q => q.findRecords('project'));
    const plans = await (dataStore as Store).query(q => q.findRecords('plan'));
    const sections = Array<Section>();
    const { getByText, getByTestId } = render(tree({projects, plans, sections}));
    const TestPlanTable = await waitForElement(() =>
        getByText(/^Genesis$/i),
    );
    fireEvent.click(getByTestId('addButton'));
    const TestDialogLaunch = await waitForElement(() =>
        getByText(/^Add a Plan$/i),
    );

    expect(getByText(/^Add a Plan$/i)).toHaveTextContent('Add a Plan');
});
