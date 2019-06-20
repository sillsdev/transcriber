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
import { Button, Menu, MenuItem, IconButton } from '@material-ui/core';
import DropDownIcon from '@material-ui/icons/ArrowDropDown';
import FilterIcon from '@material-ui/icons/FilterList';
import SelectAllIcon from '@material-ui/icons/SelectAll';
import SnackBar from './SnackBar';
import Confirm from './AlertDialog';
import ShapingTable from './ShapingTable';
import related from '../utils/related';
import Auth from '../auth/Auth';
import remoteId from '../utils/remoteId';
import UserPassage from '../model/userPassage';

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
  button: {
    margin: theme.spacing(1),
  },
  icon: {
    marginLeft: theme.spacing(1),
  },
});

interface IRow {
  section: string;
  sectionstate: string;
  passage: string;
  passagestate: string;
  user: string;
  role: string;
}

const getSection = (section: Section) => {
  const sectionId = section.attributes.sequencenum
    ? section.attributes.sequencenum.toString()
    : '';
  const sectionName = section.attributes.name;
  return sectionId + ' ' + sectionName;
};

const getReference = (passage: Passage[]) => {
  if (passage.length === 0) return '';
  return (
    passage[0].attributes.sequencenum +
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
  addit: boolean,
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
  const rowData: IRow[] = [];
  const plansections = sections
    .filter(s => s.attributes.planId === remoteId('plan', plan))
    .sort(sectionCompare);
  plansections.forEach(function(section) {
    rowData.push({
      section: getSection(section),
      sectionstate: section.attributes.state,
      passage: '',
      passagestate: '',
      user: '',
      role: '',
    } as IRow);
    //const passageSections: PassageSection[] = related(section, 'passages');
    const sectionps = passageSections
      .filter(ps => ps.attributes.sectionId === remoteId('section', section.id))
      .sort(passageSectionCompare);
    sectionps.forEach(function(ps, psindex) {
      const passageId = related(ps, 'passage');
      const passage = passages.filter(p => p.id === passageId);
      if (psindex === 0) {
        //add my data to the last row
        rowData[rowData.length - 1].passage = getReference(passage);
        rowData[rowData.length - 1].passagestate = passage[0].attributes.state;
      } else {
        rowData.push({
          section: addit ? rowData[rowData.length - 1].section : '',
          sectionstate: addit ? rowData[rowData.length - 1].sectionstate : '',
          passage: getReference(passage),
          passagestate: passage[0].attributes.state,
          user: '',
          role: '',
        } as IRow);
      }
      //const userPassages: UserPassage[] = related(passage, 'users');
      console.log(remoteId('passage', passage[0].id));
      const passageups = userPassages.filter(
        up => up.attributes.passageId === remoteId('passage', passage[0].id)
      );
      console.log(passageups.length);
      passageups.forEach(function(up, upindex) {
        const userId = related(up, 'user');
        const user = users.filter(u => u.id === userId);
        const username = user.length > 0 ? user[0].attributes.name : '';
        const roleId = related(up, 'role');
        const role = roles.filter(r => r.id === roleId);
        const rolename = role.length > 0 ? role[0].attributes.roleName : '';
        if (upindex === 0) {
          //add my data to the last row
          rowData[rowData.length - 1].user = username;
          rowData[rowData.length - 1].role = rolename;
        } else {
          rowData.push({
            section: addit ? rowData[rowData.length - 1].section : '',
            sectionstate: addit ? rowData[rowData.length - 1].sectionstate : '',
            passage: addit ? rowData[rowData.length - 1].passage : '',
            passagestate: addit ? rowData[rowData.length - 1].passagestate : '',
            user: username,
            role: rolename,
          } as IRow);
        }
      });
    });
  });
  return rowData as Array<IRow>;
};

interface IStateProps {
  t: IAssignmentTableStrings;
}

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
  addit: boolean;
  action?: (what: string, where: number[]) => boolean;
  auth: Auth;
}

export function AssignmentTable(props: IProps) {
  const {
    classes,
    t,
    action,
    addit,
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
    { name: 'section', title: t.section },
    { name: 'sectionstate', title: t.sectionstate },
    { name: 'passage', title: t.passage },
    { name: 'passagestate', title: t.passagestate },
    { name: 'user', title: t.user },
    { name: 'role', title: t.role },
  ];
  const columnWidths = [
    { columnName: 'section', width: 180 },
    { columnName: 'sectionstate', width: 120 },
    { columnName: 'passage', width: 150 },
    { columnName: 'passagestate', width: 120 },
    { columnName: 'user', width: 100 },
    { columnName: 'role', width: 100 },
  ];

  const numCols: string[] = [];
  const [filter, setFilter] = useState(false);

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

  useEffect(() => {
    setData(
      getAssignments(
        addit,
        plan as string,
        userPassages,
        passages,
        passageSections,
        sections,
        users,
        roles
      )
    );
  }, [
    addit,
    plan,
    userPassages,
    passages,
    passageSections,
    sections,
    users,
    roles,
  ]);

  return (
    <div className={classes.container}>
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
            <MenuItem onClick={handleConfirmAction('Assign Passage')}>
              {t.assignPassage}
            </MenuItem>
            <MenuItem onClick={handleConfirmAction('Remove Assignment')}>
              {t.delete}
            </MenuItem>{' '}
          </Menu>
          <IconButton onClick={handleFilter} title={'Show/Hide filter rows'}>
            {filter ? <SelectAllIcon /> : <FilterIcon />}
          </IconButton>
        </div>
        <ShapingTable
          columns={columnDefs}
          columnWidths={columnWidths}
          numCols={numCols}
          rows={data}
          select={handleCheck}
          shaping={filter}
        />
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
