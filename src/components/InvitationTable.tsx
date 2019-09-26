import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { IState, Role, Invitation, IInvitationTableStrings } from '../model';
import localStrings from '../selector/localize';
import { withData } from 'react-orbitjs';
import { QueryBuilder, RecordIdentity, TransformBuilder } from '@orbit/data';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import { Button, Menu, MenuItem } from '@material-ui/core';
import DropDownIcon from '@material-ui/icons/ArrowDropDown';
import AddIcon from '@material-ui/icons/Add';
import FilterIcon from '@material-ui/icons/FilterList';
import SelectAllIcon from '@material-ui/icons/SelectAll';
import Invite from './Invite';
import SnackBar from './SnackBar';
import Confirm from './AlertDialog';
import ShapingTable from './ShapingTable';
import { related, remoteIdNum } from '../utils';
import moment from 'moment';

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
  email: string;
  role: string;
  accepted: string;
  id: RecordIdentity;
}

const getMedia = (
  organization: string,
  roles: Array<Role>,
  invitations: Array<Invitation>
) => {
  const invites = invitations.filter(
    i => related(i, 'organization') === organization
  );
  return invites.map(i => {
    const role = roles.filter(r => r.id === related(i, 'role'));
    return {
      email: i.attributes.email ? i.attributes.email : '',
      role: role.length === 1 ? role[0].attributes.roleName : '',
      accepted: i.attributes.accepted ? 'true' : 'false',
      id: { type: 'invitation', id: i.id },
    } as IRow;
  });
};

interface IStateProps {
  t: IInvitationTableStrings;
}

interface IDispatchProps {}

interface IRecordProps {
  roles: Array<Role>;
  invitations: Array<Invitation>;
}

interface IProps extends IStateProps, IDispatchProps, IRecordProps {}

export function InvitationTable(props: IProps) {
  const { t, roles, invitations } = props;
  const classes = useStyles();
  const [organization] = useGlobal('organization');
  const [memory] = useGlobal('memory');
  const [schema] = useGlobal('schema');
  const [keyMap] = useGlobal('keyMap');
  const [user] = useGlobal('user');
  const [message, setMessage] = useState(<></>);
  const [data, setData] = useState(Array<IRow>());
  const [actionMenuItem, setActionMenuItem] = useState(null);
  const [check, setCheck] = useState(Array<number>());
  const [confirmAction, setConfirmAction] = useState('');
  const columnDefs = [
    { name: 'email', title: t.email },
    { name: 'role', title: t.role },
    { name: 'accepted', title: t.accepted },
  ];
  const columnWidths = [
    { columnName: 'email', width: 200 },
    { columnName: 'role', width: 100 },
    { columnName: 'accepted', width: 100 },
  ];
  const [filter, setFilter] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogData, setDialogData] = useState(null as Invitation | null);

  const handleAdd = () => {
    setDialogData(null);
    setDialogVisible(true);
  };
  const handleAddMethod = async (email: string, role: string) => {
    setDialogVisible(false);
    let invitation: Invitation = {
      type: 'invitation',
      attributes: {
        email: email,
        accepted: false,
        dateCreated: moment().format(),
        dateUpdated: null,
        lastUpdatedBy: remoteIdNum('user', user, keyMap),
      },
    } as any;
    schema.initializeRecord(invitation);

    await memory.update((t: TransformBuilder) => [
      t.addRecord(invitation),
      t.replaceRelatedRecord(
        { type: 'invitation', id: invitation.id },
        'organization',
        {
          type: 'organization',
          id: organization,
        }
      ),
      t.replaceRelatedRecord(
        { type: 'invitation', id: invitation.id },
        'role',
        {
          type: 'role',
          id: role,
        }
      ),
    ]);
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
    setData(getMedia(organization, roles, invitations));
  }, [organization, roles, invitations, confirmAction]);

  return (
    <div className={classes.container}>
      <div className={classes.paper}>
        <div className={classes.actions}>
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
        planIn={dialogData}
        addMethod={handleAddMethod}
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
  t: localStrings(state, { layout: 'invitationTable' }),
});

const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
  ...bindActionCreators({}, dispatch),
});

const mapRecordsToProps = {
  roles: (q: QueryBuilder) => q.findRecords('role'),
  invitations: (q: QueryBuilder) => q.findRecords('invitation'),
};

export default withData(mapRecordsToProps)(connect(
  mapStateToProps,
  mapDispatchToProps
)(InvitationTable) as any) as any;
