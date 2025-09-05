import { Box, Grid, Typography } from '@mui/material';
import AppHead from './App/AppHead';
import { TeamProvider } from '../context/TeamContext';
import { AltButton } from '../control/AltButton';
import { GrowingSpacer } from '../control/GrowingSpacer';
import { PriButton } from '../control/PriButton';

interface BurritoHeaderProps {
  children: React.ReactNode;
  burritoType?: string;
  teamId?: string;
  setView: (view: string) => void;
  onSave?: () => void;
  saveDisabled?: boolean;
  action?: React.ReactNode;
}

export function BurritoHeader({
  children,
  setView,
  burritoType,
  teamId,
  onSave,
  saveDisabled = false,
  action,
}: BurritoHeaderProps) {
  return (
    <Box sx={{ width: '100%' }}>
      <AppHead />
      <TeamProvider>
        <Box id="BurritoScreen" sx={{ display: 'flex', paddingTop: '80px' }}>
          <Grid container alignItems="center">
            <AltButton onClick={() => setView('/team')}>Teams</AltButton>
            {onSave && (
              <AltButton onClick={() => setView(`/burrito/${teamId}`)}>
                Back
              </AltButton>
            )}
            <GrowingSpacer />
            <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
              {`Scripture Burrito ${burritoType ? `- ${burritoType}` : ''}`}
            </Typography>
            <GrowingSpacer />
            <Grid container spacing={5} justifyContent={'center'} sx={{ p: 5 }}>
              {children}
            </Grid>
            {onSave && (
              <Grid container justifyContent={'center'} sx={{ pt: 2 }}>
                {action}
                <PriButton onClick={onSave} disabled={saveDisabled}>
                  Save
                </PriButton>
              </Grid>
            )}
          </Grid>
        </Box>
      </TeamProvider>
    </Box>
  );
}
