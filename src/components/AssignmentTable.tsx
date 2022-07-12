import React, { useState, useEffect, useContext, useMemo } from 'react';
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
  BookName,
  ISharedStrings,
  RoleNames,
  MediaFile,
} from '../model';
import localStrings from '../selector/localize';
import { withData, WithDataProps } from '../mods/react-orbitjs';
import { QueryBuilder, TransformBuilder } from '@orbit/data';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import { Button, AppBar } from '@material-ui/core';
import FilterIcon from '@mui/icons-material/FilterList';
import SelectAllIcon from '@mui/icons-material/SelectAll';
import { useSnackBar } from '../hoc/SnackBar';
import Confirm from './AlertDialog';
import TreeGrid from './TreeGrid';
import Auth from '../auth/Auth';
import AssignSection from './AssignSection';
import {
  related,
  sectionDescription,
  sectionEditorName,
  sectionTranscriberName,
  sectionCompare,
  passageDescription,
  passageCompare,
  useOrganizedBy,
  usePassageState,
} from '../crud';
import { ActionHeight, tabActions, actionBar } from './PlanTabs';
import { ReplaceRelatedRecord, UpdateLastModifiedBy } from '../model/baseModel';
import { PlanContext } from '../context/PlanContext';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    container: {
      display: 'flex',
      '& tr > td > div > span.MuiButtonBase-root:nth-child(3)': {
        visibility: 'hidden',
      },
    },
    paper: {},
    bar: actionBar,
    content: {
      paddingTop: `calc(${ActionHeight}px + ${theme.spacing(2)}px)`,
    },
    actions: tabActions,
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
  const childRows = rootRows.filter((r) => r.parentId === (row ? row.id : ''));
  return childRows.length ? childRows : null;
};

interface IStateProps {
  activityState: IActivityStateStrings;
  t: IAssignmentTableStrings;
  ts: ISharedStrings;
  allBookData: BookName[];
}

interface IRecordProps {
  passages: Array<Passage>;
  mediafiles: Array<MediaFile>;
  sections: Array<Section>;
  users: Array<User>;
  roles: Array<Role>;
}

interface IProps extends IStateProps, IRecordProps, WithDataProps {
  action?: (what: string, where: number[]) => boolean;
  auth: Auth;
}

