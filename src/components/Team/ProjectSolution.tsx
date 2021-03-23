import React from 'react';
import { makeStyles, createStyles, Theme, Tooltip } from '@material-ui/core';
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

  const typeOptions = [
    {
      name: t.general,
      tip: t.generalTip,
    },
    {
      name: t.obt,
      kind: integration.pt,
      tip:
        t.obtTip,
    },
    {
      name: t.storying,
      kind: integration.oneStory,
      tip:
        t.storyingTip,
    },
    {
      name: t.adaptation,
      kind: integration.pt,
      tip:
        t.adaptationTip,
    },
    {
      name: t.drafting,
      kind: integration.pt,
      tip:
        t.draftingTip,
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

  return (
    <BigDialog
      title={t.selectType}
      isOpen={open}
      onOpen={onOpen}
      bp={BigDialogBp.md}
    >
      <List>
        {typeOptions.map((to, i) => (
          <>
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
                      <Typography component="span">
                        {t.paratextIntegration}
                      </Typography>
                      {spacer}
                      <ParatextLogo />
                    </span>
                  ) : to.kind === integration.oneStory ? (
                    <span className={classes.secondary}>
                      <Typography component="span">
                        {t.oneStoryIntegration}
                      </Typography>
                      {spacer}
                      <OneStoryLogo />
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
          </>
        ))}
      </List>
    </BigDialog>
  );
};

export default ProjectSolution;
