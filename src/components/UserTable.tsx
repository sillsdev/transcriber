import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import { Redirect } from 'react-router-dom';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import {
  IState,
  User,
  Role,
  OrganizationMembership,
  IUsertableStrings,
  Group,
  GroupMembership,
} from '../model';
import localStrings from '../selector/localize';
import { withData } from 'react-orbitjs';
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
import SnackBar from './SnackBar';
import Confirm from './AlertDialog';
import ShapingTable from './ShapingTable';
import { related } from '../utils';

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

const getUser = (om: OrganizationMembership, users: User[]) => {
  return users.filter(u => u.id === related(om, 'user'));
};
const getName = (om: OrganizationMembership, users: User[]) => {
  const u = getUser(om, users);
  return u && u.length > 0 && u[0].attributes && u[0].attributes.name;
};

const getMedia = (
  organization: string,
  users: Array<User>,
  roles: Array<Role>,
  organizationMemberships: Array<OrganizationMembership>,
  t: IUsertableStrings
) => {
  const members = organizationMemberships
    .filter(om => related(om, 'organization') === organization)
    .sort((i, j) => (getName(i, users) < getName(j, users) ? -1 : 1));
  const rowData: IRow[] = [];
  members.forEach(m => {
    const user = getUser(m, users);
    const role = roles.filter(r => r.id === related(m, 'role'));
    if (user.length === 1) {
      const u = user[0];
      if (u.attributes) {
        rowData.push({
          name: u.attributes.name,
          email: u.attributes.email ? u.attributes.email : t.offline,
          locale: u.attributes.locale ? u.attributes.locale : '',
          // phone: u.attributes.phone ? u.attributes.phone : '',
          timezone: u.attributes.timezone ? u.attributes.timezone : '',
          role: role.length === 1 ? role[0].attributes.roleName : '',
          action: u.id,
          id: { type: 'user', id: u.id },
        } as IRow);
      }
    }
  });
  return rowData;
};

interface IStateProps {
  t: IUsertableStrings;
}

interface IDispatchProps {}

interface IRecordProps {
  users: Array<User>;
  roles: Array<Role>;
  organizationMemberships: Array<OrganizationMembership>;
}

interface IProps extends IStateProps, IDispatchProps, IRecordProps {
  history: {
    action: string;
    location: {
      pathname: string;
    };
  };
}

export function UserTable(props: IProps) {
  const { t, users, roles, organizationMemberships, history } = props;
  const classes = useStyles();
  const [organization] = useGlobal('organization');
  const [user] = useGlobal('user');
  const [developer] = useGlobal('developer');
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  const [editId, setEditId] = useGlobal('editUserId');
  const [memory] = useGlobal('memory');
  const [orgRole] = useGlobal('orgRole');
  const [message, setMessage] = useState(<></>);
  const [data, setData] = useState(Array<IRow>());
  const columnDefs = [
    { name: 'name', title: t.name },
    { name: 'email', title: t.email },
    { name: 'locale', title: t.locale },
    // { name: 'phone', title: t.phone },
    { name: 'timezone', title: t.timezone },
    { name: 'role', title: t.role },
    {
      name: 'action',
      title: orgRole === 'admin' ? t.action : '\u00A0',
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
  const [filter, setFilter] = useState(false);
  const [deleteItem, setDeleteItem] = useState('');
  const [dialogVisible, setDialogVisible] = useState(false);
  const [view, setView] = useState('');

  const handleAdd = () => {
    setDialogVisible(true);
  };
  const handleAddComplete = async (invite: IInviteData) => {
    setDialogVisible(false);
  };

  const handleAddCancel = () => {
    setDialogVisible(false);
  };

  const handleEdit = (userId: string) => (e: any) => {
    localStorage.setItem('url', history.location.pathname);
    setEditId(userId);
    setView('Profile');
  };

  const handleDelete = (value: string) => () => {
    setDeleteItem(value);
  };
  const handleDeleteConfirmed = () => {
    const orgMemberRecs = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('organizationmembership')
    ) as OrganizationMembership[];
    const userOrgRec = orgMemberRecs.filter(
      o =>
        related(o, 'user') === deleteItem &&
        related(o, 'organization') === organization
    );
    if (userOrgRec.length === 1) {
      memory.update((t: TransformBuilder) => t.removeRecord(userOrgRec[0]));
    }
    const groupRecs = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('group')
    ) as Group[];
    const orgGroups = groupRecs
      .filter(g => related(g, 'owner') === organization)
      .map(og => og.id);
    const grpMbrRecs = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('groupmembership')
    ) as GroupMembership[];
    const userGrpOrgRecs = grpMbrRecs.filter(
      g =>
        related(g, 'user') === deleteItem &&
        orgGroups.includes(related(g, 'group'))
    );
    userGrpOrgRecs.forEach(g => {
      memory.update((t: TransformBuilder) => t.removeRecord(g));
    });
  };
  const handleDeleteRefused = () => {
    setDeleteItem('');
  };

  const handleMessageReset = () => {
    setMessage(<></>);
  };
  const handleFilter = () => setFilter(!filter);
  const isCurrentUser = (userId: string) => userId === user;

  useEffect(() => {
    setData(getMedia(organization, users, roles, organizationMemberships, t));
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
      {orgRole === 'admin' && (
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
      )}
    </Table.Cell>
  );

  const Cell = (props: any) => {
    const { column } = props;
    if (column.name === 'action') {
      if (orgRole === 'admin') return <ActionCell {...props} />;
      else return <></>;
    }
    return <Table.Cell {...props} />;
  };

  if (/profile/i.test(view)) return <Redirect to="/Profile" />;

  return (
    <div className={classes.container}>
      <div className={classes.paper}>
        <div className={classes.actions}>
          {orgRole === 'admin' && (
            <>
              <Button
                key="add"
                aria-label={t.invite}
                variant="contained"
                color="primary"
                className={classes.button}
                onClick={handleAdd}
              >
                {t.invite}
                <AddIcon className={classes.buttonIcon} />
              </Button>
              {developer && (
                <Button
                  key="offline"
                  aria-label={t.offline}
                  variant="contained"
                  color="primary"
                  className={classes.button}
                  onClick={handleEdit('Add')}
                >
                  {t.offline}
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
          dataCell={Cell}
          rows={data}
          shaping={filter}
        />
      </div>
      <Invite
        visible={dialogVisible}
        inviteIn={null}
        addCompleteMethod={handleAddComplete}
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
  t: localStrings(state, { layout: 'usertable' }),
});

const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
  ...bindActionCreators({}, dispatch),
});

const mapRecordsToProps = {
  users: (q: QueryBuilder) => q.findRecords('user'),
  roles: (q: QueryBuilder) => q.findRecords('role'),
  organizationMemberships: (q: QueryBuilder) =>
    q.findRecords('organizationmembership'),
};

export default withData(mapRecordsToProps)(
  connect(mapStateToProps, mapDispatchToProps)(UserTable) as any
) as any;
