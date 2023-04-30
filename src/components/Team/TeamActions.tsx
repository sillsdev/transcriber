import { useContext, useState } from 'react';
import Axios from 'axios';
import { useGlobal } from 'reactn';
import {
  Box,
  BoxProps,
  FormControlLabel,
  TextField,
  styled,
} from '@mui/material';
import { DialogMode, Organization } from '../../model';
import TeamDialog from './TeamDialog';
import { TeamContext } from '../../context/TeamContext';
import { API_CONFIG, isElectron } from '../../api-variable';
import ImportTab from '../ImportTab';
import { AltButton } from '../../control';
import { useMyNavigate } from '../../utils';
import { useRole } from '../../crud';
import { TokenContext } from '../../context/TokenProvider';
import { errStatus } from '../../store/AxiosStatus';
import { useSnackBar } from '../../hoc/SnackBar';

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
  const [, setBusy] = useGlobal('remoteBusy');
  const [openAdd, setOpenAdd] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const ctx = useContext(TeamContext);
  const navigate = useMyNavigate();
  const { teamCreate, cardStrings, isDeleting } = ctx.state;
  const [email, setEmail] = useState('');
  const [validEmail, setValidEmail] = useState(false);
  const { userIsSharedContentAdmin } = useRole();
  const t = cardStrings;
  const tokenctx = useContext(TokenContext).state;
  const { showMessage } = useSnackBar();
  const [, setBigBusy] = useGlobal('importexportBusy');

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
    setBusy(true); //this will be reset by datachanges
    teamCreate(team, async (id: string) => {
      cb && (await cb(id));
      setOpenAdd(false);
    });
  };

  const handleAdded = () => {
    setOpenAdd(false);
  };
  const handleSharedContentClick = () => {
    setBigBusy(true);
    Axios.post(
      `${API_CONFIG.host}/api/users/sharedcreator/${encodeURIComponent(
        email
      )}/true`,
      null,
      {
        headers: {
          'Content-Type': 'application/vnd.api+json',
          Authorization: 'Bearer ' + tokenctx.accessToken,
        },
      }
    )
      .then((response) => {
        setBigBusy(false);
        showMessage(t.creatorOK);
        setValidEmail(false);
      })
      .catch((err) => {
        setBigBusy(false);
        showMessage(errStatus(err).errMsg);
      });
  };
  const handleEmailChange = (e: any) => {
    setEmail(e.target.value);
    setValidEmail(ValidateEmail(e.target.value));
  };
  const ValidateEmail = (email: string) => {
    return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email);
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
      {!offline && userIsSharedContentAdmin && (
        <Box sx={{ p: 1, border: '1px solid grey' }}>
          <FormControlLabel
            control={
              <TextField
                id="email"
                label={t.creatorEmail}
                value={email}
                onChange={handleEmailChange}
                margin="normal"
                required
                variant="filled"
                fullWidth={true}
              />
            }
            label=""
            labelPlacement="top"
          />
          <AltButton
            id="sharedcontent"
            onClick={handleSharedContentClick}
            disabled={!validEmail}
          >
            {t.creatorAdd}
          </AltButton>
        </Box>
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
