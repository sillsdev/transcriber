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
import AddIcon from '@mui/icons-material/Add';
import { useRole } from '../../crud';
import { TokenContext } from '../../context/TokenProvider';
import { errStatus } from '../../store/AxiosStatus';
import { useSnackBar } from '../../hoc/SnackBar';
import BigDialog, { BigDialogBp } from '../../hoc/BigDialog';

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
  const [openContent, setOpenContent] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const ctx = useContext(TeamContext);
  const navigate = useMyNavigate();
  const { teamCreate, cardStrings, isDeleting, sharedStrings } = ctx.state;
  const [email, setEmail] = useState('');
  const [validEmail, setValidEmail] = useState(false);
  const [contentStatus, setContentStatus] = useState('');
  const { userIsSharedContentAdmin } = useRole();
  const t = cardStrings;
  const ts = sharedStrings;
  const tokenctx = useContext(TokenContext).state;
  const { showMessage } = useSnackBar();

  const handleClickOpen = () => {
    setOpenAdd(true);
  };
  const handleClickImport = () => {
    setImportOpen(true);
  };
  const handleClickContent = () => {
    setOpenContent(true);
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
  const handleContentDone = () => {
    setContentStatus('');
    setEmail('');
    setOpenContent(false);
  };
  const handleAdded = () => {
    setOpenAdd(false);
  };
  const handleSharedContentClick = () => {
    if (!validEmail) return;
    setValidEmail(false); //turn off the save button
    setContentStatus(ts.saving);
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
        showMessage(t.creatorOK);
        handleContentDone();
      })
      .catch((err) => {
        setContentStatus(errStatus(err).errMsg);
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
        <AltButton
          id="contentCreator"
          sx={{ mb: 2 }}
          onClick={handleClickContent}
        >
          <AddIcon fontSize="small" />
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
      <BigDialog
        isOpen={openContent}
        onOpen={handleContentDone}
        onSave={validEmail ? handleSharedContentClick : undefined}
        onCancel={handleContentDone}
        title={t.creatorAdd}
        bp={BigDialogBp.sm}
      >
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
              sx={{ width: '600px' }}
              fullWidth={true}
            />
          }
          label={contentStatus}
          labelPlacement="bottom"
        />
      </BigDialog>
      {isElectron && importOpen && (
        <ImportTab isOpen={importOpen} onOpen={setImportOpen} />
      )}
    </RootBox>
  );
};

export default TeamActions;
