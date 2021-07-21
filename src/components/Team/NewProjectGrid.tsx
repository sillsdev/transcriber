import React from 'react';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import { Grid, Button, Typography, Tooltip } from '@material-ui/core';
import BigDialog from '../../hoc/BigDialog';
import { TeamContext } from '../../context/TeamContext';
import { ParatextLogo } from '../../control';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      flexGrow: 1,
    },
    action: {
      padding: theme.spacing(2),
      textAlign: 'center',
    },
    button: {
      margin: theme.spacing(1),
    },
    notes: {
      fontSize: 'small',
    },
  })
);

interface IProps {
  open: boolean;
  onOpen: (open: boolean) => void;
  doUpload: (e: React.MouseEvent) => void;
  doRecord: (e: React.MouseEvent) => void;
  doNewProj: (e: React.MouseEvent) => void;
  setType: (type: string) => void;
}

export function NewProjectGrid(props: IProps) {
  const { open, onOpen } = props;
  const { doUpload, doRecord, doNewProj, setType } = props;
  const classes = useStyles();
  const ctx = React.useContext(TeamContext);
  const { newProjectStrings } = ctx.state;
  const t = newProjectStrings;

  enum integration {
    none,
    pt,
  }

  const doSetType = (kind: integration) => {
    setType(kind === integration.pt ? 'scripture' : 'other');
  };

  const handleUpload = (kind: integration) => (e: React.MouseEvent) => {
    doSetType(kind);
    doUpload(e);
    onOpen(false);
  };

  const handleRecord = (kind: integration) => (e: React.MouseEvent) => {
    doSetType(kind);
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

  const spacer = '\u00A0';

  return (
    <BigDialog
      title={t.newProject}
      isOpen={open}
      onOpen={handleCancel}
      onCancel={handleCancel}
    >
      <div className={classes.root}>
        <Grid container spacing={3}>
          <Grid item xs={8}>
            <Typography variant="h6">
              {t.scripture}
              {spacer}
              <Tooltip title={t.paratextIntegration}>
                <span>
                  <ParatextLogo />
                </span>
              </Tooltip>
            </Typography>
            <Typography className={classes.notes}>{t.scriptureTip}</Typography>
          </Grid>
          <Grid item xs={4} className={classes.action}>
            <Button onClick={handleUpload(integration.pt)} variant="outlined">
              {t.uploadAudio}
            </Button>
            <Button
              onClick={handleRecord(integration.pt)}
              variant="outlined"
              className={classes.button}
            >
              {t.startRecording}
            </Button>
          </Grid>
          <Grid item xs={8}>
            <Typography variant="h6">{t.general}</Typography>
            <Typography className={classes.notes}>{t.generalTip}</Typography>
          </Grid>
          <Grid item xs={4} className={classes.action}>
            <Button onClick={handleUpload(integration.none)} variant="outlined">
              {t.uploadAudio}
            </Button>
            <Button
              onClick={handleRecord(integration.none)}
              variant="outlined"
              className={classes.button}
            >
              {t.startRecording}
            </Button>
          </Grid>
          <Grid item xs={8}>
            <Typography variant="h6">{t.blank}</Typography>
          </Grid>
          <Grid item xs={4} className={classes.action}>
            <Button onClick={handleNewProj} variant="outlined">
              {t.configure}
            </Button>
          </Grid>
        </Grid>
      </div>
    </BigDialog>
  );
}

export default NewProjectGrid;
