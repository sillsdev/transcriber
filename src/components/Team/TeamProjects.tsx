import React from 'react';
import { useGlobal } from '../../context/GlobalContext';
import { Grid } from '@mui/material';
import { TeamContext } from '../../context/TeamContext';
import { TeamItem } from '.';
import PersonalItem from './PersonalItem';
import ImportTab from '../ImportTab';
import { getPlanName } from '../../context/TranscriberContext';
import { related } from '../../crud';

export const TeamProjects = () => {
  const [offline] = useGlobal('offline'); //verified this is not used in a function 2/18/25
  const [offlineOnly] = useGlobal('offlineOnly'); //will be constant here
  const ctx = React.useContext(TeamContext);
  const { teams, importOpen, setImportOpen, importProject, personalProjects } =
    ctx.state;

  return (
    <>
      <Grid container>
        {(personalProjects.length > 0 || !offline || offlineOnly) && (
          <PersonalItem key={1} />
        )}
        {teams.map((i) => {
          return <TeamItem key={i.id} team={i} />;
        })}
      </Grid>
      {importOpen && (
        <ImportTab
          isOpen={importOpen}
          onOpen={setImportOpen}
          planName={importProject ? getPlanName(importProject.id) : undefined}
          project={
            importProject ? related(importProject, 'project') : undefined
          } //actual project id...not plan id
        />
      )}
    </>
  );
};
