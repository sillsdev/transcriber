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
  Role,
  RoleNames,
} from '../model';
import localStrings from '../selector/localize';
import { withData } from '../mods/react-orbitjs';
import { QueryBuilder, RecordIdentity, TransformBuilder } from '@orbit/data';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import { Button, IconButton } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
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
import { remoteIdNum, getRoleId } from '../utils';
import { numCompare } from '../utils/sort';
import { addGroupMember } from '../utils/groupmembership';

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
    },
    buttonIcon: {
      marginLeft: theme.spacing(1),
    },
    editIcon: {
      fontSize: 16,
    },
    addIcon: {},
    link: {},
    actionIcon: {},
  })
);

interface IRow {
  name: string;
  owner: string;
  projects: number;
  members: number;
  action: string;
  id: RecordIdentity;
}

const getMedia = (
  organization: string,
  groups: Array<Group>,
  projects: Array<Project>,
  groupMemberships: Array<GroupMembership>
) => {
  const selectedGroups = groups.filter(
    (g) => related(g, 'owner') === organization
  );
  const rowData = selectedGroups.map((g) => {
    const selectedProjects = projects.filter(
      (p) => related(p, 'group') === g.id
    );
    const members = groupMemberships.filter(
      (gm) => related(gm, 'group') === g.id
    );
    return {
      name: g.attributes.name,
      projects: selectedProjects.length,
      members: members.length,
      action: g.id,
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
  roles: Array<Role>;
  groups: Array<Group>;
  projects: Array<Project>;
  groupMemberships: Array<GroupMembership>;
}

interface IProps extends IStateProps, IDispatchProps, IRecordProps {
  auth: Auth;
}

export function GroupTable(props: IProps) {
  const { t, roles, groups, projects, groupMemberships } = props;
  const classes = useStyles();
  const [organization] = useGlobal('organization');
  const [memory] = useGlobal('memory');
  const [group, setGroup] = useGlobal('group');
  const [user] = useGlobal('user');
  const [orgRole] = useGlobal('orgRole');
  const [message, setMessage] = useState(<></>);
  const [data, setData] = useState(Array<IRow>());
  const columnDefs = [
    { name: 'name', title: t.name },
    { name: 'projects', title: t.projects },
    { name: 'members', title: t.members },
    {
      name: 'action',
      title: orgRole === 'admin' ? t.action : '\u00A0',
    },
  ];
  const columnWidths = [
    { columnName: 'name', width: 150 },
    { columnName: 'projects', width: 100 },
    { columnName: 'members', width: 100 },
    { columnName: 'action', width: 150 },
  ];
  const sorting = [{ columnName: 'name', direction: 'asc' }];
  const columnSorting = [
    { columnName: 'projects', compare: numCompare },
    { columnName: 'members', compare: numCompare },
  ];
  const sortingEnabled = [{ columnName: 'action', sortingEnabled: false }];
  const filteringEnabled = [{ columnName: 'action', filteringEnabled: false }];
  const numCols = ['projects', 'members'];
  const [filter, setFilter] = useState(false);
  const [deleteItem, setDeleteItem] = useState('');
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogData, setDialogData] = useState(null as Group | null);

  const handleAdd = () => {
    setDialogData(null);
    setDialogVisible(true);
  };
  const handleAddMethod = async (name: string) => {
    setDialogVisible(false);
    let group: Group = {
      type: 'group',
      attributes: {
        name: name,
        ownerId: remoteIdNum('organization', organization, memory.keyMap),
      },
    } as any;
    memory.schema.initializeRecord(group);

    await memory.update((t: TransformBuilder) => [
      t.addRecord(group),
      t.replaceRelatedRecord({ type: 'group', id: group.id }, 'owner', {
        type: 'organization',
        id: organization,
      }),
    ]);
    //add the user creating the group as a group admin
    await addGroupMember(
      memory,
      group.id,
      user,
      getRoleId(roles, RoleNames.Admin)
    );
    setGroup(group.id);
  };
  const handleAddCancel = () => {
    setDialogVisible(false);
  };

  const handleEdit = (groupId: string) => (e: any) => {
    const groupRec = groups.filter((g) => g.id === groupId);
    setDialogData(groupRec && groupRec.length === 1 ? groupRec[0] : null);
    setDialogVisible(true);
  };
  const handleEditMethod = async (group: any) => {
    setDialogVisible(false);
    delete group.relationships;
    await memory.update((t: TransformBuilder) => t.updateRecord(group));
    await memory.update((t: TransformBuilder) =>
      t.replaceRelatedRecord({ type: 'group', id: group.id }, 'owner', {
        type: 'organization',
        id: organization,
      })
    );
  };

  const handleDelete = (value: string) => () => {
    const selectedProjects = projects.filter(
      (p) => related(p, 'group') === value
    );
    if (selectedProjects.length > 0) {
      setMessage(
        <span>
          {t.removeSelected.replace('{0}', selectedProjects.length.toString())}
        </span>
      );
      return;
    }
    setDeleteItem(value);
  };
  const handleDeleteConfirmed = () => {
    memory.update((t: TransformBuilder) =>
      t.removeRecord({
        type: 'group',
        id: deleteItem,
      })
    );
  };
  const handleDeleteRefused = () => {
    setDeleteItem('');
  };

  const handleMessageReset = () => {
    setMessage(<></>);
  };
  const handleFilter = () => setFilter(!filter);
  const handleSelect = (id: RecordIdentity) => () => {
    setGroup(id.id);
  };

  const isAllUsers = (groupId: string) => {
    const groupRec = memory.cache.query((q: QueryBuilder) =>
      q.findRecord({ type: 'group', id: groupId })
    ) as Group;
    return groupRec && groupRec.attributes && groupRec.attributes.allUsers;
  };

  useEffect(() => {
    localStorage.removeItem('url');
    if (group !== '') setGroup('');
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  useEffect(() => {
    setData(getMedia(organization, groups, projects, groupMemberships));
  }, [organization, groups, projects, groupMemberships]);

  interface ICell {
    value: string;
    style?: React.CSSProperties;
    row: IRow;
    column: any;
    tableRow: any;
    tableColumn: any;
  }

  const LinkCell = ({ value, style, ...restProps }: ICell) => {
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
        </Button>
      </Table.Cell>
    );
  };

  const ActionCell = ({ value, style, ...restProps }: ICell) => (
    <Table.Cell {...restProps} style={{ ...style }} value>
      {orgRole === 'admin' && (
        <>
          <IconButton
            id={'edit-' + value}
            key={'edit-' + value}
            aria-label={'edit-' + value}
            color="default"
            className={classes.actionIcon}
            onClick={handleEdit(value)}
          >
            <EditIcon />
          </IconButton>
          <IconButton
            id={'del-' + value}
            key={'del-' + value}
            aria-label={'del-' + value}
            color="default"
            className={classes.actionIcon}
            onClick={handleDelete(value)}
            disabled={isAllUsers(value)}
          >
            <DeleteIcon />
          </IconButton>
        </>
      )}
    </Table.Cell>
  );

  const Cell = (props: any) => {
    const { column } = props;
    if (column.name === 'name') {
      return <LinkCell {...props} />;
    }
    if (column.name === 'action') {
      return <ActionCell {...props} />;
    }
    return <Table.Cell {...props} />;
  };

  return (
    <div className={classes.container}>
      <div className={classes.paper}>
        <div className={classes.actions}>
          {orgRole === 'admin' && (
            <Button
              key="add"
              aria-label={t.addGroup}
              variant="contained"
              color="primary"
              className={classes.button}
              onClick={handleAdd}
            >
              {t.addGroup}
              <AddIcon className={classes.buttonIcon} />
            </Button>
          )}
          <div className={classes.grow}>{'\u00A0'}</div>
          <Button
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
              <SelectAllIcon className={classes.buttonIcon} />
            ) : (
              <FilterIcon className={classes.buttonIcon} />
            )}
          </Button>
        </div>
        <ShapingTable
          columns={columnDefs}
          columnWidths={columnWidths}
          sorting={sorting}
          sortingEnabled={sortingEnabled}
          filteringEnabled={filteringEnabled}
          columnSorting={columnSorting}
          dataCell={Cell}
          numCols={numCols}
          rows={data}
          shaping={filter}
        />
      </div>
      <GroupAdd
        visible={dialogVisible}
        groupIn={dialogData}
        addMethod={handleAddMethod}
        editMethod={handleEditMethod}
        cancelMethod={handleAddCancel}
      />
      {deleteItem !== '' ? (
        <Confirm
          yesResponse={handleDeleteConfirmed}
          noResponse={handleDeleteRefused}
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
  roles: (q: QueryBuilder) => q.findRecords('role'),
  groups: (q: QueryBuilder) => q.findRecords('group'),
  projects: (q: QueryBuilder) => q.findRecords('project'),
  groupMemberships: (q: QueryBuilder) => q.findRecords('groupmembership'),
};

export default withData(mapRecordsToProps)(
  connect(mapStateToProps, mapDispatchToProps)(GroupTable) as any
) as any;
