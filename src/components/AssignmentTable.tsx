import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import { connect } from 'react-redux';
import {
  IState,
  Passage,
  PassageSection,
  Section,
  User,
  IAssignmentTableStrings,
  Role,
} from '../model';
import localStrings from '../selector/localize';
import { withData, WithDataProps } from 'react-orbitjs';
import { QueryBuilder } from '@orbit/data';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import { Button } from '@material-ui/core';
import FilterIcon from '@material-ui/icons/FilterList';
import SelectAllIcon from '@material-ui/icons/SelectAll';
import SnackBar from './SnackBar';
import Confirm from './AlertDialog';
import TreeGrid from './TreeGrid';
import related from '../utils/related';
import Auth from '../auth/Auth';
import remoteId from '../utils/remoteId';
import UserPassage from '../model/userPassage';
import './AssignmentTable.css';
import AssignSection from './AssignSection';
import {
  sectionNumber,
  sectionReviewerName,
  sectionTranscriberName,
  updatableSection,
} from '../utils/section';
import { passageNumber } from '../utils/passage';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    container: {
      display: 'flex',
      marginLeft: theme.spacing(4),
      marginRight: theme.spacing(4),
      marginBottom: theme.spacing(4),
    },
    paper: {},
    actions: theme.mixins.gutters({
      paddingBottom: 16,
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'flex-end',
    }),
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
  reviewer: string;
  passages: string;
  parentId: string;
}
const getChildRows = (row: any, rootRows: any[]) => {
  const childRows = rootRows.filter(r => r.parentId === (row ? row.id : ''));
  return childRows.length ? childRows : null;
};

/* build the section name = sequence + name */
const getSection = (section: Section) => {
  return sectionNumber(section) + ' ' + section.attributes.name;
};

/* build the passage name = sequence + book + reference */
const getReference = (passage: Passage[]) => {
  if (passage.length === 0) return '';
  return (
    passageNumber(passage[0]) +
    ' ' +
    passage[0].attributes.book +
    ' ' +
    passage[0].attributes.reference
  );
};

const numCompare = (a: number, b: number) => {
  return a - b;
};
function sectionCompare(a: Section, b: Section) {
  return numCompare(a.attributes.sequencenum, b.attributes.sequencenum);
}
function passageCompare(a: Passage, b: Passage) {
  return numCompare(a.attributes.sequencenum, b.attributes.sequencenum);
}

const getAssignments = (
  plan: string,
  passages: Array<Passage>,
  passageSections: Array<PassageSection>,
  sections: Array<Section>,
  users: Array<User>
) => {
  function passageSectionCompare(a: PassageSection, b: PassageSection) {
    const pa = passages.filter(p => p.id === related(a, 'passage'));
    const pb = passages.filter(p => p.id === related(b, 'passage'));
    return passageCompare(pa[0], pb[0]);
  }
  var sectionRow: IRow;
  const rowData: IRow[] = [];
  const plansections = sections
    .filter(s => s.attributes.planId === remoteId('plan', plan))
    .sort(sectionCompare);

  plansections.forEach(function(section) {
    sectionRow = {
      id: section.id,
      name: getSection(section),
      state: section.attributes.state,
      reviewer: sectionReviewerName(section, users),
      transcriber: sectionTranscriberName(section, users),
      passages: '0', //string so we can have blank, alternatively we could format in the tree to not show on passage rows
      parentId: '',
    };
    rowData.push(sectionRow);
    //const passageSections: PassageSection[] = related(section, 'passages');
    const sectionps = passageSections
      .filter(ps => ps.attributes.sectionId === remoteId('section', section.id))
      .sort(passageSectionCompare);
    sectionRow.passages = sectionps.length.toString();
    sectionps.forEach(function(ps) {
      const passageId = related(ps, 'passage');
      const passage = passages.filter(p => p.id === passageId);
      rowData.push({
        id: passageId,
        name: getReference(passage),
        state: passage[0].attributes.state,
        reviewer: '',
        transcriber: '',
        passages: '',
        parentId: section.id,
      } as IRow);
    });
  });
  return rowData as Array<IRow>;
};

