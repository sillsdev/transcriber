import React, { useContext, useState, useMemo } from 'react';
import { useGetGlobal, useGlobal } from '../../context/GlobalContext';
import { Grid, IconButton } from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import { Organization, DialogMode, OrganizationD } from '../../model';
import { TeamContext } from '../../context/TeamContext';
import BigDialog, { BigDialogBp } from '../../hoc/BigDialog';
import { StepEditor } from '../StepEditor';
import GroupTabs from '../GroupTabs';
import { ProjectCard, AddCard } from '.';
import TeamDialog, { ITeamDialog } from './TeamDialog';
import { useRole, defaultWorkflow, useBible } from '../../crud';
import Confirm from '../AlertDialog';
import { UnsavedContext } from '../../context/UnsavedContext';
import { TeamPaper, TeamHeadDiv, TeamName, AltButton } from '../../control';
import { RecordIdentity } from '@orbit/records';
import { ProjectSort } from './ProjectDialog/projectSort';
import SortIcon from '@mui/icons-material/Sort';

interface IProps {
  team: OrganizationD;
}

export const TeamItem = (props: IProps) => {
  const { team } = props;
  const [offline] = useGlobal('offline'); //verified this is not used in a function 2/18/25
  const [offlineOnly] = useGlobal('offlineOnly'); //will be constant here
  const [, setOrganization] = useGlobal('organization');
  const [busy] = useGlobal('remoteBusy'); //verified this is not used in a function 2/18/25
  const [editOpen, setEditOpen] = useState(false);
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [deleteItem, setDeleteItem] = useState<RecordIdentity>();
  const ctx = React.useContext(TeamContext);
  const {
    teamProjects,
    teamMembers,
    teamUpdate,
    teamDelete,
    isAdmin,
    resetProjectPermissions,
  } = ctx.state;
  const t = ctx.state.cardStrings;
  const { createBible, updateBible } = useBible();
  const [openMember, setOpenMember] = useState(false);
  const { setMyOrgRole, userIsAdmin } = useRole();
  const { startSave, waitForSave } = useContext(UnsavedContext).state;
  const [sortVisible, setSortVisible] = useState(false);
  const getGlobal = useGetGlobal();
  const handleMembers = (team: OrganizationD) => () => {
    setOrganization(team.id);
    setMyOrgRole(team.id);
    setOpenMember(true);
  };

  const handleSettings = (team: Organization) => () => {
    setEditOpen(true);
  };

  const handleCommitSettings = async (
    values: ITeamDialog,
    cb?: (id: string) => Promise<void>
  ) => {
    if (values.bible)
      if (!values.bible.id) {
        await createBible(
          values.bible,
          values.bibleMediafile,
          values.isoMediafile,
          values.team.id
        );
      } else
        await updateBible(
          values.bible,
          values.bibleMediafile,
          values.isoMediafile,
          values.team.id
        );

    teamUpdate(values.team);
    if (values.resetProjectPermissions) await resetProjectPermissions(team.id);
    cb && (await cb(values.team.id));
    setEditOpen(false);
  };

  const handleDeleteTeam = (team: RecordIdentity) => {
    setDeleteItem(team);
  };

  const handleDeleteConfirmed = async () => {
    deleteItem && (await teamDelete(deleteItem));
    setEditOpen(false);
  };

  const handleDeleteRefused = () => setDeleteItem(undefined);

  const handleWorkflow = (isOpen: boolean) => {
    if (getGlobal('changed')) {
      startSave();
      waitForSave(() => setShowWorkflow(isOpen), 500);
    } else setShowWorkflow(isOpen);
  };

  const handleEditWorkflow = () => {
    setShowWorkflow(true);
  };

  const canModify = useMemo(() => {
    return (!offline && isAdmin(team)) || offlineOnly;
  }, [offline, team, offlineOnly, isAdmin]);

  return (
    <TeamPaper id="TeamItem">
      <TeamHeadDiv>
        <Grid container direction={'row'}>
          <Grid item xs={12} md={4} lg={7}>
            <TeamName variant="h5">
              <GroupIcon sx={{ pr: 1 }} />
              {team?.attributes?.name}
            </TeamName>
          </Grid>
          <Grid
            item
            xs={12}
            md={8}
            lg={5}
            sx={{ display: 'flex', justifyContent: 'flex-end' }}
          >
            {userIsAdmin && (
              <IconButton onClick={handleSettings(team)}>
                <SortIcon />
              </IconButton>
            )}
            <IconButton onClick={() => setSortVisible(true)}>
              <SortIcon />
            </IconButton>
            <AltButton id="teamMembers" onClick={handleMembers(team)}>
              {t.members.replace('{0}', teamMembers(team.id).toString())}
            </AltButton>
            {canModify && (
              <AltButton
                id="editWorkflow"
                onClick={handleEditWorkflow}
                disabled={busy}
              >
                {t.editWorkflow.replace('{0}', '')}
              </AltButton>
            )}
            {canModify && (
              <AltButton
                id="teamSettings"
                onClick={handleSettings(team)}
                disabled={busy}
              >
                {t.settings}
              </AltButton>
            )}
          </Grid>
        </Grid>
      </TeamHeadDiv>
      {editOpen && (
        <TeamDialog
          mode={DialogMode.edit}
          values={{ team } as ITeamDialog}
          isOpen={editOpen}
          onOpen={setEditOpen}
          onCommit={handleCommitSettings}
          onDelete={handleDeleteTeam}
        />
      )}
      <BigDialog
        title={t.members.replace('{0}', team?.attributes?.name || '')}
        isOpen={openMember}
        onOpen={setOpenMember}
        bp={BigDialogBp.md}
      >
        <GroupTabs />
      </BigDialog>
      <BigDialog
        title={t.editWorkflow.replace(
          '{0}',
          `- ${team?.attributes?.name || ''}`
        )}
        isOpen={showWorkflow}
        onOpen={handleWorkflow}
      >
        <StepEditor process={defaultWorkflow} org={team.id} />
      </BigDialog>
      <BigDialog
        title={t.sortProjects}
        isOpen={sortVisible}
        onOpen={() => setSortVisible(false)}
      >
        <ProjectSort teamId={team.id} onClose={() => setSortVisible(false)} />
      </BigDialog>
      {deleteItem && (
        <Confirm
          text={''}
          yesResponse={handleDeleteConfirmed}
          noResponse={handleDeleteRefused}
        />
      )}
      <Grid container sx={{ px: 2 }}>
        {teamProjects(team.id).map((i) => {
          return <ProjectCard key={i.id} project={i} />;
        })}
        {canModify && <AddCard team={team} />}
      </Grid>
    </TeamPaper>
  );
};
