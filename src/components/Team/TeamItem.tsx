import React from 'react';
import { useGlobal } from 'reactn';
import { Grid, Paper, Typography, Button } from '@material-ui/core';
import { makeStyles, createStyles, Theme } from '@material-ui/core';
import GroupIcon from '@material-ui/icons/Group';
import { Organization, DialogMode } from '../../model';
import { TeamContext } from '../../context/TeamContext';
import BigDialog, { BigDialogBp } from '../../hoc/BigDialog';
import GroupTabs from '../GroupTabs';
import { ProjectCard, AddCard } from '.';
import TeamDialog from './TeamDialog';
import { useRole, useAllUserGroup } from '../../crud';
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
  const [offline] = useGlobal('offline');
  const [offlineOnly] = useGlobal('offlineOnly');
  const [, setOrganization] = useGlobal('organization');
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteItem, setDeleteItem] = React.useState<Organization>();
  const ctx = React.useContext(TeamContext);
  const {
    teamProjects,
    teamMembers,
    teamUpdate,
    teamDelete,
    isAdmin,
  } = ctx.state;
  const t = ctx.state.cardStrings;
  const [openMember, setOpenMember] = React.useState(false);
  const { setMyOrgRole } = useRole();
  const [, setGroup] = useGlobal('group');
  const allUserGroup = useAllUserGroup();

  const handleMembers = (team: Organization) => () => {
    setOrganization(team.id);
    setMyOrgRole(team.id);
    setGroup(allUserGroup(team.id)?.id);
    setOpenMember(true);
  };

  const handleSettings = (team: Organization) => () => {
    setEditOpen(true);
  };

  const handleCommitSettings = (team: Organization) => {
    teamUpdate(team);
  };

  const handleDeleteTeam = (team: Organization) => {
    setDeleteItem(team);
  };

  const handleDeleteConfirmed = async () => {
    setEditOpen(false);
    deleteItem && (await teamDelete(deleteItem));
  };

  const handleDeleteRefused = () => setDeleteItem(undefined);

  const canModify = (
    offline: boolean,
    team: Organization,
    offlineOnly: boolean
  ) => (!offline && isAdmin(team)) || offlineOnly;

  return (
    <Paper id="TeamItem" className={classes.root}>
      <div className={classes.teamHead}>
        <Typography variant="h5" className={classes.name}>
          <GroupIcon className={classes.icon} />
          {team?.attributes?.name}
        </Typography>
        <div>
          {canModify(offline, team, offlineOnly) && (
            <Button
              id="teamMembers"
              variant="contained"
              onClick={handleMembers(team)}
            >
              {t.members.replace('{0}', teamMembers(team.id).toString())}
            </Button>
          )}
          {' \u00A0'}
          {canModify(offline, team, offlineOnly) && (
            <Button
              id="teamSettings"
              variant="contained"
              onClick={handleSettings(team)}
            >
              {t.settings}
            </Button>
          )}
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
      <BigDialog
        title={t.members.replace('{0}', team?.attributes?.name || '')}
        isOpen={openMember}
        onOpen={setOpenMember}
        bp={BigDialogBp.md}
      >
        <GroupTabs {...props} />
      </BigDialog>
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
        {canModify(offline, team, offlineOnly) && <AddCard team={team} />}
      </Grid>
    </Paper>
  );
};
