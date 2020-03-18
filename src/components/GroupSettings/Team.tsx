import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import { connect } from 'react-redux';
import {
  IState,
  GroupMembership,
  Role,
  User,
  OrganizationMembership,
  IGroupSettingsStrings,
  IDeleteItem,
  Group,
  RoleNames,
  Project,
} from '../../model';
import localStrings from '../../selector/localize';
import { withData } from '../../mods/react-orbitjs';
import { QueryBuilder, TransformBuilder } from '@orbit/data';
import { Grid } from '@material-ui/core';
import useOwnerIds from './useOwnerIds';
import useReviewerIds from './useReviewerIds';
import useTranscriberIds from './useTranscriberIds';
import TeamCol from './TeamCol';
import GroupMemberAdd from './GroupMemberAdd';
import Confirm from '../AlertDialog';
import { OptionType } from '../ReactSelect';
import { related, getRoleId } from '../../utils';
import SnackBar from '../SnackBar';

interface IStateProps {
  t: IGroupSettingsStrings;
}

interface IRecordProps {
  users: User[];
  orgMemberships: OrganizationMembership[];
  groupMemberships: GroupMembership[];
  roles: Role[];
  groups: Group[];
}

interface IProps extends IStateProps, IRecordProps {
  detail: boolean;
  selectedGroup?: string;
}

function Team(props: IProps) {
  const {
    groups,
    roles,
    groupMemberships,
    users,
    orgMemberships,
    t,
    selectedGroup,
  } = props;
  const [memory] = useGlobal('memory');
  const [project] = useGlobal('project');
  const [group, setGroup] = useGlobal('group');
  const [organization] = useGlobal('organization');
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState('');
  const [orgPeople, setOrgPeople] = useState(Array<OptionType>());
  const [confirmItem, setConfirmItem] = useState<IDeleteItem | null>(null);
  const [message, setMessage] = useState(<></>);
  const [allUsers, setAllUsers] = useState(false);

  const handleRemove = (id: string, name: string) => {
    setConfirmItem({ id, name });
  };

  const getGroups = (userId: string) => {
    return groupMemberships
      .filter(
        gm => related(gm, 'group') === group && related(gm, 'user') === userId
      )
      .map(gm => gm.id);
  };

  const handleDeleteConfirmed = () => {
    const userId = confirmItem ? confirmItem.id : '';
    const ids = getGroups(userId);
    if (ids.length > 0) {
      memory.update((t: TransformBuilder) =>
        t.removeRecord({ type: 'groupmembership', id: ids[0] })
      );
    }
    setConfirmItem(null);
  };
  const handleDeleteRefused = () => setConfirmItem(null);

  const handleUpdate = (id: string, role: RoleNames) => {
    const ids = getGroups(id);
    const roleId = getRoleId(roles, role);
    if (ids.length > 0 && roleId.length > 0) {
      memory.update((t: TransformBuilder) =>
        t.replaceRelatedRecord(
          { type: 'groupmembership', id: ids[0] },
          'role',
          { type: 'role', id: roleId }
        )
      );
    }
  };

  const roleCheck = (userId: string, role: RoleNames) => {
    const groupRoles = [
      RoleNames.Admin,
      RoleNames.Editor,
      RoleNames.Transcriber,
    ];
    const roleIndex = groupRoles.indexOf(role);
    const groupRole = groupMemberships
      .filter(
        gm => related(gm, 'group') === group && related(gm, 'user') === userId
      )
      .map(gm => related(gm, 'role'));
    if (groupRole.length === 0) return true;
    const roleName = roles
      .filter(r => r.id === groupRole[0])
      .map(r => r.attributes && r.attributes.roleName);
    if (roleName.length === 0) return false; // This should not happen
    const roleKey = roleName[0];
    return groupRoles.indexOf(roleKey as RoleNames) > roleIndex;
  };

  const handleAdd = (role: RoleNames) => {
    const allOrgUserIds = orgMemberships
      .filter(om => related(om, 'organization') === organization)
      .map(om => related(om, 'user'));
    setOrgPeople(
      users
        .filter(
          u =>
            u.attributes &&
            allOrgUserIds.indexOf(u.id) !== -1 &&
            roleCheck(u.id, role)
        )
        .sort((i, j) => (i.attributes.name < j.attributes.name ? -1 : 1))
        .map(u => {
          return { label: u.attributes.name, value: u.id } as OptionType;
        })
    );
    setRole(role);
    setOpen(true);
  };

  const handleMessageReset = () => setMessage(<></>);

  useEffect(() => {
    const groupAll = groups
      .filter(g => g.id === group && g.attributes)
      .map(g => g.attributes.allUsers);
    if (groupAll.length > 0) setAllUsers(groupAll[0]);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [group]);

  useEffect(() => {
    if (!selectedGroup || selectedGroup === '') {
      const projRec = memory.cache.query((q: QueryBuilder) =>
        q.findRecord({ type: 'project', id: project })
      ) as Project;
      setGroup(related(projRec, 'group'));
    } else {
      setGroup(selectedGroup);
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [project, selectedGroup]);

  return (
    <>
      <Grid container>
        <TeamCol
          {...props}
          title={t.owners}
          titledetail={t.ownersDetail}
          people={useOwnerIds(props)}
          add={() => handleAdd(RoleNames.Admin)}
          del={(id: string, name: string) => handleUpdate(id, RoleNames.Editor)}
        />
        <TeamCol
          {...props}
          title={t.editors}
          titledetail={t.editorsDetail}
          people={useReviewerIds(props)}
          add={() => handleAdd(RoleNames.Editor)}
          del={(id: string, name: string) =>
            handleUpdate(id, RoleNames.Transcriber)
          }
          noDeleteInfo={t.noDeleteInfo}
        />
        <TeamCol
          {...props}
          title={t.transcribers}
          titledetail={t.transcribersDetail}
          people={useTranscriberIds(props)}
          add={() => handleAdd(RoleNames.Transcriber)}
          del={handleRemove}
          allUsers={allUsers}
          noDeleteInfo={t.noDeleteInfo}
          noDeleteAllUsersInfo={t.noDeleteAllUsersInfo}
        />
      </Grid>
      <GroupMemberAdd
        open={open}
        role={role}
        orgPeople={orgPeople}
        setOpen={setOpen}
      />
      <SnackBar {...props} message={message} reset={handleMessageReset} />
      {confirmItem !== null ? (
        <Confirm
          title={t.delete}
          text={confirmItem.name}
          yesResponse={handleDeleteConfirmed}
          noResponse={handleDeleteRefused}
        />
      ) : (
        <></>
      )}
    </>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'groupSettings' }),
});

const mapRecordsToProps = {
  users: (q: QueryBuilder) => q.findRecords('user'),
  orgMemberships: (q: QueryBuilder) => q.findRecords('organizationmembership'),
  groupMemberships: (q: QueryBuilder) => q.findRecords('groupmembership'),
  roles: (q: QueryBuilder) => q.findRecords('role'),
  groups: (q: QueryBuilder) => q.findRecords('group'),
};

export default withData(mapRecordsToProps)(
  connect(mapStateToProps)(Team) as any
) as any;
