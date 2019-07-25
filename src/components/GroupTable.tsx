import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import {
  IState,
  Group,
  Project,
  GroupMembership,
  IGroupTableStrings,
} from '../model';
import localStrings from '../selector/localize';
import { withData, WithDataProps } from 'react-orbitjs';
import { QueryBuilder, RecordIdentity, TransformBuilder } from '@orbit/data';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import { Button, Menu, MenuItem } from '@material-ui/core';
import DropDownIcon from '@material-ui/icons/ArrowDropDown';
import AddIcon from '@material-ui/icons/Add';
import EditIcon from '@material-ui/icons/Edit';
import FilterIcon from '@material-ui/icons/FilterList';
import SelectAllIcon from '@material-ui/icons/SelectAll';
import { Table } from '@devexpress/dx-react-grid-material-ui';
import SnackBar from './SnackBar';
import Confirm from './AlertDialog';
import ShapingTable from './ShapingTable';
import GroupAdd from '../components/GroupAdd';
import related from '../utils/related';
import Auth from '../auth/Auth';
import { remoteId } from '../utils';

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
    },
    buttonIcon: {
      marginLeft: theme.spacing(1),
    },
    editIcon: {
      fontSize: 16,
    },
    addIcon: {},
    link: {},
  })
);

interface IRow {
  name: string;
  abbr: string;
  owner: string;
  projects: number;
  members: number;
  id: RecordIdentity;
}

const getMedia = (
  organization: string,
  groups: Array<Group>,
  projects: Array<Project>,
  groupMemberships: Array<GroupMembership>
) => {
  const selectedGroups = groups.filter(
    g => related(g, 'owner') === organization
  );
  const rowData = selectedGroups.map(g => {
    const selectedProjects = projects.filter(p => related(p, 'group') === g.id);
    const members = groupMemberships.filter(
      gm => related(gm, 'group') === g.id
    );
    return {
      name: g.attributes.name,
      abbr: g.attributes.abbreviation,
      projects: selectedProjects.length,
      members: members.length,
      id: { type: 'group', id: g.id },
    } as IRow;
  });
  return rowData as Array<IRow>;
};

interface IStateProps {
  t: IGroupTableStrings;
  uploadList: FileList;
  loaded: boolean;
  currentlyLoading: number;
}

interface IDispatchProps {}

interface IRecordProps {
  groups: Array<Group>;
  projects: Array<Project>;
  groupMemberships: Array<GroupMembership>;
}

interface IProps
  extends IStateProps,
    IDispatchProps,
    IRecordProps,
    WithDataProps {
  auth: Auth;
}

