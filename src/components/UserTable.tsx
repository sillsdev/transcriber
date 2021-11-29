import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import { useLocation } from 'react-router-dom';
import { localizeRole, LocalKey, localUserKey } from '../utils';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import {
  IState,
  User,
  Role,
  OrganizationMembership,
  IUsertableStrings,
  ISharedStrings,
  GroupMembership,
  RoleNames,
} from '../model';
import localStrings from '../selector/localize';
import { withData } from '../mods/react-orbitjs';
import { QueryBuilder, RecordIdentity, TransformBuilder } from '@orbit/data';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import { Button, IconButton } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import FilterIcon from '@material-ui/icons/FilterList';
import SelectAllIcon from '@material-ui/icons/SelectAll';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import { Table } from '@devexpress/dx-react-grid-material-ui';
import Invite, { IInviteData } from './Invite';
import Confirm from './AlertDialog';
import ShapingTable from './ShapingTable';
import UserAdd from './UserAdd';
import StickyRedirect from './StickyRedirect';
import {
  related,
  RemoveUserFromOrg,
  useAddToOrgAndGroup,
  useTeamDelete,
} from '../crud';
import SelectRole from '../control/SelectRole';
import { UpdateRelatedRecord } from '../model/baseModel';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    container: {
      display: 'flex',
    },
    paper: {},
    actions: {
      paddingBottom: 16,
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
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
    actionIcon: {},
    link: {},
  })
);

interface IRow {
  type: string;
  name: string;
  email: string;
  locale: string;
  // phone: string;
  timezone: string;
  role: string;
  action: string;
  id: RecordIdentity;
}

const getUser = (
  om: OrganizationMembership | GroupMembership,
  users: User[]
) => {
  return users.filter((u) => u.id === related(om, 'user'));
};
const getName = (
  om: OrganizationMembership | GroupMembership,
  users: User[]
) => {
  const u = getUser(om, users);
  return u && u.length > 0 && u[0].attributes && u[0].attributes.name;
};

interface IStateProps {
  t: IUsertableStrings;
  ts: ISharedStrings;
}

interface IDispatchProps {}

interface IRecordProps {
  users: Array<User>;
  roles: Array<Role>;
  organizationMemberships: Array<OrganizationMembership>;
  groupMemberships: Array<GroupMembership>;
}

interface IProps extends IStateProps, IDispatchProps, IRecordProps {
  projectRole?: boolean;
}