export function AssignmentTable(props: IProps) {
  const {
    activityState,
    t,
    ts,
    passages,
    mediafiles,
    sections,
    users,
    roles,
    allBookData,
  } = props;
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');
  const classes = useStyles();
  const [projRole] = useGlobal('projRole');
  const [plan] = useGlobal('plan');
  const { showMessage } = useSnackBar();
  const ctx = useContext(PlanContext);
  const { flat } = ctx.state;
  const [data, setData] = useState(Array<IRow>());
  const [check, setCheck] = useState(Array<number>());
  const [confirmAction, setConfirmAction] = useState('');
  const { getOrganizedBy } = useOrganizedBy();
  const [organizedBy] = useState(getOrganizedBy(true));
  const [organizedByPlural] = useState(getOrganizedBy(false));
  const columnDefs = [
    { name: 'name', title: organizedBy },
    { name: 'state', title: t.sectionstate },
    { name: 'passages', title: t.passages },
    { name: 'transcriber', title: ts.transcriber },
    { name: 'editor', title: ts.editor },
  ];
  const [filter, setFilter] = useState(false);
  const [assignSectionVisible, setAssignSectionVisible] = useState(false);
  const getPassageState = usePassageState();
  const columnWidths = useMemo(
    () => [
      { columnName: 'name', width: 300 },
      { columnName: 'state', width: 150 },
      { columnName: 'passages', width: flat ? 1 : 100 },
      { columnName: 'transcriber', width: 200 },
      { columnName: 'editor', width: 200 },
    ],
    [flat]
  );

  const getAssignments = () => {
    let sectionRow: IRow;
    const rowData: IRow[] = [];
    const plansections = sections
      .filter((s) => related(s, 'plan') === plan && s.attributes)
      .sort(sectionCompare);

    plansections.forEach(function (section) {
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
        .filter((p) => related(p, 'section') === section.id)
        .sort(passageCompare);
      sectionRow.passages = sectionps.length.toString();
      sectionps.forEach(function (passage: Passage) {
        rowData.push({
          id: passage.id,
          name: passageDescription(passage, allBookData),
          state: activityState.getString(getPassageState(passage)),
          editor: '',
          transcriber: '',
          passages: '',
          parentId: section.id,
        } as IRow);
      });
    });
    return rowData as Array<IRow>;
  };

  const handleAssignSection = (status: boolean) => () => {
    if (check.length === 0) {
      showMessage(t.selectRowsToAssign);
    } else {
      setAssignSectionVisible(status);
    }
  };
  const handleRemoveAssignments = () => {
    if (check.length === 0) {
      showMessage(t.selectRowsToRemove);
    } else {
      let work = false;
      check.forEach((i) => {
        const row = data[i];
        if (row.editor !== '' || row.transcriber !== '') work = true;
      });
      if (!work) {
        showMessage(t.selectRowsToRemove);
      } else {
        setConfirmAction(t.removeSec + '? (' + check.length + ')');
      }
    }
  };
  const getSelectedSections = () => {
    let selected = Array<Section>();
    let one: any;
    check.forEach((c) => {
      one = sections.find(function (s) {
        return c < data.length ? s.id === data[c].id : undefined;
      });
      if (one !== undefined) selected.push(one);
    });
    //setSelectedSections(selected);
    return selected;
  };

  const RemoveOneAssignment = async (s: Section) => {
    await memory.update((t: TransformBuilder) => [
      ...UpdateLastModifiedBy(t, s, user),
      ...ReplaceRelatedRecord(t, s, 'transcriber', 'user', ''),
      ...ReplaceRelatedRecord(t, s, 'editor', 'user', ''),
      ...UpdateLastModifiedBy(
        t,
        { type: 'plan', id: related(s, 'plan') },
        user
      ),
    ]);
  };

  const handleRemoveAssignmentsConfirmed = async () => {
    setConfirmAction('');
    let sections = getSelectedSections();
    for (let i = 0; i < sections.length; i += 1)
      await RemoveOneAssignment(sections[i]);
  };
  const handleRemoveAssignmentsRefused = () => setConfirmAction('');

  const handleCheck = (checks: Array<number>) => {
    setCheck(checks);
  };

  const handleFilter = () => setFilter(!filter);

  useEffect(() => {
    setData(getAssignments());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    plan,
    passages,
    mediafiles,
    sections,
    users,
    roles,
    activityState,
    allBookData,
  ]);

  return (
    <div id="AssignmentTable" className={classes.container}>
      <div className={classes.paper}>
        <AppBar position="fixed" className={classes.bar} color="default">
          <div className={classes.actions}>
            {projRole === RoleNames.Admin && (
              <>
                <Button
                  id="assignAdd"
                  key="assign"
                  aria-label={t.assignSec}
                  variant="outlined"
                  color="primary"
                  className={classes.button}
                  onClick={handleAssignSection(true)}
                  title={t.assignSec.replace('{0}', organizedByPlural)}
                >
                  {t.assignSec.replace('{0}', organizedByPlural)}
                </Button>
                <Button
                  id="assignRem"
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
              id="assignFilt"
              key="filter"
              aria-label={t.filter}
              variant="outlined"
              color="primary"
              className={classes.button}
              onClick={handleFilter}
              title={t.showHideFilter}
            >
              {t.filter}
              {filter ? (
                <SelectAllIcon className={classes.icon} />
              ) : (
                <FilterIcon className={classes.icon} />
              )}
            </Button>
          </div>
        </AppBar>
        <div className={classes.content}>
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
          />
        </div>
      </div>
      <AssignSection
        sections={getSelectedSections()}
        visible={assignSectionVisible}
        closeMethod={handleAssignSection(false)}
      />
      {confirmAction !== '' ? (
        <Confirm
          text={confirmAction}
          yesResponse={handleRemoveAssignmentsConfirmed}
          noResponse={handleRemoveAssignmentsRefused}
        />
      ) : (
        <></>
      )}
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'assignmentTable' }),
  ts: localStrings(state, { layout: 'shared' }),
  activityState: localStrings(state, { layout: 'activityState' }),
  allBookData: state.books.bookData,
});

const mapRecordsToProps = {
  passages: (q: QueryBuilder) => q.findRecords('passage'),
  mediafiles: (q: QueryBuilder) => q.findRecords('mediafile'),
  sections: (q: QueryBuilder) => q.findRecords('section'),
  users: (q: QueryBuilder) => q.findRecords('user'),
  roles: (q: QueryBuilder) => q.findRecords('role'),
};

export default withData(mapRecordsToProps)(
  connect(mapStateToProps)(AssignmentTable) as any
) as any;