export function GroupTable(props: IProps) {
  const { t, groups, projects, groupMemberships, updateStore } = props;
  const classes = useStyles();
  const [keyMap] = useGlobal('keyMap');
  const [organization] = useGlobal('organization');
  const [dataStore] = useGlobal('dataStore');
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  const [_group, setGroup] = useGlobal('group');
  const [schema] = useGlobal('schema');
  const [message, setMessage] = useState(<></>);
  const [data, setData] = useState(Array<IRow>());
  // [
  //   {fileName: 'GEN-001-001025.mp3', sectionId: '1', sectionName: 'Creation Story', book: 'Genesis', reference: '1:1-25a', duration: '30 seconds', size: 250, version: '1' },
  //   {fileName: 'GEN-001-002631.mp3', sectionId: '', sectionName: '', book: '', reference: '', duration: '45 seconds', size: 445, version: '1' },
  // ]);
  const [actionMenuItem, setActionMenuItem] = useState(null);
  const [check, setCheck] = useState(Array<number>());
  const [confirmAction, setConfirmAction] = useState('');
  const columnDefs = [
    { name: 'name', title: t.name },
    { name: 'abbr', title: t.abbr },
    { name: 'projects', title: t.projects },
    { name: 'members', title: t.members },
  ];
  const columnWidths = [
    { columnName: 'name', width: 150 },
    { columnName: 'abbr', width: 150 },
    { columnName: 'projects', width: 100 },
    { columnName: 'members', width: 100 },
  ];
  const numCompare = (a: number, b: number) => {
    return a - b;
  };
  const columnSorting = [
    { columnName: 'projects', compare: numCompare },
    { columnName: 'members', compare: numCompare },
  ];
  const numCols = ['projects', 'members'];
  const [filter, setFilter] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogData, setDialogData] = useState(null as Group | null);

  const handleAdd = () => {
    setDialogData(null);
    setDialogVisible(true);
  };
  const handleAddMethod = async (name: string, abbr: string) => {
    setDialogVisible(false);
    let group: Group = {
      type: 'group',
      attributes: {
        name: name,
        abbreviation: abbr,
        ownerId: remoteId('organization', organization, keyMap),
      },
    } as any;
    schema.initializeRecord(group);

    await dataStore.update((t: TransformBuilder) => [
      t.addRecord(group),
      t.replaceRelatedRecord({ type: 'group', id: group.id }, 'owner', {
        type: 'organization',
        id: organization,
      }),
    ]);
  };

  const handleAddCancel = () => {
    setDialogVisible(false);
  };
  const handleEditMethod = async (group: any) => {
    setDialogVisible(false);
    delete group.relationships;
    await updateStore(t => t.replaceRecord(group));
    await updateStore(t =>
      t.replaceRelatedRecord({ type: 'group', id: group.id }, 'owner', {
        type: 'organization',
        id: organization,
      })
    );
  };
  const handleMessageReset = () => {
    setMessage(<></>);
  };
  const handleCheck = (checks: Array<number>) => {
    setCheck(checks);
  };
  const handleFilter = () => setFilter(!filter);
  const handleMenu = (e: any) => setActionMenuItem(e.currentTarget);
  const handleConfirmAction = (what: string) => (e: any) => {
    setActionMenuItem(null);
    if (!/Close/i.test(what)) {
      if (check.length === 0) {
        setMessage(<span>Please select row(s) to {what}.</span>);
      } else {
        setConfirmAction(what);
      }
    }
  };
  const handleActionConfirmed = () => {
    if (confirmAction === 'Delete') {
      setCheck(Array<number>());
      check.forEach(i => {
        updateStore(t => t.removeRecord(data[i].id));
      });
    }
    setConfirmAction('');
  };
  const handleActionRefused = () => {
    setConfirmAction('');
  };
  const handleSelect = (id: RecordIdentity) => () => {
    setGroup(id.id);
  };

  useEffect(() => {
    setData(getMedia(organization, groups, projects, groupMemberships));
  }, [organization, groups, projects, groupMemberships, confirmAction]);

  const LinkCell = ({ value, style, ...restProps }: any) => {
    return (
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
  };

  const Cell = (props: any) => {
    const { column } = props;
    if (column.name === 'name') {
      return <LinkCell {...props} />;
    }
    return <Table.Cell {...props} />;
  };

  return (
    <div className={classes.container}>
      <div className={classes.paper}>
        <div className={classes.actions}>
          <Button
            key="add"
            aria-label={t.addGroup}
            variant="outlined"
            color="primary"
            className={classes.button}
            onClick={handleAdd}
          >
            {t.addGroup}
            <AddIcon className={classes.buttonIcon} />
          </Button>
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
            <DropDownIcon className={classes.buttonIcon} />
          </Button>
          <Menu
            id="action-menu"
            anchorEl={actionMenuItem}
            open={Boolean(actionMenuItem)}
            onClose={handleConfirmAction('Close')}
          >
            <MenuItem onClick={handleConfirmAction('Delete')}>
              {t.delete}
            </MenuItem>
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
              <SelectAllIcon className={classes.buttonIcon} />
            ) : (
              <FilterIcon className={classes.buttonIcon} />
            )}
          </Button>
        </div>
        <ShapingTable
          columns={columnDefs}
          columnWidths={columnWidths}
          columnSorting={columnSorting}
          dataCell={Cell}
          numCols={numCols}
          rows={data}
          select={handleCheck}
          shaping={filter}
        />
      </div>
      <GroupAdd
        visible={dialogVisible}
        planIn={dialogData}
        addMethod={handleAddMethod}
        editMethod={handleEditMethod}
        cancelMethod={handleAddCancel}
      />
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
  t: localStrings(state, { layout: 'groupTable' }),
  uploadList: state.upload.files,
  currentlyLoading: state.upload.current,
  loaded: state.upload.loaded,
});

const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
  ...bindActionCreators({}, dispatch),
});

const mapRecordsToProps = {
  groups: (q: QueryBuilder) => q.findRecords('group'),
  projects: (q: QueryBuilder) => q.findRecords('project'),
  groupMemberships: (q: QueryBuilder) => q.findRecords('groupmembership'),
};

export default withData(mapRecordsToProps)(connect(
  mapStateToProps,
  mapDispatchToProps
)(GroupTable) as any) as any;
