import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import { connect } from 'react-redux';
import {
  IState,
  GroupMembership,
  Passage,
  PassageSection,
  Plan,
  Project,
  Role,
  Section,
  IActivityStateStrings,
  IToDoTableStrings,
} from '../model';
import localStrings from '../selector/localize';
import { withData } from 'react-orbitjs';
import { QueryBuilder } from '@orbit/data';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import { Button } from '@material-ui/core';
import EditIcon from '@material-ui/icons/Edit';
import FilterIcon from '@material-ui/icons/FilterList';
import SelectAllIcon from '@material-ui/icons/SelectAll';
import { Table } from '@devexpress/dx-react-grid-material-ui';
import ShapingTable from './ShapingTable';
import SnackBar from './SnackBar';
import {
  related,
  hasRelated,
  sectionDescription,
  passageDescription,
} from '../utils';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
    },
    container: {
      display: 'flex',
      justifyContent: 'center',
    },
    paper: theme.mixins.gutters({
      display: 'flex',
      flexDirection: 'column',
      alignContent: 'center',
    }),
    grow: {
      flexGrow: 1,
    },
    dialogHeader: theme.mixins.gutters({
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
    }),
    editIcon: {
      fontSize: 16,
    },
    link: {},
    button: {},
    icon: {},
  })
);

interface IRow {
  id: string;
  plan: string;
  section: string;
  passage: string;
  state: string;
  assigned: string;
}

interface IStateProps {
  activityState: IActivityStateStrings;
  t: IToDoTableStrings;
}

interface IRecordProps {
  groupMemberships: GroupMembership[];
  passageSections: Array<PassageSection>;
  passages: Array<Passage>;
  plans: Array<Plan>;
  projects: Project[];
  roles: Array<Role>;
  sections: Array<Section>;
}

interface IProps extends IStateProps, IRecordProps {}

