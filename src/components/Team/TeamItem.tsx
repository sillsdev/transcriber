import React from 'react';
import { Grid, Paper, Typography, Button } from '@material-ui/core';
import { makeStyles, createStyles, Theme } from '@material-ui/core';
import GroupIcon from '@material-ui/icons/Group';
import { Organization, DialogMode } from '../../model';
import { TeamContext } from '../../context/TeamContext';
import { ProjectCard, AddCard, TeamDialog } from '.';
import Confirm from '../AlertDialog';

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
  team: Organization;
}

export const TeamItem = (props: IProps) => {
  const { team } = props;
  const classes = useStyles();
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteItem, setDeleteItem] = React.useState<Organization>();
  const ctx = React.useContext(TeamContext);
  const { teamProjects, teamMembers, teamUpdate, teamDelete } = ctx.state;
  const t = ctx.state.cardStrings;

  const handleMembers = (team: Organization) => () => {
    console.log(`clicked ${t.members} of ${team?.attributes?.name}`);
  };

  const handleSettings = (team: Organization) => () => {
    console.log(`clicked ${t.settings} for ${team?.attributes?.name}`);
    setEditOpen(true);
  };

  const handleCommitSettings = (team: Organization) => {
    teamUpdate(team);
  };

  const handleDeleteTeam = (team: Organization) => {
    setDeleteItem(team);
  };

  const handleDeleteConfirmed = () => {
    deleteItem && teamDelete(deleteItem);
  };

  const handleDeleteRefused = () => setDeleteItem(undefined);

  return (
    <Paper id="TeamItem" className={classes.root}>
      <div className={classes.teamHead}>
        <Typography variant="h5" className={classes.name}>
          <GroupIcon className={classes.icon} />
          {team?.attributes?.name}
        </Typography>
        <div>
          <Button variant="contained" onClick={handleMembers(team)}>
            {t.members.replace('{0}', teamMembers(team.id).toString())}
          </Button>
          {' \u00A0'}
          <Button variant="contained" onClick={handleSettings(team)}>
            {t.settings}
          </Button>
        </div>
      </div>
      <TeamDialog
        mode={DialogMode.edit}
        values={team}
        isOpen={editOpen}
        onOpen={setEditOpen}
        onCommit={handleCommitSettings}
        onDelete={handleDeleteTeam}
      />
      {deleteItem && (
        <Confirm
          yesResponse={handleDeleteConfirmed}
          noResponse={handleDeleteRefused}
        />
      )}
      <Grid container className={classes.cardFlow}>
        {teamProjects(team.id).map((i) => {
          return <ProjectCard key={i.id} project={i} />;
        })}
        <AddCard team={team} />
      </Grid>
    </Paper>
  );
};
