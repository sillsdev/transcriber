import { Box, Grid, Typography } from '@mui/material';
import { useLocation, useParams } from 'react-router-dom';
import AppHead from '../components/App/AppHead';
import { TeamProvider } from '../context/TeamContext';
import { AltButton } from '../control/AltButton';
import React from 'react';
import { GrowingSpacer } from '../control/GrowingSpacer';
import StickyRedirect from '../components/StickyRedirect';

export function BurritoStep() {
  const { pathname } = useLocation();
  const { teamId, step } = useParams();
  const [view, setView] = React.useState('');

  if (view !== '' && view !== pathname) {
    return <StickyRedirect to={view} />;
  }

  return (
    <Box sx={{ width: '100%' }}>
      <AppHead />
      <TeamProvider>
        <Box id="BurritoScreen" sx={{ display: 'flex', paddingTop: '80px' }}>
          <Grid container alignItems="center">
            <AltButton onClick={() => setView('/team')}>Teams</AltButton>
            <AltButton onClick={() => setView(`/burrito/${teamId}`)}>
              Back
            </AltButton>
            <GrowingSpacer />
            <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
              Scripture Burrito - {step}
            </Typography>
            <GrowingSpacer />
            <Grid container direction="column" alignItems="center">
              <Typography variant="body1">
                This is the step for {step}. You can implement the logic here.
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </TeamProvider>
    </Box>
  );
}
