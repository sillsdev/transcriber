import React, { useState } from 'react';
import { useGlobal } from 'reactn';
import { Box, BoxProps, styled } from '@mui/material';
import { DialogMode, Organization } from '../../model';
import TeamDialog from './TeamDialog';
import { TeamContext } from '../../context/TeamContext';
import { isElectron } from '../../api-variable';
import ImportTab from '../ImportTab';
import { AltButton } from '../../control';
import { useNavigate } from 'react-router-dom';

const RootBox = styled(Box)<BoxProps>(({ theme }) => ({
  padding: theme.spacing(2),
  minWidth: theme.spacing(20),
  display: 'flex',
  flexDirection: 'column',
  alignContent: 'center',
}));

const TeamActions = () => {
  const [offline] = useGlobal('offline');
  const [isDeveloper] = useGlobal('developer');
  const [openAdd, setOpenAdd] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const ctx = React.useContext(TeamContext);
  const navigate = useNavigate();
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
    <RootBox>
      {(!offline || isDeveloper) && (
        <AltButton id="TeamActAdd" sx={{ mb: 2 }} onClick={handleClickOpen}>
          {t.addTeam}
        </AltButton>
      )}
      {offline && (
        <AltButton
          id="teamActImport"
          sx={{ mb: 2 }}
          onClick={handleClickImport}
        >
          {t.import}
        </AltButton>
      )}
      {isDeveloper && (
        <AltButton id="Error" sx={{ mt: 2 }} onClick={() => navigate('/error')}>
          Error
        </AltButton>
      )}
      <TeamDialog
        mode={DialogMode.add}
        isOpen={openAdd}
        onOpen={handleAdded}
        onCommit={handleAdd}
        disabled={isDeleting}
      />
      {isElectron && importOpen && (
        <ImportTab isOpen={importOpen} onOpen={setImportOpen} />
      )}
    </RootBox>
  );
};

export default TeamActions;
