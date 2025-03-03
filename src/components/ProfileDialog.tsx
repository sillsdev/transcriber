/* eslint-disable no-template-curly-in-string */
import React, { useState, useContext} from 'react';
import { 
  IMainStrings, 
  ISharedStrings, 
  IProfileStrings, 
  UserD, 
} from '../model';
import {
  Dialog,
  DialogTitle,
  Button,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar,
  List,
  ListItem,
  ListItemText,
  Link,
  SxProps,
  Tooltip,
  Box,
  BoxProps,
} from '@mui/material';
import Typography, { TypographyProps } from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { API_CONFIG } from '../api-variable';
import about from '../assets/about.json';
import stringReplace from 'react-string-replace';
import { useSnackBar } from '../hoc/SnackBar';
import { ApmLogo } from '../control/ApmLogo';
import { StyledHeading } from '../control';
import { makeAbbr } from '../utils';
import { mainSelector, sharedSelector } from '../selector';
import { shallowEqual, useSelector } from 'react-redux';
import { profileSelector } from '../selector';
import { UnsavedContext } from '../context/UnsavedContext';
import DeleteExpansion from '../components/DeleteExpansion';

// img stuff below
const bigAvatarProps = { width: '150px', height: '150px' } as SxProps;

interface IBigAvatarProps {
  avatarUrl: string | null;
  name: string;
}
const BigAvatar = (props: IBigAvatarProps) => {
  const { avatarUrl, name } = props;

  if (!avatarUrl || avatarUrl === '') {
    return <Avatar sx={bigAvatarProps}>{makeAbbr(name)}</Avatar>;
  }
  return <Avatar sx={bigAvatarProps} src={avatarUrl} />;
};
// img stuff above


const CopyrightText = styled(Typography)<TypographyProps>(() => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
}));

const ProductIdentBox = styled(Box)<BoxProps>(() => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
}));

const Paragraphs = styled(Box)<BoxProps>(() => ({
  display: 'flex',
  flexDirection: 'column',
}));

const VersionDiv = styled('div')(({ theme }) => ({
  paddingTop: theme.spacing(2),
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
}));

interface ItemsProps {
  items: string[];
  kid: string;
}


//export function ProfileDialog(props: IProps) {

const ListItems = ({ items, kid }: ItemsProps) => {
  const part = (s: string, i: number) => s.split('|')[i];

  return (
    <List dense>
      {items.map((i, n) => (
        <ListItem key={`${kid}-${n}`}>
          <ListItemText>
            {stringReplace(part(i, 0), part(i, 1), (m: string) => (
              <Link
                key={`${kid}-${n}-link`}
                href={part(i, 2)}
                target="_blank"
                rel="noopener noreferrer"
              >
                {m}
              </Link>
            ))}
          </ListItemText>
        </ListItem>
      ))}
    </List>
  );
};
const ParaItems = ({ items, kid }: ItemsProps) => {
  return (
    <Paragraphs>
      {items.map((i, n) => (
        <Typography key={`${kid}-${n}`} sx={{ p: 1 }}>
          {i}
        </Typography>
      ))}
    </Paragraphs>
  );
};
interface LicenseProps {
  title: string;
  url: string;
  text: string[];
  product: string[];
  kid: string;
}
const LicenseAccordion = ({ title, url, text, product, kid }: LicenseProps) => {
  return (
    <>
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1-content"
          id="panel1-header"
        >
          <StyledHeading>
            {
              <Link href={url} target="_blank" rel="noopener noreferrer">
                {title}
              </Link>
            }
          </StyledHeading>
        </AccordionSummary>
        <AccordionDetails>
          <ParaItems items={text} kid={`${kid}-pa`} />
        </AccordionDetails>
      </Accordion>
      <ListItems items={product} kid={`${kid}-po`} />
    </>
  );
};
interface ProfileDialogProps {
  open: boolean;
  onClose: () => void;
}
export function ProfileDialog(props: ProfileDialogProps) {
  const { onClose, open } = props;
  const t: IMainStrings = useSelector(mainSelector, shallowEqual);
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);
  const tp: IProfileStrings = useSelector(profileSelector, shallowEqual);
  const { showMessage } = useSnackBar();
  const handleClose = () => onClose();
  const handleExit = () => onClose();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [name, setName] = useState('');

  const [currentUser, setCurrentUser] = useState<UserD | undefined>();
  const [syncFreq, setSyncFreq] = useState(2);
  const [deleteItem, setDeleteItem] = useState('');
  const [hotKeys, setHotKeys] = useState<string | null>(null);
  const toolId = 'profile';
  const {
    startSave,
    saveCompleted,
    toolChanged,
    toolsChanged,
    saveRequested,
    clearRequested,
    clearCompleted,
    isChanged,
  } = useContext(UnsavedContext).state;

  const handleDelete = () => {
    if (currentUser) setDeleteItem(currentUser.id);
  };
  const handleSyncFreqChange = (e: any) => {
    if (e.target.value < 0) e.target.value = 0;
    if (e.target.value > 720) e.target.value = 720;
    toolChanged(toolId, true);
    setSyncFreq(e.target.value);
    var hk = JSON.parse(hotKeys ?? '{}');
    setHotKeys(JSON.stringify({ ...hk, syncFreq: e.target.value }));
  };

  return (
    <Dialog
      id="profile"
      onClose={handleClose}
      aria-labelledby="profileDlg"
      open={open}
      scroll={'paper'}
      disableEnforceFocus
      maxWidth="md"
    >
      <DialogTitle id="profileDlg">{t.myAccount}</DialogTitle>
      <DialogContent id="profileContent" 
        sx={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap'
        }}
      >
        <Box 
          id="profilePanel"
          sx={{
            display: 'flex',
            flex: '1 1 40%',
            flexDirection: 'column',
            justifyContent: 'center',
            maxWidth: '100%',
            backgroundColor: 'secondary.main'
          }}
        >
          <BigAvatar avatarUrl={avatarUrl} name={name || ''} />
          <DeleteExpansion
          title={tp.deleteUser}
          explain={tp.deleteExplained}
          handleDelete={() => handleDelete()}
          inProgress={deleteItem !== ''}
        >
          <FormControlLabel
            control={
              <input
                title={tp.syncFrequency}
                value={syncFreq}
                onChange={handleSyncFreqChange}
                type="number"
                min={0}
                max={720}
                style={{ width: '3em', margin: '8px' }}
              />
            }
            label={tp.syncFrequency}
          />
          <br></br>
      </DeleteExpansion>
        </Box>
        <Box id="profileMain" 
          sx={{
            display: 'flex',
            flex: '1 1 57%', //figure out why its 57% and not 60%
            flexDirection: 'column',
            maxWidth: '100%',
            justifyContent: 'center'
          }}
        >
          <Typography variant="h6">{t.team}</Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button id="profileClose" variant="outlined" onClick={handleClose}>
          {t.exit}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
export default ProfileDialog;
