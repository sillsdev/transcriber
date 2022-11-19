import React, { useState, useEffect, useContext } from 'react';
import { useGlobal } from 'reactn';
import { Grid } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import { TeamContext } from '../../context/TeamContext';
import BigDialog from '../../hoc/BigDialog';
import { ProjectCard, AddCard } from '.';
import { StepEditor } from '../StepEditor';
import { useNewTeamId, defaultWorkflow } from '../../crud';
import { UnsavedContext } from '../../context/UnsavedContext';
import { TeamPaper, TeamHeadDiv, TeamName, AltButton } from '../../control';

export const PersonalItem = () => {
  const ctx = React.useContext(TeamContext);
  const { personalProjects, cardStrings } = ctx.state;
  const t = cardStrings;
  const [isOffline] = useGlobal('offline');
  const [offlineOnly] = useGlobal('offlineOnly');
  const [changed] = useGlobal('changed');
  const { startSave, waitForSave } = useContext(UnsavedContext).state;
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [org, setOrg] = useState('');
  const getTeamId = useNewTeamId();

  const handleWorkflow = (isOpen: boolean) => {
    if (changed) {
      startSave();
      waitForSave(() => setShowWorkflow(isOpen), 500);
    } else setShowWorkflow(isOpen);
  };

  const handleEditWorkflow = () => {
    setShowWorkflow(true);
  };
  const canModify = (offline: boolean, offlineOnly: boolean) =>
    !offline || offlineOnly;

  useEffect(() => {
    getTeamId(undefined).then((val: string) => {
      setOrg(val);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <TeamPaper id="PersonalItem">
      <TeamHeadDiv>
        <TeamName variant="h5">
          <PersonIcon sx={{ pr: 1 }} />
          {t.personalProjects}
        </TeamName>
        {'\u00A0'}
        {canModify(isOffline, offlineOnly) && (
          <AltButton id="editWorkflow" onClick={handleEditWorkflow}>
            {t.editWorkflow.replace('{0}', '')}
          </AltButton>
        )}
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
        <StepEditor process={defaultWorkflow} org={org} />
      </BigDialog>
    </TeamPaper>
  );
};
