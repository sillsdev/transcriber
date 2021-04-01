import React from 'react';
import {
  makeStyles,
  createStyles,
  Theme,
  Tooltip,
  ListSubheader,
} from '@material-ui/core';
import {
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  Typography,
  Button,
  Divider,
} from '@material-ui/core';
import InfoIcon from '@material-ui/icons/Info';
import BigDialog, { BigDialogBp } from '../../hoc/BigDialog';
import { ParatextLogo, OneStoryLogo } from '../../control';
import { TeamContext } from '../../context/TeamContext';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    listItem: {
      display: 'flex',
      alignItems: 'center',
    },
    actionButtons: {
      display: 'flex',
      '& .MuiButton-root': {
        marginLeft: theme.spacing(1),
      },
    },
    primary: {
      display: 'flex',
      alignItems: 'center',
      fontWeight: 500,
    },
    secondary: {
      display: 'flex',
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

export const ProjectSolution = (props: IProps) => {
  const { open, onOpen, doUpload, doRecord, doNewProj, setType } = props;
  const classes = useStyles();
  const ctx = React.useContext(TeamContext);
  const { projSolutionStrings } = ctx.state;
  const t = projSolutionStrings;

  enum integration {
    none,
    pt,
    oneStory,
  }

  interface Solution {
    name: string;
    kind?: integration;
    tip?: string;
    buttons?: number;
  }

  const audioProduct: Solution[] = [
    {
      name: t.obt,
      kind: integration.pt,
      tip: t.obtTip,
    },
    {
      name: t.storying,
      // kind: integration.oneStory,
      // tip: t.storyingTip,
    },
    {
      name: t.adaptation,
      kind: integration.pt,
      tip: t.adaptationTip,
    },
  ];

  const textProduct: Solution[] = [
    {
      name: t.drafting,
      kind: integration.pt,
      tip: t.draftingTip,
    },
  ];

  const otherProduct: Solution[] = [
    {
      name: t.general,
      tip: t.generalTip,
    },
    {
      name: t.blank,
      buttons: 1,
    },
  ];

  const spacer = '\u00A0';

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

  const listFormatter = (to: Solution, i: number) => (
    <div key={i}>
      <ListItem key={i} component="div" className={classes.listItem}>
        <ListItemText
          primary={
            <Typography component="div" className={classes.primary}>
              {to.name}
              {spacer}
              {to.tip && (
                <Tooltip title={to.tip}>
                  <span style={{ fontSize: 'small' }}>
                    <InfoIcon color="primary" fontSize="inherit" />
                  </span>
                </Tooltip>
              )}
            </Typography>
          }
          secondary={
            to.kind === integration.pt ? (
              <span className={classes.secondary}>
                <ParatextLogo />
                {spacer}
                <Typography component="span">
                  {t.paratextIntegration}
                </Typography>
              </span>
            ) : to.kind === integration.oneStory ? (
              <span className={classes.secondary}>
                <OneStoryLogo />
                {spacer}
                <Typography component="span">
                  {t.oneStoryIntegration}
                </Typography>
              </span>
            ) : (
              <span />
            )
          }
        />
        <ListItemSecondaryAction className={classes.actionButtons}>
          {to.buttons ? (
            <Button variant="contained" onClick={handleNewProj}>
              {t.newProject}
            </Button>
          ) : (
            <>
              <Button
                variant="contained"
                onClick={handleUpload(to.kind || integration.none)}
              >
                {t.uploadAudio}
              </Button>
              <Button
                variant="contained"
                onClick={handleRecord(to.kind || integration.none)}
              >
                {t.startRecording}
              </Button>
            </>
          )}
        </ListItemSecondaryAction>
      </ListItem>
      <Divider component="li" />
    </div>
  );

  return (
    <BigDialog
      title={t.selectType}
      isOpen={open}
      onOpen={handleCancel}
      onCancel={handleCancel}
      bp={BigDialogBp.md}
    >
      <>
        <List dense subheader={<ListSubheader>{t.audioProduct}</ListSubheader>}>
          {audioProduct.map(listFormatter)}
          <Divider component="li" />
        </List>
        <List dense subheader={<ListSubheader>{t.textProduct}</ListSubheader>}>
          {textProduct.map(listFormatter)}
          <Divider component="li" />
        </List>
        <List dense subheader={<ListSubheader>{t.other}</ListSubheader>}>
          {otherProduct.map(listFormatter)}
        </List>
      </>
    </BigDialog>
  );
};

export default ProjectSolution;