export function UserTable(props: IProps) {
  const {
    t,
    ts,
    users,
    roles,
    organizationMemberships,
    groupMemberships,
    projectRole,
  } = props;
  const classes = useStyles();
  const { pathname } = useLocation();
  const [organization] = useGlobal('organization');
  const [group] = useGlobal('group');
  const [user] = useGlobal('user');
  const [, setEditId] = useGlobal('editUserId');
  const [memory] = useGlobal('memory');
  const [orgRole] = useGlobal('orgRole');
  const [offlineOnly] = useGlobal('offlineOnly');
  const [offline] = useGlobal('offline');
  const [data, setData] = useState(Array<IRow>());
  const columnDefs = [
    { name: 'name', title: t.name },
    { name: 'email', title: t.email },
    { name: 'locale', title: t.locale },
    // { name: 'phone', title: t.phone },
    { name: 'timezone', title: t.timezone },
    { name: 'role', title: projectRole ? ts.projectrole : ts.teamrole },
    {
      name: 'action',
      title: orgRole === RoleNames.Admin ? t.action : '\u00A0',
    },
  ];
  const columnWidths = [
    { columnName: 'name', width: 200 },
    { columnName: 'email', width: 200 },
    { columnName: 'locale', width: 100 },
    // { columnName: 'phone', width: 100 },
    { columnName: 'timezone', width: 100 },
    { columnName: 'role', width: projectRole ? 200 : 100 },
    { columnName: 'action', width: 150 },
  ];
  const sortingEnabled = [{ columnName: 'action', sortingEnabled: false }];
  const filteringEnabled = [{ columnName: 'action', filteringEnabled: false }];
  const [filter, setFilter] = useState(false);
  const [deleteItem, setDeleteItem] = useState('');
  const [dialogVisible, setDialogVisible] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [view, setView] = useState('');
  const addToOrgAndGroup = useAddToOrgAndGroup();
  const teamDelete = useTeamDelete();

  const handleInvite = () => {
    setDialogVisible(true);
  };
  const handleInviteComplete = async (invite: IInviteData) => {
    setDialogVisible(false);
  };

  const handleInviteCancel = () => {
    setDialogVisible(false);
  };

  const doEdit = (userId: string) => {
    localStorage.setItem(localUserKey(LocalKey.url, memory), pathname);
    setEditId(userId);
    setView('Profile');
  };

  const handleEdit = (userId: string) => (e: any) => {
    doEdit(userId);
  };

  const handleAddOpen = () => {
    setAddOpen(true);
  };

  const handleSetAddOpen = (val: boolean) => {
    setAddOpen(val);
  };

  const handleAddNew = () => {
    setAddOpen(false);
    doEdit('Add');
  };

  const handleAddExisting = (userId: string) => {
    setAddOpen(false);
    const userRec = users.filter((u) => u?.id === userId);
    if (userRec.length > 0) addToOrgAndGroup(userRec[0], false);
  };

  const handleDelete = (value: string) => () => {
    setDeleteItem(value);
  };
  const handleDeleteConfirmed = () => {
    RemoveUserFromOrg(memory, deleteItem, organization, user, teamDelete);

    setDeleteItem('');
  };

  const handleDeleteRefused = () => {
    setDeleteItem('');
  };

  const handleFilter = () => setFilter(!filter);
  const isCurrentUser = (userId: string) => userId === user;

  useEffect(() => {
    const getMedia = () => {
      const members = (
        projectRole
          ? groupMemberships.filter((gm) => related(gm, 'group') === group)
          : organizationMemberships.filter(
              (om) => related(om, 'organization') === organization
            )
      ).sort((i, j) => (getName(i, users) < getName(j, users) ? -1 : 1));
      const rowData: IRow[] = [];
      members.forEach((m) => {
        const user = getUser(m, users);
        const role = roles.filter((r) => r.id === related(m, 'role'));
        if (user.length === 1) {
          const u = user[0];
          if (u.attributes) {
            rowData.push({
              name: u.attributes.name,
              email: u.attributes.email ? u.attributes.email : t.addMember,
              locale: u.attributes.locale ? u.attributes.locale : '',
              // phone: u.attributes.phone ? u.attributes.phone : '',
              timezone: u.attributes.timezone ? u.attributes.timezone : '',
              role:
                projectRole && canEdit()
                  ? role.length > 0
                    ? role[0].id
                    : ''
                  : localizeRole(
                      role.length > 0 ? role[0].attributes.roleName : 'member',
                      ts,
                      projectRole
                    ),
              action: u.id,
              id: { type: 'user', id: u.id },
            } as IRow);
          }
        }
      });
      return rowData;
    };
    setData(getMedia());
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [organization, users, roles, organizationMemberships, groupMemberships]);

  interface ICell {
    value: string;
    style?: React.CSSProperties;
    row: IRow;
    column: any;
    tableRow: any;
    tableColumn: any;
  }
  const handleRoleChange = (e: string, rowid: string) => {
    var index = parseInt(rowid);
    if (index !== undefined) {
      var userid = data[index].id.id;

      const gms = groupMemberships.filter(
        (gm) => related(gm, 'user') === userid && related(gm, 'group') === group
      );
      if (gms.length > 0) {
        memory.update((t: TransformBuilder) =>
          UpdateRelatedRecord(t, gms[0], 'role', 'role', e, user)
        );
      }
    }
  };
  const RoleCell = ({ value, style, row, tableRow, ...restProps }: ICell) => (
    <Table.Cell
      {...restProps}
      style={{ ...style }}
      tableRow={tableRow}
      row
      value
    >
      <SelectRole
        org={false}
        initRole={row.role}
        onChange={handleRoleChange}
        required={false}
        disabled={isCurrentUser((row as IRow).id.id)}
        rowid={tableRow.rowId}
      />
    </Table.Cell>
  );

  const ActionCell = ({ value, style, ...restProps }: ICell) => (
    <Table.Cell {...restProps} style={{ ...style }} value>
      <>
        <IconButton
          id={'edit-' + value}
          key={'edit-' + value}
          aria-label={'edit-' + value}
          color="default"
          className={classes.actionIcon}
          onClick={handleEdit(value)}
          disabled={isCurrentUser(value)}
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
          disabled={isCurrentUser(value)}
        >
          <DeleteIcon />
        </IconButton>
      </>
    </Table.Cell>
  );
  const canEdit = () =>
    orgRole === RoleNames.Admin && (!offline || offlineOnly);

  const Cell = (props: any) => {
    const { column } = props;
    if (column.name === 'action') {
      if (canEdit()) return <ActionCell {...props} />;
      else return <></>;
    } else if (column.name === 'role' && projectRole && canEdit())
      return <RoleCell {...props} />;
    return <Table.Cell {...props} />;
  };

  if (/profile/i.test(view)) return <StickyRedirect to="/profile" />;
  return (
    <div className={classes.container}>
      <div className={classes.paper}>
        <div className={classes.actions}>
          {canEdit() && (
            <>
              {!offlineOnly && (
                <Button
                  key="add"
                  aria-label={t.invite}
                  variant="contained"
                  color="primary"
                  className={classes.button}
                  onClick={handleInvite}
                >
                  {t.invite}
                  <AddIcon className={classes.buttonIcon} />
                </Button>
              )}
              {offlineOnly && (
                <Button
                  key="add-member"
                  aria-label={t.addMember}
                  variant="contained"
                  color="primary"
                  className={classes.button}
                  onClick={handleAddOpen}
                >
                  {t.addMember}
                  <AddIcon className={classes.buttonIcon} />
                </Button>
              )}
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
          sortingEnabled={sortingEnabled}
          filteringEnabled={filteringEnabled}
          dataCell={Cell}
          rows={data}
          shaping={filter}
        />
      </div>
      <Invite
        visible={dialogVisible}
        inviteIn={null}
        addCompleteMethod={handleInviteComplete}
        cancelMethod={handleInviteCancel}
      />
      <UserAdd
        open={addOpen}
        setOpen={handleSetAddOpen}
        select={handleAddExisting}
        add={handleAddNew}
      />
      {deleteItem !== '' ? (
        <Confirm
          yesResponse={handleDeleteConfirmed}
          noResponse={handleDeleteRefused}
        />
      ) : (
        <></>
      )}
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'usertable' }),
  ts: localStrings(state, { layout: 'shared' }),
});

const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
  ...bindActionCreators({}, dispatch),
});

const mapRecordsToProps = {
  users: (q: QueryBuilder) => q.findRecords('user'),
  roles: (q: QueryBuilder) => q.findRecords('role'),
  organizationMemberships: (q: QueryBuilder) =>
    q.findRecords('organizationmembership'),
  groupMemberships: (q: QueryBuilder) => q.findRecords('groupmembership'),
};

export default withData(mapRecordsToProps)(
  connect(mapStateToProps, mapDispatchToProps)(UserTable) as any
) as any;
