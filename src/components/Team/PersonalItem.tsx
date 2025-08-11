import React, { useState, useContext } from 'react';
import { useGetGlobal, useGlobal } from '../../context/GlobalContext';
import { Grid, IconButton } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import { TeamContext } from '../../context/TeamContext';
import BigDialog from '../../hoc/BigDialog';
import { ProjectCard, AddCard, TeamDialog, ITeamDialog } from '.';
import { StepEditor } from '../StepEditor';
import { defaultWorkflow, useBible } from '../../crud';
import { UnsavedContext } from '../../context/UnsavedContext';
import { TeamPaper, TeamHeadDiv, TeamName, AltButton } from '../../control';
import DialogMode from '../../model/dialogMode';
import { useOrbitData } from '../../hoc/useOrbitData';
import { OrganizationD } from '../../model';
import SortIcon from '@mui/icons-material/Sort';
import { ProjectSort } from './ProjectDialog/projectSort';

export const PersonalItem = () => {
  const ctx = React.useContext(TeamContext);
  const { personalTeam, personalProjects, cardStrings, teamUpdate } = ctx.state;
  const t = cardStrings;
  const [offlineOnly] = useGlobal('offlineOnly'); //will be constant here
  const [isOffline] = useGlobal('offline'); //verified this is not used in a function 2/18/25
  const [busy] = useGlobal('remoteBusy'); //verified this is not used in a function 2/18/25
  const orgs = useOrbitData<OrganizationD[]>('organization');
  const getGlobal = useGetGlobal();
  const [editOpen, setEditOpen] = useState(false);
  const { createBible, updateBible } = useBible();
  const { startSave, waitForSave } = useContext(UnsavedContext).state;
  const [sortVisible, setSortVisible] = useState(false);
  const [showWorkflow, setShowWorkflow] = useState(false);

  const handleSettings = () => {
    setEditOpen(true);
  };

  const team = React.useMemo(
    () => orgs.find((o) => o.id === personalTeam),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [personalTeam, orgs]
  );

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

    cb && (await cb(values.team.id));
    setEditOpen(false);
  };

  const handleWorkflow = (isOpen: boolean) => {
    if (getGlobal('changed')) {
      startSave();
      waitForSave(() => setShowWorkflow(isOpen), 500);
    } else setShowWorkflow(isOpen);
  };

  const handleEditWorkflow = () => {
    setShowWorkflow(true);
  };
  const canModify = (offline: boolean, offlineOnly: boolean) =>
    !offline || offlineOnly;

  return (
    <TeamPaper id="PersonalItem">
      <TeamHeadDiv>
        <Grid container>
          <Grid item xs={12} md={8}>
            <TeamName variant="h5">
              <PersonIcon sx={{ pr: 1 }} />
              {t.personalProjects}
            </TeamName>
          </Grid>
          <Grid
            item
            xs={12}
            md={4}
            sx={{ display: 'flex', justifyContent: 'flex-end' }}
          >
            {personalProjects.length > 1 && (
              <IconButton onClick={() => setSortVisible(true)}>
                <SortIcon />
              </IconButton>
            )}
            {canModify(isOffline, offlineOnly) && (
              <AltButton id="editWorkflow" onClick={handleEditWorkflow}>
                {t.editWorkflow.replace('{0}', '')}
              </AltButton>
            )}
            {canModify(isOffline, offlineOnly) && (
              <AltButton
                id="teamSettings"
                onClick={handleSettings}
                disabled={busy}
              >
                {t.settings}
              </AltButton>
            )}
          </Grid>
        </Grid>
      </TeamHeadDiv>
      <Grid container sx={{ px: 2 }}>
        {personalProjects.map((i) => {
          return <ProjectCard key={i.id} project={i} />;
        })}
        {(!isOffline || offlineOnly) && <AddCard team={null} />}
      </Grid>
      <BigDialog
        title={t.editWorkflow.replace('{0}', `- ${t.personalProjects}`)}
        isOpen={showWorkflow}
        onOpen={handleWorkflow}
      >
        <StepEditor process={defaultWorkflow} org={personalTeam} />
      </BigDialog>
      <BigDialog
        title={t.sortProjects}
        isOpen={sortVisible}
        onOpen={() => setSortVisible(false)}
      >
        <ProjectSort onClose={() => setSortVisible(false)} />
      </BigDialog>
      {editOpen && (
        <TeamDialog
          mode={DialogMode.edit}
          values={{ team } as ITeamDialog}
          isOpen={editOpen}
          onOpen={setEditOpen}
          onCommit={handleCommitSettings}
        />
      )}
    </TeamPaper>
  );
};
export default PersonalItem;
