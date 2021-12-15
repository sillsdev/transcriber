import React, { useState } from 'react';
import { useGlobal } from 'reactn';
import { makeStyles, createStyles, Theme } from '@material-ui/core';
import { Button } from '@material-ui/core';
import { DialogMode, Organization } from '../../model';
import TeamDialog from './TeamDialog';
import { TeamContext } from '../../context/TeamContext';
import { isElectron } from '../../api-variable';
import Auth from '../../auth/Auth';
import ImportTab from '../ImportTab';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      padding: theme.spacing(2),
      minWidth: theme.spacing(20),
      display: 'flex',
      flexDirection: 'column',
      alignContent: 'center',
    },
    button: {
      marginBottom: theme.spacing(2),
    },
  })
);

interface IProps {
  auth: Auth;
}

const TeamActions = (props: IProps) => {
  const { auth } = props;
  const classes = useStyles();
  const [offline] = useGlobal('offline');
  const [isDeveloper] = useGlobal('developer');
  const [openAdd, setOpenAdd] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const ctx = React.useContext(TeamContext);
  const { teamCreate, cardStrings, isDeleting } = ctx.state;
  const t = cardStrings;

  const handleClickOpen = () => {
    setOpenAdd(true);
  };
  const handleClickImport = () => {
    setImportOpen(true);
  };

  const handleAdd = (
    team: Organization,
    cb?: (id: string) => Promise<void>
  ) => {
    teamCreate(team, async () => {
      cb && (await cb(team.id));
      setOpenAdd(false);
    });
  };

  const handleAdded = () => {
    setOpenAdd(false);
  };

  return (
    <div className={classes.root}>
      {(!offline || isDeveloper) && (
        <Button
          id="TeamActAdd"
          variant="contained"
          color="default"
          className={classes.button}
          onClick={handleClickOpen}
        >
          {t.addTeam}
        </Button>
      )}
      {offline && (
        <Button
          id="teamActImport"
          variant="contained"
          color="default"
          className={classes.button}
          onClick={handleClickImport}
        >
          {t.import}
        </Button>
      )}
      <TeamDialog
        mode={DialogMode.add}
        isOpen={openAdd}
        onOpen={handleAdded}
        onCommit={handleAdd}
        disabled={isDeleting}
      />
      {isElectron && importOpen && (
        <ImportTab auth={auth} isOpen={importOpen} onOpen={setImportOpen} />
      )}
    </div>
  );
};

export default TeamActions;