interface IStateProps {
  t: IAssignmentTableStrings;
}

interface IRecordProps {
  userPassages: Array<UserPassage>;
  passages: Array<Passage>;
  passageSections: Array<PassageSection>;
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
    t,
    passages,
    passageSections,
    sections,
    userPassages,
    users,
    roles,
    updateStore,
  } = props;
  const classes = useStyles();
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
    { name: 'reviewer', title: t.reviewer },
  ];
  const columnWidths = [
    { columnName: 'name', width: 300 },
    { columnName: 'state', width: 150 },
    { columnName: 'passages', width: 100 },
    { columnName: 'transcriber', width: 200 },
    { columnName: 'reviewer', width: 200 },
  ];

  const [filter, setFilter] = useState(false);
  const [group, setGroup] = useState(false);
  const [assignSectionVisible, setAssignSectionVisible] = useState(false);

  const handleMessageReset = () => {
    setMessage(<></>);
  };

  const handleAssignSection = (status: boolean) => (e: any) => {
    if (check.length === 0) {
      setMessage(<span>Please select row(s) to assign.</span>);
    } else {
      setAssignSectionVisible(status);
    }
  };
  const handleRemoveAssignments = (e: any) => {
    setConfirmAction(t.delete + '? (' + check.length + ')');
  };
  const getSelectedSections = () => {
    var selected = Array<Section>();
    var one: any;
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
      let changes = { transcriberId: null, reviewerId: null };
      await updateStore(t => t.replaceRecord(updatableSection(s, changes)));
      await updateStore(t =>
        t.replaceRelatedRecord({ type: 'section', id: s.id }, 'transcriber', {
          type: 'user',
          id: null,
        })
      );
      await updateStore(t =>
        t.replaceRelatedRecord({ type: 'section', id: s.id }, 'reviewer', {
          type: 'user',
          id: null,
        })
      );
    });
  };
  const handleRemoveAssignmentsRefused = () => setConfirmAction('');

  const handleCheck = (checks: Array<number>) => {
    setCheck(checks);
  };

  const handleFilter = () => setFilter(!filter);
  const handleGroup = () => setGroup(!group);

  useEffect(() => {
    setData(getAssignments(plan, passages, passageSections, sections, users));
  }, [plan, userPassages, passages, passageSections, sections, users, roles]);

  return (
    <div id="AssignmentTable" className={classes.container}>
      <div className={classes.paper}>
        <div className={classes.actions}>
          <Button
            key="assign"
            aria-label={t.assignSection}
            variant="outlined"
            color="primary"
            className={classes.button}
            onClick={handleAssignSection(true)}
            title={t.assignSection}
          >
            {t.assignSection}
          </Button>
          <Button
            key="remove"
            aria-label={t.delete}
            variant="outlined"
            color="primary"
            className={classes.button}
            onClick={handleRemoveAssignments}
            title={t.delete}
          >
            {t.delete}
          </Button>

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
          <Button
            key="group"
            aria-label={t.group}
            variant="outlined"
            color="primary"
            className={classes.button}
            onClick={handleGroup}
            title={'Show/Hide group panel'}
          >
            {t.group}
            {group ? (
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
          pageSizes={[5, 10, 20]}
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
          showgroups={group}
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
});

const mapRecordsToProps = {
  userPassages: (q: QueryBuilder) => q.findRecords('userpassage'),
  passages: (q: QueryBuilder) => q.findRecords('passage'),
  passageSections: (q: QueryBuilder) => q.findRecords('passagesection'),
  sections: (q: QueryBuilder) => q.findRecords('section'),
  users: (q: QueryBuilder) => q.findRecords('user'),
  roles: (q: QueryBuilder) => q.findRecords('role'),
};

export default withData(mapRecordsToProps)(connect(mapStateToProps)(
  AssignmentTable
) as any) as any;
