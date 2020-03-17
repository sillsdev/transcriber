import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import { connect } from 'react-redux';
import {
  IState,
  Passage,
  Section,
  User,
  IAssignmentTableStrings,
  IActivityStateStrings,
  Role,
} from '../model';
import localStrings from '../selector/localize';
import { withData, WithDataProps } from '../mods/react-orbitjs';
import { QueryBuilder, TransformBuilder } from '@orbit/data';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import { Button } from '@material-ui/core';
import FilterIcon from '@material-ui/icons/FilterList';
import SelectAllIcon from '@material-ui/icons/SelectAll';
import SnackBar from './SnackBar';
import Confirm from './AlertDialog';
import TreeGrid from './TreeGrid';
import related from '../utils/related';
import Auth from '../auth/Auth';
import './AssignmentTable.css';
import AssignSection from './AssignSection';
import {
  sectionDescription,
  sectionEditorName,
  sectionTranscriberName,
  sectionCompare,
} from '../utils';
import { passageDescription, passageCompare } from '../utils';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    container: {
      display: 'flex',
    },
    paper: {},
    actions: theme.mixins.gutters({
      paddingBottom: 16,
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'flex-end',
    }) as any,
    grow: {
      flexGrow: 1,
    },
    button: {
      margin: theme.spacing(1),
      variant: 'outlined',
      color: 'primary',
    },
    icon: {
      marginLeft: theme.spacing(1),
    },
  })
);

interface IRow {
  id: string;
  name: string;
  state: string;
  transcriber: string;
  editor: string;
  passages: string;
  parentId: string;
}
const getChildRows = (row: any, rootRows: any[]) => {
  const childRows = rootRows.filter(r => r.parentId === (row ? row.id : ''));
  return childRows.length ? childRows : null;
};

const getAssignments = (
  plan: string,
  passages: Array<Passage>,
  sections: Array<Section>,
  users: Array<User>,
  activityState: IActivityStateStrings
) => {
  let sectionRow: IRow;
  const rowData: IRow[] = [];
  const plansections = sections
    .filter(s => related(s, 'plan') === plan && s.attributes)
    .sort(sectionCompare);

  plansections.forEach(function(section) {
    sectionRow = {
      id: section.id,
      name: sectionDescription(section),
      state: '',
      editor: sectionEditorName(section, users),
      transcriber: sectionTranscriberName(section, users),
      passages: '0', //string so we can have blank, alternatively we could format in the tree to not show on passage rows
      parentId: '',
    };
    rowData.push(sectionRow);
    const sectionps = passages
      .filter(p => related(p, 'section') === section.id)
      .sort(passageCompare);
    sectionRow.passages = sectionps.length.toString();
    sectionps.forEach(function(passage: Passage) {
      const state = passage.attributes
        ? activityState.getString(passage.attributes.state)
        : '';
      rowData.push({
        id: passage.id,
        name: passageDescription(passage),
        state: state,
        editor: '',
        transcriber: '',
        passages: '',
        parentId: section.id,
      } as IRow);
    });
  });
  return rowData as Array<IRow>;
};

interface IStateProps {
  activityState: IActivityStateStrings;
  t: IAssignmentTableStrings;
}

interface IRecordProps {
  passages: Array<Passage>;
  sections: Array<Section>;
  users: Array<User>;
  roles: Array<Role>;
}

interface IProps extends IStateProps, IRecordProps, WithDataProps {
  action?: (what: string, where: number[]) => boolean;
  auth: Auth;
}

