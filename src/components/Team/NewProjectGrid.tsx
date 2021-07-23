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

  const KeyFactorsHead = () => <ListSubheader>{t.keyFactors}</ListSubheader>;

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

  const scriptureFactors = [t.scriptureFactor1, t.scriptureFactor2];

  const generalFactors = [t.generalFactor1, t.generalFactor2];

  const blankFactors = [t.blankFactor1, t.blankFactor2];

  interface Explain {
    tip: string;
    factors: string[];
  }

  const KindExplain = ({ tip, factors }: Explain) => (
    <Grid container spacing={1}>
      <Grid item md={6} xs={12}>
        <Prose text={tip} />
      </Grid>
      <Grid item md={6} xs={12}>
        <KeyFactorsList factors={factors} />
      </Grid>
    </Grid>
  );

  return (
    <BigDialog title={t.newProject} isOpen={open} onOpen={handleCancel}>
      <div className={classes.root}>
        <Typography align="center" className={classes.notes}>
          {t.likeTemplate}
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={8}>
            <KindHead text={t.scripture} decorate={<ParatextDecoration />} />
            <KindExplain tip={t.scriptureTip} factors={scriptureFactors} />
          </Grid>
          <Grid item xs={4} className={classes.action}>
            <ActionButtons kind={Integration.pt} />
          </Grid>
          <Grid item xs={8}>
            <KindHead text={t.general} />
            <KindExplain tip={t.generalTip} factors={generalFactors} />
          </Grid>
          <Grid item xs={4} className={classes.action}>
            <ActionButtons kind={Integration.none} />
          </Grid>
          <Grid item xs={8}>
            <KindHead text={t.blank} />
            <KindExplain tip={t.blankTip} factors={blankFactors} />
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
