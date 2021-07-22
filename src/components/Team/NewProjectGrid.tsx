import React from 'react';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import { Grid, Button, Typography, Tooltip } from '@material-ui/core';
import { List, ListItem, ListSubheader, ListItemIcon } from '@material-ui/core';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import BigDialog from '../../hoc/BigDialog';
import { TeamContext } from '../../context/TeamContext';
import { ParatextLogo } from '../../control';
import { ReactElement } from 'react-transition-group/node_modules/@types/react';

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

  const Prose = ({ text }: { text: string }) => (
    <Typography className={classes.notes}>{text}</Typography>
  );

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

  const KindHead = (props: { text: string; decorate?: ReactElement }) => (
    <Typography variant="h6">
      {props.text}
      {props.decorate}
    </Typography>
  );

  const ActionButtons = ({ kind }: { kind: Integration }) => (
    <>
      <Button onClick={handleUpload(kind)} variant="outlined">
        {t.uploadAudio}
      </Button>
      <Button
        onClick={handleRecord(kind)}
        variant="outlined"
        className={classes.button}
      >
        {t.startRecording}
      </Button>
    </>
  );

  const ConfigureAction = () => (
    <Button onClick={handleNewProj} variant="outlined">
      {t.configure}
    </Button>
  );

  const KeyFactorsHead = () => <ListSubheader>Key Factors</ListSubheader>;

  const Bullet = () => (
    <ListItemIcon>
      <ChevronRightIcon />
    </ListItemIcon>
  );

  const KeyFactorsList = ({ factors }: { factors: string[] }) => (
    <List dense subheader={<KeyFactorsHead />}>
      {factors.map((f, i) => (
        <ListItem key={i}>
          <Bullet />
          {f}
        </ListItem>
      ))}
    </List>
  );

  const scriptureFactors = [
    'Uses Scripture Referencing: book, chapter, and verse',
    'Workflow syncs with Paratext for checking',
  ];

  const generalFactors = [
    'Freeform references',
    'No Paratext sync expected or allowed',
  ];

  return (
    <BigDialog title={t.newProject} isOpen={open} onOpen={handleCancel}>
      <div className={classes.root}>
        <Grid container spacing={3}>
          <Grid item xs={8}>
            <KindHead text={t.scripture} decorate={<ParatextDecoration />} />
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Prose text={t.scriptureTip} />
              </Grid>
              <Grid item xs={6}>
                <KeyFactorsList factors={scriptureFactors} />
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={4} className={classes.action}>
            <ActionButtons kind={Integration.pt} />
          </Grid>
          <Grid item xs={8}>
            <KindHead text={t.general} />
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Prose text={t.generalTip} />
              </Grid>
              <Grid item xs={6}>
                <KeyFactorsList factors={generalFactors} />
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={4} className={classes.action}>
            <ActionButtons kind={Integration.none} />
          </Grid>
          <Grid item xs={8}>
            <KindHead text={t.blank} />
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