export function ToDoTable(props: IProps) {
  const {
    activityState,
    groupMemberships,
    passageSections,
    passages,
    plans,
    projects,
    roles,
    sections,
    t,
  } = props;
  const classes = useStyles();
  const [user] = useGlobal('user');
  const [project] = useGlobal('project');
  const [columns] = useState([
    { name: 'plan', title: t.plan },
    { name: 'section', title: t.section },
    { name: 'passage', title: t.passage },
    { name: 'state', title: t.state },
    { name: 'assigned', title: t.assigned },
  ]);
  const [columnWidth] = useState([
    { columnName: 'plan', width: 100 },
    { columnName: 'section', width: 200 },
    { columnName: 'passage', width: 150 },
    { columnName: 'state', width: 150 },
    { columnName: 'assigned', width: 150 },
  ]);
  const [role, setRole] = useState('');

  const [rows, setRows] = useState(Array<IRow>());
  const [filter, setFilter] = useState(false);
  const [message, setMessage] = useState(<></>);

  const handleMessageReset = () => {
    setMessage(<></>);
  };
  const handleFilter = () => setFilter(!filter);
  const handleSelect = (passageId: string) => (e: any) => {};
  const getPlanName = (plan: Plan) => {
    return plan.attributes ? plan.attributes.name : '';
  };
  const addTasks = (
    state: string,
    role: string,
    project: string,
    plans: Plan[],
    passages: Passage[],
    passageSections: PassageSection[],
    sections: Section[],
    rowList: IRow[]
  ) => {
    const readyRecs = passages.filter(
      p => p.attributes && p.attributes.state === state
    );
    readyRecs.forEach(p => {
      const passSecRecs = passageSections.filter(
        s => hasRelated(p, 'sections', s.id).length !== 0
      );
      if (passSecRecs.length > 0) {
        const secId = related(passSecRecs[0], 'section');
        const secRecs = sections.filter(sr => sr.id === secId);
        if (secRecs.length > 0) {
          const planId = related(secRecs[0], 'plan');
          const planRecs = plans.filter(pl => pl.id === planId);
          if (planRecs.length > 0) {
            if (related(planRecs[0], 'project') === project) {
              const assignee = related(secRecs[0], role);
              if (!assignee || assignee === '' || assignee === user) {
                rowList.push({
                  id: p.id,
                  plan: getPlanName(planRecs[0]),
                  section: sectionDescription(secRecs[0]),
                  passage: passageDescription(p),
                  state: activityState.getString(state),
                  assigned: assignee === user ? t.yes : t.no,
                });
              }
            }
          }
        }
      }
    });
  };

  useEffect(() => {
    const projectRecs = projects.filter(p => p.id === project);
    if (projectRecs.length === 0) {
      setRole('');
      return;
    }
    const groupId = related(projectRecs[0], 'group');
    const memberships = groupMemberships.filter(
      gm => related(gm, 'group') === groupId && related(gm, 'user') === user
    );
    if (memberships.length === 0) {
      setRole('');
      return;
    }
    const memberRole: string = related(memberships[0], 'role');
    const roleRecs = roles.filter(r => r.id === memberRole);
    setRole(
      roleRecs.length > 0 && roleRecs[0].attributes
        ? roleRecs[0].attributes.roleName
        : ''
    );
  }, [user, project, projects, groupMemberships, roles]);

  useEffect(() => {
    const rowList: IRow[] = [];
    if (role !== '') {
      addTasks(
        'transcribeReady',
        'transcriber',
        project,
        plans,
        passages,
        passageSections,
        sections,
        rowList
      );
      if (role !== 'Transcriber') {
        addTasks(
          'transcribed',
          'reviewer',
          project,
          plans,
          passages,
          passageSections,
          sections,
          rowList
        );
      }
    }
    setRows(rowList);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plans, passages, passageSections, sections, role, project]);

  interface ICell {
    value: string;
    style?: React.CSSProperties;
    row: IRow;
    column: any;
    tableRow: any;
    tableColumn: any;
  }

  const LinkCell = ({ value, style, ...restProps }: ICell) => (
    <Table.Cell {...restProps} style={{ ...style }} value>
      <Button
        key={value}
        aria-label={value}
        color="primary"
        className={classes.link}
        onClick={handleSelect(restProps.row.id)}
      >
        {value}
        <EditIcon className={classes.editIcon} />
      </Button>
    </Table.Cell>
  );

  const Cell = (props: ICell) => {
    const { column } = props;
    if (column.name === 'passage') {
      return <LinkCell {...props} />;
    }
    return <Table.Cell {...props} />;
  };

  return (
    <div className={classes.root}>
      <div className={classes.container}>
        <div className={classes.paper}>
          <div className={classes.dialogHeader}>
            <div className={classes.grow}>{'\u00A0'}</div>
            <Button
              key="filter"
              aria-label={t.filter}
              variant="outlined"
              color="primary"
              className={classes.button}
              onClick={handleFilter}
              title={'Show/Hide filter rows'}
            >
              {t.filter}
              {filter ? (
                <SelectAllIcon className={classes.icon} />
              ) : (
                <FilterIcon className={classes.icon} />
              )}
            </Button>
          </div>
          <ShapingTable
            columns={columns}
            columnWidths={columnWidth}
            dataCell={Cell}
            sorting={[
              { columnName: 'plan', direction: 'asc' },
              { columnName: 'section', direction: 'asc' },
              { columnName: 'passage', direction: 'asc' },
            ]}
            shaping={filter}
            rows={rows}
          />
        </div>
      </div>
      <SnackBar {...props} message={message} reset={handleMessageReset} />
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'toDoTable' }),
  activityState: localStrings(state, { layout: 'activityState' }),
});

const mapRecordsToProps = {
  groupMemberships: (q: QueryBuilder) => q.findRecords('groupmembership'),
  passageSections: (q: QueryBuilder) => q.findRecords('passagesection'),
  passages: (q: QueryBuilder) => q.findRecords('passage'),
  plans: (q: QueryBuilder) => q.findRecords('plan'),
  projects: (q: QueryBuilder) => q.findRecords('project'),
  roles: (q: QueryBuilder) => q.findRecords('role'),
  sections: (q: QueryBuilder) => q.findRecords('section'),
};

export default withData(mapRecordsToProps)(connect(mapStateToProps)(
  ToDoTable
) as any) as any;
