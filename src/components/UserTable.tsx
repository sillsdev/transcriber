import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import {
  IState,
  User,
  Role,
  Invitation,
  OrganizationMembership,
  IUsertableStrings,
} from '../model';
import localStrings from '../selector/localize';
import { withData } from 'react-orbitjs';
import { QueryBuilder, RecordIdentity, TransformBuilder } from '@orbit/data';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import { Button, Menu, MenuItem } from '@material-ui/core';
import DropDownIcon from '@material-ui/icons/ArrowDropDown';
import AddIcon from '@material-ui/icons/Add';
import FilterIcon from '@material-ui/icons/FilterList';
import SelectAllIcon from '@material-ui/icons/SelectAll';
import Invite, { IInviteData } from './Invite';
import SnackBar from './SnackBar';
import Confirm from './AlertDialog';
import ShapingTable from './ShapingTable';
import { related, remoteIdNum } from '../utils';
import moment from 'moment';

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
  type: string;
  name: string;
  email: string;
  locale: string;
  phone: string;
  timezone: string;
  role: string;
  id: RecordIdentity;
}

const getMedia = (
  organization: string,
  users: Array<User>,
  roles: Array<Role>,
  organizationMemberships: Array<OrganizationMembership>
) => {
  const members = organizationMemberships.filter(
    om => related(om, 'organization') === organization
  );
  const rowData: IRow[] = [];
  members.forEach(m => {
    const user = users.filter(u => u.id === related(m, 'user'));
    const role = roles.filter(r => r.id === related(m, 'role'));
    if (user.length === 1) {
      const u = user[0];
      if (u.attributes) {
        rowData.push({
          name: u.attributes.name,
          email: u.attributes.email ? u.attributes.email : '',
          locale: u.attributes.locale ? u.attributes.locale : '',
          phone: u.attributes.phone ? u.attributes.phone : '',
          timezone: u.attributes.timezone ? u.attributes.timezone : '',
          role: role.length === 1 ? role[0].attributes.roleName : '',
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

interface IProps extends IStateProps, IDispatchProps, IRecordProps {}

export function UserTable(props: IProps) {
  const { t, users, roles, organizationMemberships } = props;
  const classes = useStyles();
  const [organization] = useGlobal('organization');
  const [memory] = useGlobal('memory');
  const [schema] = useGlobal('schema');
  const [keyMap] = useGlobal('keyMap');
  const [user] = useGlobal('user');
  const [orgRole] = useGlobal('orgRole');
  const [message, setMessage] = useState(<></>);
  const [data, setData] = useState(Array<IRow>());
  const [actionMenuItem, setActionMenuItem] = useState(null);
  const [check, setCheck] = useState(Array<number>());
  const [confirmAction, setConfirmAction] = useState('');
  const columnDefs = [
    { name: 'name', title: t.name },
    { name: 'email', title: t.email },
    { name: 'locale', title: t.locale },
    { name: 'phone', title: t.phone },
    { name: 'timezone', title: t.timezone },
    { name: 'role', title: t.role },
  ];
  const columnWidths = [
    { columnName: 'name', width: 200 },
    { columnName: 'email', width: 200 },
    { columnName: 'locale', width: 100 },
    { columnName: 'phone', width: 100 },
    { columnName: 'timezone', width: 100 },
    { columnName: 'role', width: 100 },
  ];
  const [filter, setFilter] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);

  const handleAdd = () => {
    setDialogVisible(true);
  };
  const handleAddComplete = async (invite: IInviteData) => {
    setDialogVisible(false);
  };

  const handleAddCancel = () => {
    setDialogVisible(false);
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
        setMessage(<span>{t.selectRows.replace('{0}', what)}</span>);
      } else {
        setConfirmAction(what);
      }
    }
  };
  const handleActionConfirmed = () => {
    if (confirmAction === 'Delete') {
      setCheck(Array<number>());
      check.forEach(i => {
        memory.update((t: TransformBuilder) => t.removeRecord(data[i].id));
      });
    }
    setConfirmAction('');
  };
  const handleActionRefused = () => {
    setConfirmAction('');
  };

  useEffect(() => {
    setData(getMedia(organization, users, roles, organizationMemberships));
  }, [organization, users, roles, organizationMemberships, confirmAction]);

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
          rows={data}
          select={handleCheck}
          shaping={filter}
        />
      </div>
      <Invite
        visible={dialogVisible}
        inviteIn={null}
        addMethod={handleAddComplete}
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

export default withData(mapRecordsToProps)(connect(
  mapStateToProps,
  mapDispatchToProps
)(UserTable) as any) as any;
