import React, { useState, useEffect, useMemo } from 'react';
import { useGlobal } from 'reactn';
import { localizeRole, LocalKey, localUserKey, useMyNavigate } from '../utils';
import { shallowEqual } from 'react-redux';
import {
  User,
  Role,
  OrganizationMembership,
  IUsertableStrings,
  ISharedStrings,
  RoleNames,
} from '../model';
import { withData } from 'react-orbitjs';
import { QueryBuilder, RecordIdentity } from '@orbit/data';
import { IconButton, Box } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FilterIcon from '@mui/icons-material/FilterList';
import SelectAllIcon from '@mui/icons-material/SelectAll';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Table } from '@devexpress/dx-react-grid-material-ui';
import Invite, { IInviteData } from './Invite';
import Confirm from './AlertDialog';
import ShapingTable from './ShapingTable';
import UserAdd from './UserAdd';
import {
  related,
  RemoveUserFromOrg,
  useAddToOrgAndGroup,
  useTeamDelete,
  useUser,
  useRole,
} from '../crud';
import {
  GrowingSpacer,
  PriButton,
  AltButton,
  ActionRow,
  iconMargin,
} from '../control';
import { useSelector } from 'react-redux';
import { sharedSelector, usertableSelector } from '../selector';

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

const getUser = (om: OrganizationMembership, users: User[]) => {
  return users.filter((u) => u.id === related(om, 'user'));
};
const getName = (om: OrganizationMembership, users: User[]) => {
  const u = getUser(om, users);
  return u && u.length > 0 && u[0].attributes && u[0].attributes.name;
};

interface IRecordProps {
  users: Array<User>;
  roles: Array<Role>;
  organizationMemberships: Array<OrganizationMembership>;
}

interface IProps {
  projectRole?: boolean;
}

export function UserTable(props: IProps & IRecordProps) {
  const { users, roles, organizationMemberships } = props;
  const t: IUsertableStrings = useSelector(usertableSelector, shallowEqual);
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);
  // const { pathname } = useLocation();
  const [organization] = useGlobal('organization');
  const [user] = useGlobal('user');
  const [, setEditId] = useGlobal('editUserId');
  const [memory] = useGlobal('memory');
  const [offlineOnly] = useGlobal('offlineOnly');
  const [offline] = useGlobal('offline');
  const { getUserRec } = useUser();
  const [data, setData] = useState(Array<IRow>());
  const { userIsAdmin } = useRole();
  const columnDefs = [
    { name: 'name', title: t.name },
    { name: 'email', title: t.email },
    { name: 'locale', title: t.locale },
    // { name: 'phone', title: t.phone },
    { name: 'timezone', title: t.timezone },
    { name: 'role', title: ts.teamrole },
    {
      name: 'action',
      title: userIsAdmin ? t.action : '\u00A0',
    },
  ];
  const columnWidths = [
    { columnName: 'name', width: 200 },
    { columnName: 'email', width: 200 },
    { columnName: 'locale', width: 100 },
    // { columnName: 'phone', width: 100 },
    { columnName: 'timezone', width: 100 },
    { columnName: 'role', width: 100 },
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
  const navigate = useMyNavigate();

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
    const deleteRec = getUserRec(deleteItem);
    RemoveUserFromOrg(memory, deleteRec, organization, user, teamDelete);
    localStorage.setItem(localUserKey(LocalKey.url), '/');
    setDeleteItem('');
  };

  const handleDeleteRefused = () => {
    setDeleteItem('');
  };

  const handleFilter = () => setFilter(!filter);
  const isCurrentUser = (userId: string) => userId === user;

  useEffect(() => {
    const getMedia = () => {
      const members = organizationMemberships
        .filter((om) => related(om, 'organization') === organization)
        .sort((i, j) => (getName(i, users) <= getName(j, users) ? -1 : 1));
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
              role: localizeRole(
                role.length > 0
                  ? role[0].attributes.roleName
                  : RoleNames.Member,
                ts
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
  }, [organization, users, roles, organizationMemberships]);

  interface ICell {
    value: string;
    style?: React.CSSProperties;
    row: IRow;
    column: any;
    tableRow: any;
    tableColumn: any;
  }

  const ActionCell = ({ value, style, ...restProps }: ICell) => (
    <Table.Cell {...restProps} style={{ ...style }} value>
      <>
        <IconButton
          id={'edit-' + value}
          key={'edit-' + value}
          aria-label={'edit-' + value}
          color="default"
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
          onClick={handleDelete(value)}
          disabled={isCurrentUser(value) && userIsAdmin && admins.length === 1}
        >
          <DeleteIcon />
        </IconButton>
      </>
    </Table.Cell>
  );
  const admins = useMemo(
    () => data.filter((d) => d.role === RoleNames.Admin),
    [data]
  );
  const canEdit = () => {
    return userIsAdmin && (!offline || offlineOnly);
  };
  const canEditOrcanDeleteSelf = (value: string) => {
    return (userIsAdmin || isCurrentUser(value)) && (!offline || offlineOnly);
  };
  const Cell = (props: any) => {
    const { column } = props;
    if (column.name === 'action') {
      if (canEditOrcanDeleteSelf(props.value)) return <ActionCell {...props} />;
      else return <></>;
    }
    return <Table.Cell {...props} />;
  };

  if (/profile/i.test(view)) {
    navigate('/profile');
  }
  return (
    <Box sx={{ display: 'flex' }}>
      <div>
        <ActionRow>
          {canEdit() && (
            <>
              {!offlineOnly && (
                <PriButton
                  key="add"
                  aria-label={t.invite}
                  onClick={handleInvite}
                >
                  {t.invite}
                  <AddIcon sx={iconMargin} />
                </PriButton>
              )}
              {offlineOnly && (
                <PriButton
                  key="add-member"
                  aria-label={t.addMember}
                  onClick={handleAddOpen}
                >
                  {t.addMember}
                  <AddIcon sx={iconMargin} />
                </PriButton>
              )}
            </>
          )}
          <GrowingSpacer />
          <AltButton
            key="filter"
            aria-label={t.filter}
            onClick={handleFilter}
            title={t.showHideFilter}
          >
            {t.filter}
            {filter ? (
              <SelectAllIcon sx={iconMargin} />
            ) : (
              <FilterIcon sx={iconMargin} />
            )}
          </AltButton>
        </ActionRow>
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
    </Box>
  );
}

const mapRecordsToProps = {
  users: (q: QueryBuilder) => q.findRecords('user'),
  roles: (q: QueryBuilder) => q.findRecords('role'),
  organizationMemberships: (q: QueryBuilder) =>
    q.findRecords('organizationmembership'),
};

export default withData(mapRecordsToProps)(UserTable) as any as (
  props: IProps
) => JSX.Element;
