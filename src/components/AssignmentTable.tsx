import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import { connect } from 'react-redux';
import * as actions from '../actions';
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
import { withData } from 'react-orbitjs';
import { QueryBuilder } from '@orbit/data';
import { withStyles, WithStyles, Theme } from '@material-ui/core/styles';
import { Button, Menu, MenuItem } from '@material-ui/core';
import DropDownIcon from '@material-ui/icons/ArrowDropDown';
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

const styles = (theme: Theme) => ({
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
  },
  icon: {
    marginLeft: theme.spacing(1),
  },
});

interface IRow {
  id: string;
  name: string;
  state: string;
  transcriber: string;
  reviewer: string;
  passages: string;
  parentId: string;
}
//const getChildRows = (row: any, rootRows: any[]) =>
//  row ? row.items : rootRows;
const getChildRows = (row: any, rootRows: any[]) => {
  const childRows = rootRows.filter(r => r.parentId === (row ? row.id : ''));
  return childRows.length ? childRows : null;
};

/* build the section name = sequence + name */
const getSection = (section: Section) => {
  const sectionId = section.attributes.sequencenum
    ? section.attributes.sequencenum.toString().padStart(3, ' ')
    : '';
  const sectionName = section.attributes.name;
  return sectionId + ' ' + sectionName;
};
/* build the passage name = sequence + book + reference */
const getReference = (passage: Passage[]) => {
  if (passage.length === 0) return '';
  return (
    passage[0].attributes.sequencenum.toString().padStart(3, ' ') +
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
  userPassages: Array<UserPassage>,
  passages: Array<Passage>,
  passageSections: Array<PassageSection>,
  sections: Array<Section>,
  users: Array<User>,
  roles: Array<Role>
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
      reviewer: '',
      transcriber: '',
      passages: '0', //alternatively we could format in the tree to now show on passage rows
      parentId: '',
    };
    rowData.push(sectionRow);
    //const passageSections: PassageSection[] = related(section, 'passages');
    const sectionps = passageSections
      .filter(ps => ps.attributes.sectionId === remoteId('section', section.id))
      .sort(passageSectionCompare);
    sectionps.forEach(function(ps, psindex) {
      const passageId = related(ps, 'passage');
      const passage = passages.filter(p => p.id === passageId);
      //add this passage to the section passage count
      sectionRow.passages = (parseInt(sectionRow.passages) + 1).toString();
      //rowData[rowData.length - 1].items.push({
      rowData.push({
        id: passageId,
        name: getReference(passage),
        state: passage[0].attributes.state,
        reviewer: '',
        transcriber: '',
        passages: '',
        parentId: section.id,
      } as IRow);

      const passageups = userPassages.filter(
        up => up.attributes.passageId === remoteId('passage', passage[0].id)
      );
      passageups.forEach(function(up, upindex) {
        const userId = related(up, 'user');
        const user = users.filter(u => u.id === userId);
        const username = user.length > 0 ? user[0].attributes.name : '';
        const roleId = related(up, 'role');
        const role = roles.filter(r => r.id === roleId);
        const rolename = role.length > 0 ? role[0].attributes.roleName : '';
        if (rolename === 'Reviewer') {
          //add my data to the last row and the section row
          rowData[rowData.length - 1].reviewer = username;
          sectionRow.reviewer = username;
        } else {
          rowData[rowData.length - 1].transcriber = username;
          sectionRow.transcriber = username;
        }
      });
    });
  });
  return rowData as Array<IRow>;
};

interface IStateProps {
  t: IAssignmentTableStrings;
}
//TODO:
interface IDispatchProps {
  uploadFiles: typeof actions.uploadFiles;
  nextUpload: typeof actions.nextUpload;
  uploadComplete: typeof actions.uploadComplete;
}

interface IRecordProps {
  userPassages: Array<UserPassage>;
  passages: Array<Passage>;
  passageSections: Array<PassageSection>;
  sections: Array<Section>;
  users: Array<User>;
  roles: Array<Role>;
}

interface IProps
  extends IStateProps,
    IDispatchProps,
    IRecordProps,
    WithStyles<typeof styles> {
  action?: (what: string, where: number[]) => boolean;
  auth: Auth;
}

export function AssignmentTable(props: IProps) {
  const {
    classes,
    t,
    action,
    passages,
    passageSections,
    sections,
    userPassages,
    users,
    roles,
  } = props;
  const [plan] = useGlobal<string>('plan');
  const [message, setMessage] = useState(<></>);
  const [data, setData] = useState(Array<IRow>());
  const [actionMenuItem, setActionMenuItem] = useState(null);
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

  const handleMessageReset = () => {
    setMessage(<></>);
  };

  const handleMenu = (e: any) => setActionMenuItem(e.currentTarget);
  const handleConfirmAction = (what: string) => (e: any) => {
    setActionMenuItem(null);
    if (check.length === 0) {
      setMessage(<span>Please select row(s) to {what}.</span>);
    } else if (!/Close/i.test(what)) {
      setConfirmAction(what);
    }
  };
  const handleActionConfirmed = () => {
    if (action != null) {
      if (action(confirmAction, check)) {
        setCheck(Array<number>());
      }
    }
    setConfirmAction('');
  };
  const handleActionRefused = () => {
    setConfirmAction('');
  };
  const handleCheck = (checks: Array<number>) => {
    setCheck(checks);
  };

  const handleFilter = () => setFilter(!filter);
  const handleGroup = () => setGroup(!group);

  useEffect(() => {
    setData(
      getAssignments(
        plan as string,
        userPassages,
        passages,
        passageSections,
        sections,
        users,
        roles
      )
    );
  }, [plan, userPassages, passages, passageSections, sections, users, roles]);

  return (
    <div id="AssignmentTable" className={classes.container}>
      <div className={classes.paper}>
        <div className={classes.actions}>
          <Button
            key="action"
            aria-owns={actionMenuItem !== '' ? 'action-menu' : undefined}
            aria-label={t.action}
            variant="outlined"
            color="primary"
            className={classes.button}
            onClick={handleMenu}
          >
            {t.action}
            <DropDownIcon className={classes.icon} />
          </Button>
          <Menu
            id="action-menu"
            anchorEl={actionMenuItem}
            open={Boolean(actionMenuItem)}
            onClose={handleConfirmAction('Close')}
          >
            <MenuItem onClick={handleConfirmAction('Assign Section')}>
              {t.assignSection}
            </MenuItem>
            <MenuItem onClick={handleConfirmAction('Remove Assignment')}>
              {t.delete}
            </MenuItem>{' '}
          </Menu>
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
      {confirmAction !== '' ? (
        <Confirm
          text={confirmAction + ' ' + check.length + ' Item(s). Are you sure?'}
          yesResponse={handleActionConfirmed}
          noResponse={handleActionRefused}
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

export default withStyles(styles, { withTheme: true })(withData(
  mapRecordsToProps
)(connect(mapStateToProps)(AssignmentTable) as any) as any) as any;
