import React, { useContext } from 'react';
import { useGlobal } from 'reactn';
import { Grid, Button } from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import { Organization, DialogMode } from '../../model';
import { TeamContext } from '../../context/TeamContext';
import BigDialog, { BigDialogBp } from '../../hoc/BigDialog';
import { StepEditor } from '../StepEditor';
import GroupTabs from '../GroupTabs';
import { ProjectCard, AddCard } from '.';
import TeamDialog from './TeamDialog';
import { useRole, useAllUserGroup, defaultWorkflow } from '../../crud';
import Confirm from '../AlertDialog';
import { UnsavedContext } from '../../context/UnsavedContext';
import { TeamPaper, TeamHeadDiv, TeamName } from '../../control';

interface IProps {
  team: Organization;
}

export const TeamItem = (props: IProps) => {
  const { team } = props;
  const [offline] = useGlobal('offline');
  const [offlineOnly] = useGlobal('offlineOnly');
  const [, setOrganization] = useGlobal('organization');
  const [busy] = useGlobal('importexportBusy');
  const [editOpen, setEditOpen] = React.useState(false);
  const [showWorkflow, setShowWorkflow] = React.useState(false);
  const [deleteItem, setDeleteItem] = React.useState<Organization>();
  const ctx = React.useContext(TeamContext);
  const { teamProjects, teamMembers, teamUpdate, teamDelete, isAdmin } =
    ctx.state;
  const t = ctx.state.cardStrings;
  const [openMember, setOpenMember] = React.useState(false);
  const { setMyOrgRole } = useRole();
  const [, setGroup] = useGlobal('group');
  const allUserGroup = useAllUserGroup();
  const { startSave, waitForSave } = useContext(UnsavedContext).state;
  const [changed] = useGlobal('changed');

  const handleMembers = (team: Organization) => () => {
    setOrganization(team.id);
    setMyOrgRole(team.id);
    setGroup(allUserGroup(team.id)?.id);
    setOpenMember(true);
  };

  const handleSettings = (team: Organization) => () => {
    setEditOpen(true);
  };

  const handleCommitSettings = (
    team: Organization,
    cb?: (id: string) => Promise<void>
  ) => {
    teamUpdate(team);
    cb && cb(team.id);
    setEditOpen(false);
  };

  const handleDeleteTeam = (team: Organization) => {
    setDeleteItem(team);
  };

  const handleDeleteConfirmed = async () => {
    deleteItem && (await teamDelete(deleteItem));
    setEditOpen(false);
  };

  const handleDeleteRefused = () => setDeleteItem(undefined);

  const handleWorkflow = (isOpen: boolean) => {
    if (changed) {
      startSave();
      waitForSave(() => setShowWorkflow(isOpen), 500);
    } else setShowWorkflow(isOpen);
  };

  const handleEditWorkflow = () => {
    setShowWorkflow(true);
  };

  const canModify = (
    offline: boolean,
    team: Organization,
    offlineOnly: boolean
  ) => (!offline && isAdmin(team)) || offlineOnly;

  return (
    <TeamPaper id="TeamItem">
      <TeamHeadDiv>
        <TeamName variant="h5">
          <GroupIcon sx={{ pr: 1 }} />
          {team?.attributes?.name}
        </TeamName>
        <div>
          <Button
            id="teamMembers"
            variant="contained"
            onClick={handleMembers(team)}
          >
            {t.members.replace('{0}', teamMembers(team.id).toString())}
          </Button>
          {' \u00A0'}
          {canModify(offline, team, offlineOnly) && (
            <>
              <Button
                id="editWorkflow"
                onClick={handleEditWorkflow}
                variant="contained"
              >
                {t.editWorkflow.replace('{0}', '')}
              </Button>
              {' \u00A0'}
              <Button
                id="teamSettings"
                variant="contained"
                onClick={handleSettings(team)}
                disabled={busy}
              >
                {t.settings}
              </Button>
            </>
          )}
        </div>
      </TeamHeadDiv>
      <TeamDialog
        mode={DialogMode.edit}
        values={team}
        isOpen={editOpen}
        onOpen={setEditOpen}
        onCommit={handleCommitSettings}
        onDelete={handleDeleteTeam}
      />
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
      {deleteItem && (
        <Confirm
          yesResponse={handleDeleteConfirmed}
          noResponse={handleDeleteRefused}
        />
      )}
      <Grid container sx={{ px: 2 }}>
        {teamProjects(team.id).map((i) => {
          return <ProjectCard key={i.id} project={i} />;
        })}
        {canModify(offline, team, offlineOnly) && <AddCard team={team} />}
      </Grid>
    </TeamPaper>
  );
};
