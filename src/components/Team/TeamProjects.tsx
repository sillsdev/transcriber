import React from 'react';
import { useGlobal } from 'reactn';
import { Grid } from '@material-ui/core';
import { TeamContext } from '../../context/TeamContext';
import { PersonalItem, TeamItem } from '.';
import ImportTab from '../ImportTab';
import { getPlanName } from '../../context/TranscriberContext';
import { related } from '../../crud';

export const TeamProjects = () => {
  const [offline] = useGlobal('offline');
  const [offlineOnly] = useGlobal('offlineOnly');
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
