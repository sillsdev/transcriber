import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import {
  IState,
  Role,
  Invitation,
  IInvitationTableStrings,
  Group,
  ISharedStrings,
  RoleNames,
} from '../model';
import localStrings from '../selector/localize';
import { withData } from '../mods/react-orbitjs';
import { QueryBuilder, RecordIdentity, TransformBuilder } from '@orbit/data';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import { Button, Menu, MenuItem, Typography } from '@material-ui/core';
import DropDownIcon from '@material-ui/icons/ArrowDropDown';
import AddIcon from '@material-ui/icons/Add';
import FilterIcon from '@material-ui/icons/FilterList';
import SelectAllIcon from '@material-ui/icons/SelectAll';
import { Table } from '@devexpress/dx-react-grid-material-ui';
import Invite, { IInviteData } from './Invite';
import { useSnackBar } from '../hoc/SnackBar';
import Confirm from './AlertDialog';
import ShapingTable from './ShapingTable';
import { related } from '../crud';
import { localizeRole } from '../utils';
import { useRole } from '../crud';

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
    link: {},
  })
);

interface IRow {
  email: string;
  orgRole: string;
  accepted: string;
  id: RecordIdentity;
}

const getInvites = (
  organization: string,
  roles: Array<Role>,
  invitations: Array<Invitation>,
  ts: ISharedStrings
) => {
  const invites = invitations.filter(
    (i) => related(i, 'organization') === organization
  );
  return invites.map((i) => {
    const role = roles.filter((r) => r.id === related(i, 'role'));
    return {
      email: i.attributes.email ? i.attributes.email : '',
      orgRole: localizeRole(
        role.length > 0 ? role[0].attributes.roleName : 'member',
        ts
      ),
      accepted: i.attributes.accepted ? ts.yes : ts.no,
      id: { type: 'invitation', id: i.id },
    } as IRow;
  });
};

interface IStateProps {
  t: IInvitationTableStrings;
  ts: ISharedStrings;
}

interface IDispatchProps {}

interface IRecordProps {
  roles: Array<Role>;
  groups: Array<Group>;
  invitations: Array<Invitation>;
}

interface IProps extends IStateProps, IDispatchProps, IRecordProps {}

export function InvitationTable(props: IProps) {
  const { t, ts, roles, invitations } = props;
  const classes = useStyles();
  const [organization] = useGlobal('organization');
  const [memory] = useGlobal('memory');
  const { showMessage } = useSnackBar();
  const [data, setData] = useState(Array<IRow>());
  const [actionMenuItem, setActionMenuItem] = useState(null);
  const [check, setCheck] = useState(Array<number>());
  const [confirmAction, setConfirmAction] = useState('');
  const columnDefs = [
    { name: 'email', title: t.email },
    { name: 'orgRole', title: t.role },
    { name: 'accepted', title: t.accepted },
  ];
  const columnWidths = [
    { columnName: 'email', width: 200 },
    { columnName: 'orgRole', width: 200 },
    { columnName: 'accepted', width: 120 },
  ];
  const [filter, setFilter] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogData, setDialogData] = useState(null as Invitation | null);
  const [offline] = useGlobal('offline');
  const { getInviteProjRole } = useRole();

  const handleAdd = () => {
    setDialogData(null);
    setDialogVisible(true);
  };
  const handleAddComplete = async (invite: IInviteData) => {
    setDialogVisible(false);
  };

  const handleAddCancel = () => {
    setDialogVisible(false);
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
        showMessage(t.selectRows.replace('{0}', what));
      } else {
        setConfirmAction(what);
      }
    }
  };
  const handleActionConfirmed = () => {
    if (confirmAction === 'Delete') {
      setCheck(Array<number>());
      check.forEach((i) => {
        memory.update((t: TransformBuilder) => t.removeRecord(data[i].id));
      });
    }
    setConfirmAction('');
  };
  const handleActionRefused = () => {
    setConfirmAction('');
  };

  const NoDataCell = connect(mapStateToProps)(
    ({ value, style, t, ...restProps }: any) => {
      return (
        <Table.Cell {...restProps} style={{ ...style }} value>
          <Typography variant="h6" align="center">
            {t.noData}
          </Typography>
        </Table.Cell>
      );
    }
  ) as any;

  useEffect(() => {
    setData(getInvites(organization, roles, invitations, ts));
  }, [organization, roles, invitations, confirmAction, ts]);
  const canEdit = () => {
    const projRole = getInviteProjRole(organization);
    return projRole === RoleNames.Admin && !offline;
  };
  return (
    <div className={classes.container}>
      <div className={classes.paper}>
        <div className={classes.actions}>
          {canEdit() && (
            <>
              <Button
                id="inviteAdd"
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
                id="inviteAction"
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
                <MenuItem
                  id="inviteDelete"
                  onClick={handleConfirmAction('Delete')}
                >
                  {t.delete}
                </MenuItem>
              </Menu>
            </>
          )}
          <div className={classes.grow}>{'\u00A0'}</div>
          <Button
            id="inviteFilt"
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
          noDataCell={NoDataCell}
          rows={data}
          select={handleCheck}
          shaping={filter}
        />
      </div>
      <Invite
        visible={dialogVisible}
        inviteIn={dialogData}
        addCompleteMethod={handleAddComplete}
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
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'invitationTable' }),
  ts: localStrings(state, { layout: 'shared' }),
});

const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
  ...bindActionCreators({}, dispatch),
});

const mapRecordsToProps = {
  roles: (q: QueryBuilder) => q.findRecords('role'),
  groups: (q: QueryBuilder) => q.findRecords('group'),
  invitations: (q: QueryBuilder) => q.findRecords('invitation'),
};

export default withData(mapRecordsToProps)(
  connect(mapStateToProps, mapDispatchToProps)(InvitationTable) as any
) as any;
