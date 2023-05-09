import React from 'react';
import { Grid, Typography, styled, Box, BoxProps } from '@mui/material';
import BigDialog from '../../hoc/BigDialog';
import { TeamContext } from '../../context/TeamContext';
import StartCard from './StartCard';

const NewProjectRoot = styled(Box)<BoxProps>(() => ({
  flexGrow: 1,
  '& .MuiListSubheader-root': {
    lineHeight: 'unset',
  },
  '& .MuiListItemIcon-root': {
    minWidth: '30px',
  },
}));

interface IProps {
  open: boolean;
  onOpen: (open: boolean) => void;
  doUpload: (e: React.MouseEvent) => void;
  doRecord: (e: React.MouseEvent) => void;
  doNewProj: (e: React.MouseEvent) => void;
}

export function NewProjectGrid(props: IProps) {
  const { open, onOpen } = props;
  const { doUpload, doRecord, doNewProj } = props;
  const ctx = React.useContext(TeamContext);
  const { newProjectStrings } = ctx.state;
  const t = newProjectStrings;

  const handleUpload = (e: React.MouseEvent) => {
    doUpload(e);
    onOpen(false);
  };

  const handleRecord = (e: React.MouseEvent) => {
    doRecord(e);
    onOpen(false);
  };

  const handleNewProj = (e: React.MouseEvent) => {
    doNewProj(e);
    onOpen(false);
  };

  const handleCancel = () => {
    onOpen(false);
  };

  const generalFactors = [t.generalFactor1, t.generalFactor2];
  const blankFactors = [t.blankFactor1, t.blankFactor2];

  return (
    <BigDialog
      title={t.newProject}
      isOpen={open}
      onOpen={handleCancel}
      description={
        <Typography sx={{ fontSize: 'small' }}>{t.likeTemplate}</Typography>
      }
    >
      <NewProjectRoot>
        <Grid container spacing={3}>
          <Grid item xs={6}>
            <StartCard
              id="config"
              title={t.blank}
              description={t.blankTip}
              factors={blankFactors}
              primary={t.configure}
              onPrimary={handleNewProj}
            />
          </Grid>
          <Grid item xs={6}>
            <StartCard
              id="quick"
              title={t.general}
              description={t.generalTip}
              factors={generalFactors}
              primary={t.uploadAudio}
              onPrimary={handleUpload}
              secondary={t.startRecording}
              onSecondary={handleRecord}
            />
          </Grid>
        </Grid>
      </NewProjectRoot>
    </BigDialog>
  );
}

export default NewProjectGrid;
