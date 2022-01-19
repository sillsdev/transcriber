import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import { Grid, Paper, Typography, Button } from '@material-ui/core';
import PersonIcon from '@material-ui/icons/Person';
import { makeStyles, createStyles, Theme } from '@material-ui/core';
import { TeamContext } from '../../context/TeamContext';
import BigDialog from '../../hoc/BigDialog';
import { useRemoteSave } from '../../utils';
import { ProjectCard, AddCard } from '.';
import { StepEditor } from '../StepEditor';
import { useNewTeamId } from '../../crud';
import Auth from '../../auth/Auth';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
      backgroundColor: theme.palette.background.default,
      marginBottom: theme.spacing(2),
      '& .MuiPaper-rounded': {
        borderRadius: '8px',
      },
    },
    teamHead: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: theme.spacing(2),
    },
    name: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
    },
    icon: {
      paddingRight: theme.spacing(1),
    },
    cardFlow: {
      paddingLeft: theme.spacing(2),
      paddingRight: theme.spacing(2),
    },
  })
);

interface IProps {
  auth: Auth;
}

export const PersonalItem = (props: IProps) => {
  const classes = useStyles();
  const ctx = React.useContext(TeamContext);
  const { personalProjects, cardStrings, ts, resetOrbitError } = ctx.state;
  const t = cardStrings;
  const [isOffline] = useGlobal('offline');
  const [offlineOnly] = useGlobal('offlineOnly');
  const [changed] = useGlobal('changed');
  const [startSave, , waitForSave] = useRemoteSave();
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [org, setOrg] = useState('');
  const getTeamId = useNewTeamId({ ...props, ts, resetOrbitError });

  const handleWorkflow = (isOpen: boolean) => {
    if (changed) {
      startSave();
      waitForSave(() => setShowWorkflow(isOpen), 500);
    } else setShowWorkflow(isOpen);
  };

  const handleEditWorkflow = () => {
    setShowWorkflow(true);
  };
  const canModify = (offline: boolean, offlineOnly: boolean) =>
    !offline || offlineOnly;

  useEffect(() => {
    getTeamId(undefined).then((val: string) => {
      setOrg(val);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Paper id="PersonalItem" className={classes.root}>
      <div className={classes.teamHead}>
        <Typography variant="h5" className={classes.name}>
          <PersonIcon className={classes.icon} />
          {t.personalProjects}
        </Typography>
        {'\u00A0'}
        {canModify(isOffline, offlineOnly) && (
          <Button
            id="editWorkflow"
            onClick={handleEditWorkflow}
            variant="contained"
          >
            {t.editWorkflow}
          </Button>
        )}
      </div>
      <Grid container className={classes.cardFlow}>
        {personalProjects.map((i) => {
          return <ProjectCard key={i.id} project={i} />;
        })}
        {(!isOffline || offlineOnly) && <AddCard team={null} />}
      </Grid>
      <BigDialog
        title={t.editWorkflow}
        isOpen={showWorkflow}
        onOpen={handleWorkflow}
      >
        <StepEditor process={'OBT'} org={org} />
      </BigDialog>
    </Paper>
  );
};
