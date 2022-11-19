import { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import { shallowEqual } from 'react-redux';
import {
  Role,
  Invitation,
  IInvitationTableStrings,
  Group,
  ISharedStrings,
} from '../model';
import { withData } from 'react-orbitjs';
import { QueryBuilder, RecordIdentity, TransformBuilder } from '@orbit/data';
import { Menu, MenuItem, Typography, Box } from '@mui/material';
import DropDownIcon from '@mui/icons-material/ArrowDropDown';
import AddIcon from '@mui/icons-material/Add';
import FilterIcon from '@mui/icons-material/FilterList';
import SelectAllIcon from '@mui/icons-material/SelectAll';
import { Table } from '@devexpress/dx-react-grid-material-ui';
import Invite, { IInviteData } from './Invite';
import { useSnackBar } from '../hoc/SnackBar';
import Confirm from './AlertDialog';
import ShapingTable from './ShapingTable';
import { related, useRole } from '../crud';
import { localizeRole } from '../utils';

import {
  ActionRow,
  AltButton,
  GrowingSpacer,
  PriButton,
  iconMargin,
} from '../control';
import { useSelector } from 'react-redux';
import { invitationTableSelector, sharedSelector } from '../selector';

interface IRow {
  email: string;
  orgRole: string;
  accepted: string;
  id: RecordIdentity;
}

const NoDataCell = ({ value, style, ...restProps }: any) => {
  const t: IInvitationTableStrings = useSelector(
    invitationTableSelector,
    shallowEqual
  );

  return (
    <Table.Cell {...restProps} style={{ ...style }} value>
      <Typography variant="h6" align="center">
        {t.noData}
      </Typography>
    </Table.Cell>
  );
};

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

interface IRecordProps {
  roles: Array<Role>;
  groups: Array<Group>;
  invitations: Array<Invitation>;
}

interface IProps {}

export function InvitationTable(props: IProps & IRecordProps) {
  const { roles, invitations } = props;
  const t: IInvitationTableStrings = useSelector(
    invitationTableSelector,
    shallowEqual
  );
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);
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
  const { userIsAdmin } = useRole();

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

  useEffect(() => {
    setData(getInvites(organization, roles, invitations, ts));
  }, [organization, roles, invitations, confirmAction, ts]);
  const canEdit = () => {
    return userIsAdmin && !offline;
  };
  return (
    <Box sx={{ display: 'flex' }}>
      <div>
        <ActionRow>
          {canEdit() && (
            <>
              <PriButton
                id="inviteAdd"
                key="add"
                aria-label={t.invite}
                onClick={handleAdd}
              >
                {t.invite}
                <AddIcon sx={iconMargin} />
              </PriButton>
              <AltButton
                id="inviteAction"
                key="action"
                aria-owns={actionMenuItem !== '' ? 'action-menu' : undefined}
                aria-label={t.action}
                onClick={handleMenu}
              >
                {t.action}
                <DropDownIcon sx={iconMargin} />
              </AltButton>
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
          <GrowingSpacer />
          <AltButton
            id="inviteFilt"
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
    </Box>
  );
}

const mapRecordsToProps = {
  roles: (q: QueryBuilder) => q.findRecords('role'),
  groups: (q: QueryBuilder) => q.findRecords('group'),
  invitations: (q: QueryBuilder) => q.findRecords('invitation'),
};

export default withData(mapRecordsToProps)(InvitationTable) as any as (
  props: IProps
) => JSX.Element;
