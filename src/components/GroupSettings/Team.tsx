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
  ISharedStrings,
} from '../../model';
import localStrings from '../../selector/localize';
import { withData } from '../../mods/react-orbitjs';
import { QueryBuilder, TransformBuilder } from '@orbit/data';
import { Grid, Typography, Box, BoxProps, styled } from '@mui/material';
import useOwnerIds from './useOwnerIds';
import useReviewerIds from './useReviewerIds';
import useTranscriberIds from './useTranscriberIds';
import TeamCol from './TeamCol';
import GroupMemberAdd from './GroupMemberAdd';
import Confirm from '../AlertDialog';
import { OptionType } from '../../model';
import { related, useRole } from '../../crud';
import { localizeRole } from '../../utils';
import { ReplaceRelatedRecord } from '../../model/baseModel';

const StyledBox = styled(Box)<BoxProps>(({ theme }) => ({
  width: '100%',
  backgroundColor: theme.palette.background.default,
  marginTop: theme.spacing(3),
  '& .MuiPaper-rounded': {
    borderRadius: '8px',
  },
}));

interface IStateProps {
  t: IGroupSettingsStrings;
  ts: ISharedStrings;
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
  const { groupMemberships, users, orgMemberships, t, ts, selectedGroup } =
    props;
  const [memory] = useGlobal('memory');
  const [project] = useGlobal('project');
  const [group, setGroup] = useGlobal('group');
  const [organization] = useGlobal('organization');
  const [offline] = useGlobal('offline');
  const [offlineOnly] = useGlobal('offlineOnly');
  const {
    getRoleId,
    getTranscriberRoleIds,
    getEditorRoleIds,
    getLocalizedTranscriberRoles,
    getLocalizedEditorRoles,
  } = useRole();
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState('');
  const [orgPeople, setOrgPeople] = useState(Array<OptionType>());
  const [confirmItem, setConfirmItem] = useState<IDeleteItem | null>(null);
  // const [allUsers, setAllUsers] = useState(false);

  const ownerRole = localizeRole(RoleNames.Admin, ts, true);
  const editorRoles = getLocalizedEditorRoles(ts);
  const transcriberRoles = getLocalizedTranscriberRoles(ts);
  const editorRoleDesc = t.roles.replace(
    '{0}',
    editorRoles.filter((r) => r !== ownerRole).join(', ')
  );
  const transcriberRoleDesc = t.roles.replace(
    '{0}',
    transcriberRoles.filter((r) => !editorRoles.includes(r)).join(', ')
  );
  const handleRemove = (id: string, name: string) => {
    setConfirmItem({ id, name });
  };

  const getGroups = (userId: string) => {
    return groupMemberships
      .filter(
        (gm) => related(gm, 'group') === group && related(gm, 'user') === userId
      )
      .map((gm) => gm.id);
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
    const roleId = getRoleId(role);
    if (ids.length > 0 && roleId.length > 0) {
      memory.update((t: TransformBuilder) => [
        ...ReplaceRelatedRecord(
          t,
          { type: 'groupmembership', id: ids[0] },
          'role',
          'role',
          roleId
        ),
      ]);
    }
  };

  const roleCheck = (userId: string, role: RoleNames) => {
    const groupRoles = [
      [getRoleId(RoleNames.Admin)],
      getEditorRoleIds(),
      getTranscriberRoleIds(),
    ];

    const incl = groupRoles.map((gr) => gr.includes(getRoleId(role)));
    const roleIndex = incl.indexOf(true);
    const userRoleId = groupMemberships
      .filter(
        (gm) => related(gm, 'group') === group && related(gm, 'user') === userId
      )
      .map((gm) => related(gm, 'role'));
    if (userRoleId.length === 0) return true;
    const userincl = groupRoles.map((gr) => gr.includes(userRoleId[0]));
    const userRoleIndex = userincl.indexOf(true);
    //Do we want to let them change the user from a non-transcription
    return userRoleIndex === -1 || userRoleIndex > roleIndex;
  };

  const handleAdd = (role: RoleNames) => {
    const allOrgUserIds = orgMemberships
      .filter((om) => related(om, 'organization') === organization)
      .map((om) => related(om, 'user'));
    setOrgPeople(
      users
        .filter(
          (u) =>
            u.attributes &&
            allOrgUserIds.indexOf(u.id) !== -1 &&
            roleCheck(u.id, role)
        )
        .sort((i, j) => (i.attributes.name <= j.attributes.name ? -1 : 1))
        .map((u) => {
          return { label: u.attributes.name, value: u.id } as OptionType;
        })
    );
    setRole(role);
    setOpen(true);
  };

  //useEffect(() => {
  //  const groupAll = groups
  //    .filter((g) => g.id === group && g.attributes)
  //    .map((g) => g.attributes.allUsers);
  //  if (groupAll.length > 0) setAllUsers(groupAll[0]);
  //  /* eslint-disable-next-line react-hooks/exhaustive-deps */
  //}, [group]);

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
    <StyledBox>
      <Typography variant="h6" sx={{ mb: 3 }}>
        {t.transcriptionTitle}
      </Typography>
      <Grid container>
        <TeamCol
          {...props}
          title={t.owners}
          titledetail={t.ownersDetail}
          roledetail={' '}
          people={useOwnerIds(props)}
          add={() => handleAdd(RoleNames.Admin)}
          del={
            offline && !offlineOnly
              ? undefined
              : (id: string, name: string) => handleUpdate(id, RoleNames.Editor)
          }
          noDeleteInfo={t.noDeleteAdmin}
        />
        <TeamCol
          {...props}
          title={t.editors}
          titledetail={t.editorsDetail}
          roledetail={editorRoleDesc}
          people={useReviewerIds(props)}
          add={() => handleAdd(RoleNames.Editor)}
          del={
            offline && !offlineOnly
              ? undefined
              : (id: string, name: string) =>
                  handleUpdate(id, RoleNames.Transcriber)
          }
          noDeleteInfo={t.noDeleteInfo}
        />
        <TeamCol
          {...props}
          title={t.transcribers}
          titledetail={t.transcribersDetail}
          roledetail={transcriberRoleDesc}
          people={useTranscriberIds(props)}
          add={() => handleAdd(RoleNames.Transcriber)}
          del={offline && !offlineOnly ? undefined : handleRemove}
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
    </StyledBox>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'groupSettings' }),
  ts: localStrings(state, { layout: 'shared' }),
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