export function AssignmentTable(props: IProps) {
  const { activityState, t, passages, sections, users, roles } = props;
  const [memory] = useGlobal('memory');
  const classes = useStyles();
  const [projRole] = useGlobal('projRole');
  const [plan] = useGlobal('plan');
  const [message, setMessage] = useState(<></>);
  const [data, setData] = useState(Array<IRow>());
  const [check, setCheck] = useState(Array<number>());
  const [confirmAction, setConfirmAction] = useState('');

  const columnDefs = [
    { name: 'name', title: t.section },
    { name: 'state', title: t.sectionstate },
    { name: 'passages', title: t.passages },
    { name: 'transcriber', title: t.transcriber },
    { name: 'editor', title: t.editor },
  ];
  const columnWidths = [
    { columnName: 'name', width: 300 },
    { columnName: 'state', width: 150 },
    { columnName: 'passages', width: 100 },
    { columnName: 'transcriber', width: 200 },
    { columnName: 'editor', width: 200 },
  ];

  const [filter, setFilter] = useState(false);
  const [assignSectionVisible, setAssignSectionVisible] = useState(false);

  const handleMessageReset = () => {
    setMessage(<></>);
  };

  const handleAssignSection = (status: boolean) => (e: any) => {
    if (check.length === 0) {
      setMessage(<span>{t.selectRowsToAssign}</span>);
    } else {
      setAssignSectionVisible(status);
    }
  };
  const handleRemoveAssignments = (e: any) => {
    if (check.length === 0) {
      setMessage(<span>{t.selectRowsToRemove}</span>);
    } else {
      let work = false;
      check.forEach(i => {
        const row = data[i];
        if (row.editor !== '' || row.transcriber !== '') work = true;
      });
      if (!work) {
        setMessage(<span>{t.selectRowsToRemove}</span>);
      } else {
        setConfirmAction(t.delete + '? (' + check.length + ')');
      }
    }
  };
  const getSelectedSections = () => {
    let selected = Array<Section>();
    let one: any;
    check.forEach(c => {
      one = sections.find(function(s) {
        return c <= data.length ? s.id === data[c].id : undefined;
      });
      if (one !== undefined) selected.push(one);
    });
    //setSelectedSections(selected);
    return selected;
  };

  const handleRemoveAssignmentsConfirmed = () => {
    setConfirmAction('');
    let sections = getSelectedSections();
    sections.forEach(async s => {
      await memory.update((t: TransformBuilder) => [
        t.replaceRelatedRecord({ type: 'section', id: s.id }, 'transcriber', {
          type: 'user',
          id: '',
        }),
        t.replaceRelatedRecord({ type: 'section', id: s.id }, 'editor', {
          type: 'user',
          id: '',
        }),
      ]);
    });
  };
  const handleRemoveAssignmentsRefused = () => setConfirmAction('');

  const handleCheck = (checks: Array<number>) => {
    setCheck(checks);
  };

  const handleFilter = () => setFilter(!filter);

  useEffect(() => {
    setData(getAssignments(plan, passages, sections, users, activityState));
  }, [plan, passages, sections, users, roles, activityState]);

  return (
    <div id="AssignmentTable" className={classes.container}>
      <div className={classes.paper}>
        <div className={classes.actions}>
          {projRole === 'admin' && (
            <>
              <Button
                key="assign"
                aria-label={t.assignSec}
                variant="outlined"
                color="primary"
                className={classes.button}
                onClick={handleAssignSection(true)}
                title={t.assignSec}
              >
                {t.assignSec}
              </Button>
              <Button
                key="remove"
                aria-label={t.removeSec}
                variant="outlined"
                color="primary"
                className={classes.button}
                onClick={handleRemoveAssignments}
                title={t.removeSec}
              >
                {t.removeSec}
              </Button>
            </>
          )}
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
        <TreeGrid
          columns={columnDefs}
          columnWidths={columnWidths}
          rows={data}
          getChildRows={getChildRows}
          pageSizes={[]}
          tableColumnExtensions={[
            { columnName: 'passages', align: 'right' },
            { columnName: 'name', wordWrapEnabled: true },
          ]}
          groupingStateColumnExtensions={[
            { columnName: 'name', groupingEnabled: false },
            { columnName: 'passages', groupingEnabled: false },
          ]}
          sorting={[{ columnName: 'name', direction: 'asc' }]}
          treeColumn={'name'}
          showfilters={filter}
          showgroups={filter}
          select={handleCheck}
        />{' '}
      </div>
      <AssignSection
        sections={getSelectedSections()}
        visible={assignSectionVisible}
        closeMethod={handleAssignSection(false)}
      />
      {confirmAction !== '' ? (
        <Confirm
          title={t.delete}
          text={confirmAction}
          yesResponse={handleRemoveAssignmentsConfirmed}
          noResponse={handleRemoveAssignmentsRefused}
        />
      ) : (
        <></>
      )}
      <SnackBar {...props} message={message} reset={handleMessageReset} />
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'assignmentTable' }),
  activityState: localStrings(state, { layout: 'activityState' }),
});

const mapRecordsToProps = {
  passages: (q: QueryBuilder) => q.findRecords('passage'),
  sections: (q: QueryBuilder) => q.findRecords('section'),
  users: (q: QueryBuilder) => q.findRecords('user'),
  roles: (q: QueryBuilder) => q.findRecords('role'),
};

export default withData(mapRecordsToProps)(
  connect(mapStateToProps)(AssignmentTable) as any
) as any;
