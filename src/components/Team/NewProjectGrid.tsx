import React from 'react';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import { Grid, Button, Typography, Tooltip } from '@material-ui/core';
import BigDialog from '../../hoc/BigDialog';
import { TeamContext } from '../../context/TeamContext';
import { ParatextLogo } from '../../control';
import { ChoiceHead } from '../../control/ChoiceHead';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      flexGrow: 1,
      '& .MuiListSubheader-root': {
        lineHeight: 'unset',
      },
      '& .MuiListItemIcon-root': {
        minWidth: '30px',
      },
    },
    action: {
      padding: theme.spacing(2),
      textAlign: 'center',
      alignSelf: 'center',
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

  enum Integration {
    none,
    pt,
  }

  const doSetType = (kind: Integration) => {
    setType(kind === Integration.pt ? 'scripture' : 'other');
  };

  const handleUpload = (kind: Integration) => (e: React.MouseEvent) => {
    doSetType(kind);
    doUpload(e);
    onOpen(false);
  };

  const handleRecord = (kind: Integration) => (e: React.MouseEvent) => {
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

  const ParatextDecoration = () => (
    <>
      {spacer}
      <Tooltip title={t.paratextIntegration}>
        <span>
          <ParatextLogo />
        </span>
      </Tooltip>
    </>
  );

  const actId = (kind: Integration, act: string) =>
    `addProj${act}-${kind === Integration.pt ? 'aud' : 'oth'}-0`;

  const ActionButtons = ({ kind }: { kind: Integration }) => (
    <>
      <Button
        id={actId(kind, 'Up')}
        onClick={handleUpload(kind)}
        variant="outlined"
        color="primary"
      >
        {t.uploadAudio}
      </Button>
      <Button
        id={actId(kind, 'Rec')}
        onClick={handleRecord(kind)}
        variant="outlined"
        className={classes.button}
        color="primary"
      >
        {t.startRecording}
      </Button>
    </>
  );

  const ConfigureAction = () => (
    <Button
      id="config"
      onClick={handleNewProj}
      variant="outlined"
      color="primary"
    >
      {t.configure}
    </Button>
  );

  const scriptureFactors = [t.scriptureFactor1, t.scriptureFactor2];
  const generalFactors = [t.generalFactor1, t.generalFactor2];
  const blankFactors = [t.blankFactor1, t.blankFactor2];

  return (
    <BigDialog
      title={t.newProject}
      isOpen={open}
      onOpen={handleCancel}
      description={
        <Typography className={classes.notes}>{t.likeTemplate}</Typography>
      }
    >
      <div className={classes.root}>
        <Grid container spacing={3}>
          <Grid item xs={8}>
            <ChoiceHead
              title={t.scripture}
              decorate={<ParatextDecoration />}
              keyFactorTitle={t.keyFactors}
              prose={t.scriptureTip}
              factors={scriptureFactors}
            />
          </Grid>
          <Grid item xs={4} className={classes.action}>
            <ActionButtons kind={Integration.pt} />
          </Grid>
          <Grid item xs={8}>
            <ChoiceHead
              title={t.general}
              keyFactorTitle={t.keyFactors}
              prose={t.generalTip}
              factors={generalFactors}
            />
          </Grid>
          <Grid item xs={4} className={classes.action}>
            <ActionButtons kind={Integration.none} />
          </Grid>
          <Grid item xs={8}>
            <ChoiceHead
              title={t.blank}
              keyFactorTitle={t.keyFactors}
              prose={t.blankTip}
              factors={blankFactors}
            />
          </Grid>
          <Grid item xs={4} className={classes.action}>
            <ConfigureAction />
          </Grid>
        </Grid>
      </div>
    </BigDialog>
  );
}

export default NewProjectGrid;
