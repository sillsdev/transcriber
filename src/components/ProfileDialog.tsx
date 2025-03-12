/* eslint-disable no-template-curly-in-string */
import React, { useState, useContext, useRef, useEffect } from 'react';
import {
  IMainStrings,
  IProfileStrings,
  UserD,
  DigestPreference,
  OrganizationMembershipD,
  User,
  OrganizationMembership,
} from '../model';
import {
  Dialog,
  Button,
  DialogContent,
  FormControlLabel,
  Avatar,
  SxProps,
  Box,
  Grid,
  GridProps,
  FormControl,
  FormGroup,
  TextField,
  MenuItem,
  Checkbox,
  Switch,
  Stack,
} from '@mui/material';
import Confirm from '../components/AlertDialog';
import Typography, { TypographyProps } from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import { useSnackBar } from '../hoc/SnackBar';
import { langName } from '../utils/langName';
import { localeDefault } from '../utils/localeDefault';
import { LocalKey, localUserKey } from '../utils/localUserKey';
import { makeAbbr } from '../utils/makeAbbr';
import { uiLang, uiLangDev } from '../utils/uiLang';
import { useMyNavigate } from '../utils/useMyNavigate';
import { useWaitForRemoteQueue } from '../utils/useWaitForRemoteQueue';
import { waitForIt } from '../utils/waitForIt';
import { mainSelector } from '../selector';
import { shallowEqual, useSelector } from 'react-redux';
import ParatextLinkedButton from '../components/ParatextLinkedButton';
import { profileSelector } from '../selector';
import { UnsavedContext } from '../context/UnsavedContext';
import { useOrbitData } from '../hoc/useOrbitData';
import { RecordTransformResult, InitializedRecord } from '@orbit/records';
import { useDispatch } from 'react-redux';
import { useGlobal } from '../context/GlobalContext';
import { setLanguage as setLanguageAction } from '../store/localization/actions';
import { related } from '../crud/related';
import { RemoveUserFromOrg } from '../crud/user';
import { useAddToOrgAndGroup } from '../crud/useAddToOrgAndGroup';
import { useRole } from '../crud/useRole';
import { useTeamDelete } from '../crud/useTeamDelete';
import { useUser } from '../crud/useUser';
import moment from 'moment-timezone';
import {
  AddRecord,
  UpdateRecord,
  UpdateRelatedRecord,
} from '../model/baseModel';
import SelectRole from '../control/SelectRole';
import ExtendableDeleteExpansion from './ExtendableDeleteExpansion';
import { AltActionBar } from './AltActionBar';
import { StyledDialogTitle } from './StyledDialogTitle';

const Caption = styled(Typography)<TypographyProps>(() => ({
  width: 150,
  textAlign: 'left',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
}));

const textFieldProps = {
  mx: 1,
  width: '100%',
  '&:has([readOnly]) ': {
    height: '47px',
    marginBottom: '1px',
    '& .MuiInputLabel-root': {
      color: 'rgba(0, 0, 0, 0.6)',
    },
  },
} as SxProps;

const selectProps = {
  mx: 1,
  width: '100%',
  '&:has([readOnly]) ': {
    height: '47px',
    marginBottom: '1px',
    '& .MuiInputLabel-root': {
      color: 'rgba(0, 0, 0, 0.6)',
    },
  },
} as SxProps;

const menuProps = {
  width: '100px',
  '&:has([readOnly]) ': {
    '& .MuiSvgIcon-root-MuiSelect-icon': {
      display: 'none',
    },
    '& .MuiInputLabel-root': {
      color: 'rgba(0, 0, 0, 0.6)',
    },
  },
} as SxProps;

const bigAvatarProps = {
  width: '150px',
  height: '150px',
} as SxProps;

const profileContentProps = {
  display: 'flex',
  flexDirection: 'row',
  flexWrap: 'wrap',
  padding: '0px',
  margin: '0px',
} as SxProps;

const profilePanelProps = {
  display: 'flex',
  flex: '1 1 40%',
  flexDirection: 'column',
  justifyContent: 'center',
  maxWidth: '100%',
  backgroundColor: 'secondary.dark',
  textAlign: 'center',
  position: 'relative',
} as SxProps;

const profileMainProps = {
  display: 'flex',
  flex: '1 1 calc(60% - 40px)',
  flexDirection: 'column',
  maxWidth: '100%',
  justifyContent: 'center',
  mx: '10px',
  padding: '10px',
  paddingBottom: '0px',
} as SxProps;

const profileEmailProps = {
  width: '100%',
  overflow: 'visible',
  position: 'relative',
  textAlign: 'center',
  color: 'primary.contrastText',
  marginTop: '10px',
  marginBottom: '10px',
} as SxProps;

const editProfileProps = {
  color: 'secondary.dark',
  backgroundColor: 'primary.contrastText',
  opacity: '100%',
  width: '120px',
  '&.Mui-disabled': {
    color: 'secondary.dark',
    backgroundColor: 'primary.contrastText',
    opacity: '50%',
    padding: '6px',
  },
  '&:hover': {
    borderColor: 'primary.contrastText',
    backgroundColor: 'primary.contrastText',
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
    opacity: '90%',
  },
} as SxProps;

const deleteUserProps = {
  color: 'primary.dark',
  backgroundColor: 'primary.contrastText',
  opacity: '100%',
  '&.Mui-disabled': {
    color: 'primary.dark',
    backgroundColor: 'primary.contrastText',
    opacity: '50%',
  },
  '&:hover': {
    borderColor: 'primary.contrastText',
    backgroundColor: 'primary.contrastText',
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
    opacity: '90%',
  },
} as SxProps;

const frequencyProps = {
  marginLeft: '5px',
  padding: '0px',
  width: '100%',
  '& .MuiInputBase-root': {
    backgroundColor: 'primary.dark', // Background color of the input
  },
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      borderColor: 'primary.contrastText', // Border color of the input
    },
    '&:hover fieldset': {
      borderColor: 'primary.contrastText', // Border color on hover
    },
    '&.Mui-focused fieldset': {
      borderColor: 'secondary.dark', // Border color when focused
    },
    '&.Mui-disabled': {
      opacity: '75%', // Border opacity when disabled
    },
    '&.Mui-disabled:hover fieldset': {
      borderColor: 'rgba(0, 0, 0, .38)', // Border color remains unchanged on hover when disabled
    },
  },
  '& .MuiInputBase-input': {
    color: 'primary.contrastText', // Text color of the input
  },
  '& .MuiInputAdornment-root': {
    color: 'primary.contrastText',
  },
} as SxProps;

const toggleSwitchProps = {
  margin: '0px',
  '& .MuiSwitch-switchBase': {
    color: 'primary.contrastText', // Color of the thumb when the switch is unchecked
    '&.Mui-checked': {
      color: 'primary.contrastText', // Color of the thumb when the switch is checked
      '& + .MuiSwitch-track': {
        backgroundColor: 'primary.contrastText', // Color of the track when the switch is checked
        opacity: '20%',
      },
    },
  },
  '& .MuiSwitch-track': {
    backgroundColor: 'secondary.contrastText', // Color of the track when the switch is unchecked
    opacity: '20%',
  },
} as SxProps;

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

const StyledGrid = styled(Grid)<GridProps>(() => ({
  padding: '0 30px',
}));

export interface ProfileDialogProps {
  mode: 'create' | 'editMember' | 'viewMyAccount';
  open: boolean;
  editId?: string;
  onClose?: () => void;
  onSave?: () => void;
  onSaveCompleted?: () => void;
  onCancel?: () => void;
  finishAdd?: () => void;
}
export function ProfileDialog(props: ProfileDialogProps) {
  const {
    mode,
    open,
    editId,
    onClose,
    onSave,
    onSaveCompleted,
    onCancel,
    finishAdd,
  } = props;
  const users = useOrbitData<UserD[]>('user');
  const t: IMainStrings = useSelector(mainSelector, shallowEqual);
  const tp: IProfileStrings = useSelector(profileSelector, shallowEqual);
  const dispatch = useDispatch();
  const setLanguage = (lang: string) => dispatch(setLanguageAction(lang));
  const [isOffline] = useGlobal('offline'); //verified this is not used in a function 2/18/25
  const [memory] = useGlobal('memory');
  const [organization] = useGlobal('organization');
  const [user, setUser] = useGlobal('user');
  const [, setLang] = useGlobal('lang');
  const [offlineOnly] = useGlobal('offlineOnly'); //will be constant here
  const [isDeveloper] = useGlobal('developer');
  const navigate = useMyNavigate();
  const { getUserRec } = useUser();
  const { getMbrRoleRec, userIsAdmin, userIsSharedContentAdmin } = useRole();
  const [uiLanguages] = useState(isDeveloper ? uiLangDev : uiLang);
  const [currentUser, setCurrentUser] = useState<UserD | undefined>();
  const [name, setName] = useState('');
  const [given, setGiven] = useState<string | null>(null);
  const [family, setFamily] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [timezone, setTimezone] = useState<string>(moment.tz.guess() || '');
  const [sync, setSync] = useState(true);
  const [syncFreq, setSyncFreq] = useState(2);
  const [role, setRole] = useState('');
  const [locale, setLocale] = useState<string>(
    localeDefault(isDeveloper === 'true')
  );
  const [news, setNews] = useState<boolean | null>(null);
  const [sharedContent, setSharedContent] = useState(false);
  const [digest, setDigest] = useState<DigestPreference | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [bcp47, setBcp47] = useState<string | null>(null);
  const [timerDir, setTimerDir] = useState<string | null>(null);
  const [speed, setSpeed] = useState<string | null>(null);
  const [progBar, setProgBar] = useState<string | null>(null);
  const [hotKeys, setHotKeys] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [locked, setLocked] = useState(false);
  const [deleteItem, setDeleteItem] = useState('');
  const [dupName, setDupName] = useState(false);
  const [view, setView] = useState('');
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
  const [myChanged, setMyChanged] = useState(false);
  const [readOnly, setReadOnly] = useState(true);
  const { showMessage } = useSnackBar();
  const addToOrgAndGroup = useAddToOrgAndGroup();
  const teamDelete = useTeamDelete();
  const toolId = 'profile';
  const saving = useRef(false);
  const [confirmCancel, setConfirmCancel] = useState<string>();
  const [confirmClose, setConfirmClose] = useState<string>();
  const waitForRemoteQueue = useWaitForRemoteQueue();

  const doClose = () => {
    const view = localStorage.getItem(localUserKey(LocalKey.url));
    if (view) {
      setView(view);
    }
    if (onClose) {
      onClose();
    }
  };

  const handleNameClick = (event: React.MouseEvent<HTMLElement>) => {
    if (event.shiftKey) setShowDetail(!showDetail);
  };

  const handleNameChange = (e: any) => {
    if (e.target.value === email) {
      showMessage(tp.nameNotEmail);
      return;
    }
    toolChanged(toolId, true);
    setName(e.target.value);
    if (!currentUser || (currentUser.attributes?.givenName || '') === '') {
      const parts = e.target.value.split(' ');
      setGiven(parts[0]);
      if (parts.length > 1) {
        setFamily(parts[parts.length - 1]);
      }
    }
    if (editId) {
      const userRecs = users.filter(
        (u) => u.attributes?.name === e.target.value
      );
      const newDupName = userRecs.length > 0;
      if (newDupName !== dupName) setDupName(newDupName);
    }
  };

  const handleGivenChange = (e: any) => {
    toolChanged(toolId, true);
    setGiven(e.target.value);
  };

  const handleFamilyChange = (e: any) => {
    toolChanged(toolId, true);
    setFamily(e.target.value);
  };
  const handleSyncFreqSwitch = (e: React.ChangeEvent<HTMLInputElement>) => {
    toolChanged(toolId, true);
    setSync(e.target.checked);
    const newFreq = e.target.checked ? 2 : 0;
    setSyncFreq(newFreq);
    var hk = JSON.parse(hotKeys ?? '{}');
    setHotKeys(JSON.stringify({ ...hk, syncFreq: newFreq }));
  };
  const handleSyncFreqChange = (e: any) => {
    if (e.target.value < 1) e.target.value = 1;
    if (e.target.value > 720) e.target.value = 720;
    toolChanged(toolId, true);
    setSyncFreq(e.target.value);
    var hk = JSON.parse(hotKeys ?? '{}');
    setHotKeys(JSON.stringify({ ...hk, syncFreq: e.target.value }));
  };
  const handlePhoneChange = (e: any) => {
    toolChanged(toolId, true);
    setPhone(e.target.value);
  };

  const handleTimezoneChange = (e: any) => {
    toolChanged(toolId, true);
    setTimezone(e.target.value);
  };

  const handleRoleChange = (e: string) => {
    toolChanged(toolId, true);
    setRole(e);
  };

  const handleLocaleChange = (e: any) => {
    toolChanged(toolId, true);
    setLocale(e.target.value);
  };

  const handleLockedChange = () => {
    toolChanged(toolId, true);
    setLocked(!locked);
  };

  const handleSharedContentChange = () => {
    toolChanged(toolId, true);
    setSharedContent(!Boolean(sharedContent));
  };

  const handleDigestChange = () => {
    toolChanged(toolId, true);
    setDigest(
      digest ? DigestPreference.noDigest : DigestPreference.dailyDigest
    );
  };
  useEffect(() => {
    if (saveRequested(toolId)) {
      handleSave();
    } else if (clearRequested(toolId)) {
      clearCompleted(toolId);
    }
    var changed = isChanged(toolId);
    if (changed !== myChanged) setMyChanged(changed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolsChanged]);

  const handleSave = () => {
    if (!saving.current && isChanged(toolId)) {
      startSave(toolId);
      saving.current = true;
      const currentUserId = currentUser === undefined ? user : currentUser.id; //currentuser will not be undefined here
      memory
        .update(
          (t) =>
            UpdateRecord(
              t,
              {
                type: 'user',
                id: currentUserId,
                attributes: {
                  name,
                  givenName: given,
                  familyName: family,
                  email,
                  phone,
                  timezone,
                  locale,
                  isLocked: locked,
                  uilanguagebcp47: bcp47,
                  timercountUp: timerDir,
                  playbackSpeed: speed,
                  progressbarTypeid: progBar,
                  hotKeys: hotKeys,
                  digestPreference: digest,
                  newsPreference: news,
                  sharedContentCreator: sharedContent,
                  avatarUrl,
                },
              } as UserD,
              currentUser !== undefined ? currentUser.id : ''
            )
          // we aren't allowing them to change owner organization currently
        )
        .then((r) => {
          if (r) {
            // set the currentUser to the saved user data
            let res = r as RecordTransformResult<InitializedRecord>[];
            const user = res.at(0) as UserD;
            setCurrentUser(user);
            setUser(user.id);
            if (onSaveCompleted) {
              onSaveCompleted();
            }
          }
        });
      setLang(locale);
      const mbrRec = getMbrRoleRec(
        'organization',
        organization,
        currentUserId
      ) as OrganizationMembershipD;
      if (mbrRec) {
        const curRoleId = related(mbrRec, 'role');
        if (curRoleId !== role) {
          memory.update((t) =>
            UpdateRelatedRecord(t, mbrRec, 'role', 'role', role, user)
          );
        }
      }
      if (!editId) setLanguage(locale);
    }
    saveCompleted(toolId);
    saving.current = false;
    if (onSave) {
      onSave();
    }
    setReadOnly(mode === 'viewMyAccount');
  };

  const handleAdd = async () => {
    if (isChanged(toolId)) {
      let userRec = {
        type: 'user',
        attributes: {
          name,
          givenName: given,
          familyName: family,
          email,
          phone,
          timezone,
          locale,
          isLocked: locked,
          uilanguagebcp47: bcp47,
          timercountUp: timerDir,
          playbackSpeed: speed,
          progressbarTypeid: progBar,
          digestPreference: digest,
          newsPreference: news,
          sharedContentCreator: sharedContent,
          hotKeys,
          avatarUrl,
        },
      } as User;
      if (!editId || !organization) {
        await memory.update((t) => AddRecord(t, userRec, user, memory));
        if (offlineOnly) setUser(userRec.id as string);
      } else {
        addToOrgAndGroup(userRec, true);
      }
      if (offlineOnly) {
        await waitForIt(
          'record added',
          () => Boolean(userRec.id),
          () => false,
          100
        );
        if (offlineOnly)
          localStorage.setItem(LocalKey.userId, userRec.id as string);
      }
      saveCompleted(toolId);
    }
    if (finishAdd) {
      finishAdd();
    }
  };

  const resetUserData = () => {
    let attr = currentUser?.attributes;
    if (!attr) return;
    setName(attr.name !== attr.email ? attr.name : '');
    setGiven(attr.givenName ? attr.givenName : '');
    setFamily(attr.familyName ? attr.familyName : '');
    setEmail(attr.email.toLowerCase());
    setPhone(attr.phone);
    setTimezone(attr.timezone || '');
    setLocale(
      attr.locale ? attr.locale : localeDefault(isDeveloper === 'true')
    );
    setNews(attr.newsPreference);
    setSharedContent(attr.sharedContentCreator ?? false);
    setDigest(attr.digestPreference);
    setLocked(true);
    setBcp47(attr.uilanguagebcp47);
    setTimerDir(attr.timercountUp);
    setSpeed(attr.playbackSpeed);
    setProgBar(attr.progressbarTypeid);
    setHotKeys(attr.hotKeys);
    setAvatarUrl(attr.avatarUrl);
    const syncFreq = getSyncFreq(attr.hotKeys);
    setSyncFreq(syncFreq);
    setSync(syncFreq > 0);
  };

  const handleCancel = () => {
    if (myChanged) {
      const defLocale =
        currentUser?.attributes?.locale === '' ? tp.defaultLocale : '';
      const defTimezone =
        currentUser?.attributes?.timezone === '' ? tp.defaultTimezone : '';
      let message = tp.discardChanges;
      let message2 = tp.discardChangesExplained;
      if (defLocale && defTimezone) {
        message = message2.replace('{0}', `${defLocale} ${defTimezone}`);
      } else if (defLocale) {
        message = message2.replace('{0}', defLocale);
      } else if (defTimezone) {
        message = message2.replace('{0}', defTimezone);
      }
      setConfirmCancel(message);
    } else handleCancelConfirmed();
  };

  const handleCancelConfirmed = () => {
    setConfirmCancel(undefined);
    toolChanged(toolId, false);
    if (editId) {
      const userId = localStorage.getItem(LocalKey.userId);
      if (!userId && offlineOnly) {
        setView('Logout');
        return;
      }
    }
    resetUserData();
    if (onCancel) {
      onCancel();
    }
    setReadOnly(mode === 'viewMyAccount');
  };

  const handleCancelAborted = () => {
    setConfirmCancel(undefined);
  };

  const handleCloseConfirmed = () => {
    setConfirmClose(undefined);
    toolChanged(toolId, false);
    if (editId) {
      const userId = localStorage.getItem(LocalKey.userId);
      if (!userId && offlineOnly) {
        setView('Logout');
        return;
      }
    }
    resetUserData();
    doClose();
    setReadOnly(mode === 'viewMyAccount');
  };

  const handleCloseAborted = () => {
    setConfirmClose(undefined);
  };

  const handleDelete = () => {
    if (currentUser) setDeleteItem(currentUser.id);
  };
  const handleDeleteConfirmed = async () => {
    const deleteRec = getUserRec(deleteItem);
    await waitForRemoteQueue('wait for any changes to finish');
    await RemoveUserFromOrg(memory, deleteRec, undefined, user, teamDelete);
    await memory.update((tb) =>
      tb.removeRecord({ type: 'user', id: deleteItem })
    );
    //wait to be sure orbit remote is done also
    try {
      await waitForRemoteQueue('logout after user delete');
    } catch {
      //well we tried...
    }
    localStorage.removeItem(LocalKey.userId);
    setView('Logout');
  };

  const handleDeleteRefused = () => {
    setDeleteItem('');
  };

  useEffect(() => {
    let userRec = {
      type: 'user',
      id: '',
      attributes: {
        name,
        givenName: given,
        familyName: family,
        email,
        phone,
        timezone,
        locale,
        isLocked: true,
        auth0Id: '',
        silUserid: 0,
        identityToken: '',
        uilanguagebcp47: bcp47,
        timercountUp: timerDir,
        playbackSpeed: speed,
        progressbarTypeid: progBar,
        digestPreference: DigestPreference.dailyDigest,
        newsPreference: false,
        sharedContentCreator: false,
        hotKeys,
        avatarUrl,
      },
    } as User;
    if (!editId || !/Add/i.test(editId)) {
      const current = users.filter((u) => u.id === (editId ? editId : user));
      if (current.length === 1) {
        userRec = current[0];
        setCurrentUser(userRec as UserD);
        const orgMbrRecs = memory?.cache.query((q) =>
          q.findRecords('organizationmembership')
        ) as OrganizationMembership[];
        const mbrRec = orgMbrRecs.filter(
          (r) =>
            related(r, 'user') === userRec.id &&
            related(r, 'organization') === organization
        );
        if (mbrRec.length > 0) {
          setRole(related(mbrRec[0], 'role'));
        }
      }
    }
    const attr = userRec.attributes;
    if (!attr) return;
    setName(attr.name !== attr.email ? attr.name : '');
    setGiven(attr.givenName ? attr.givenName : '');
    setFamily(attr.familyName ? attr.familyName : '');
    setEmail(attr.email.toLowerCase());
    setPhone(attr.phone);
    setTimezone(attr.timezone || '');
    setLocale(
      attr.locale ? attr.locale : localeDefault(isDeveloper === 'true')
    );
    setNews(attr.newsPreference);
    setSharedContent(attr.sharedContentCreator ?? false);
    setDigest(attr.digestPreference);
    setLocked(true);
    setBcp47(attr.uilanguagebcp47);
    setTimerDir(attr.timercountUp);
    setSpeed(attr.playbackSpeed);
    setProgBar(attr.progressbarTypeid);
    setHotKeys(attr.hotKeys);
    setAvatarUrl(attr.avatarUrl);
    const syncFreq = getSyncFreq(attr.hotKeys);
    setSyncFreq(syncFreq);
    setSync(syncFreq > 0);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [user, editId]);

  const getSyncFreq = (hotKeys: string | null) => {
    const hk = JSON.parse(hotKeys ?? '{}');
    return hk.syncFreq ?? 2;
  };

  useEffect(() => {
    if (timezone === '') {
      const myZone = moment.tz.guess();
      setTimezone(myZone || '');
      toolChanged(toolId, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timezone]);

  const userNotComplete = () =>
    currentUser === undefined ||
    currentUser.attributes?.name.toLowerCase() ===
      currentUser.attributes?.email.toLowerCase();

  const requiredComplete = () =>
    (name || '') !== '' &&
    (family || '') !== '' &&
    (given || '') !== '' &&
    (timezone || '') !== '' &&
    (locale || '') !== '';

  if (/Logout/i.test(view)) navigate('/logout');
  else if (/access/i.test(view)) navigate('/');
  const handleClose = () => {
    if (onClose) {
      if (myChanged) {
        setConfirmClose(tp.discardChanges);
      } else handleCloseConfirmed();
    }
  };

  useEffect(() => setReadOnly(mode === 'viewMyAccount'), [mode]);

  const onEditClicked = () => {
    setReadOnly(false);
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
      fullWidth
    >
      <StyledDialogTitle
        id="profileDlg"
        onClose={
          mode === 'viewMyAccount'
            ? () => {
                if (myChanged) {
                  setConfirmClose(tp.discardChanges);
                } else handleCloseConfirmed();
              }
            : undefined
        }
      >
        {editId && /Add/i.test(editId) ? (
          <Typography variant="h6">{tp.addMember}</Typography>
        ) : userNotComplete() ? (
          <Typography variant="h6">{tp.completeProfile}</Typography>
        ) : editId ? (
          <Typography variant="h6">{tp.editMember}</Typography>
        ) : (
          <Typography variant="h6">{t.myAccount}</Typography>
        )}
      </StyledDialogTitle>
      <DialogContent id="profileContent" sx={profileContentProps}>
        <Box id="profilePanel" sx={profilePanelProps}>
          <StyledGrid item xs={12} height="100%" margin={'30px 0px 70px 0px'}>
            <Box
              sx={{
                width: '150px',
                height: '150px',
                borderRadius: '50%',
                border: '0.5px solid rgb(255, 255, 255, 0.5)',
                padding: '17px',
                margin: '1% auto 1% auto',
              }}
            >
              <BigAvatar avatarUrl={avatarUrl} name={name || ''} />
            </Box>
            <Caption sx={profileEmailProps}>{email || ''}</Caption>
            {((editId && /Add/i.test(editId)) || !userNotComplete()) && (
              <Button
                disabled={!readOnly}
                variant="contained"
                onClick={onEditClicked}
                sx={editProfileProps}
              >
                {tp.edit}
              </Button>
            )}
            <ParatextLinkedButton setView={setView} />
          </StyledGrid>
          {!readOnly &&
            (!isOffline || offlineOnly) &&
            !editId &&
            currentUser &&
            currentUser.attributes?.name !== currentUser.attributes?.email && (
              <ExtendableDeleteExpansion
                AllProps={{
                  position: 'absolute',
                  bottom: '0px',
                  borderRadius: '5px',
                }}
                extendsDown={true}
                SummaryProps={{
                  backgroundColor: 'primary.dark',
                  color: 'primary.contrastText',
                  position: 'absolute',
                  bottom: '0px',
                }}
                IconProps={{
                  color: 'primary.contrastText',
                }}
                DetailsProps={{
                  backgroundColor: 'primary.dark',
                  color: 'primary.contrastText',
                  padding: '8px 16px 64px',
                  borderRadius: '5px',
                }}
                DangerHeaderProps={{
                  borderColor: 'primary.contrastText',
                  color: 'primary.contrastText',
                }}
                DangerProps={{
                  color: 'primary.contrastText',
                }}
                warning={tp.deleteWarning}
                ButtonProps={deleteUserProps}
                handleDelete={handleDelete}
                inProgress={deleteItem !== ''}
                buttonLabel={tp.deleteUser}
              >
                <Typography
                  variant="h6"
                  sx={{
                    borderBottom: '1px solid',
                    borderColor: 'primary.contrastText',
                    textAlign: 'left',
                  }}
                >
                  {tp.additionalSettings}
                </Typography>
                <FormGroup
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                  }}
                >
                  <FormControlLabel
                    control={
                      <Switch
                        checked={syncFreq > 0}
                        onChange={handleSyncFreqSwitch}
                      />
                    }
                    labelPlacement="start"
                    label={tp.syncFrequencyEnable}
                    sx={toggleSwitchProps}
                  />
                  <FormControlLabel
                    control={
                      <TextField
                        title={tp.syncFrequency}
                        value={syncFreq}
                        onChange={handleSyncFreqChange}
                        type="number"
                        inputProps={{
                          min: 1,
                          max: 720,
                        }}
                        InputProps={{
                          endAdornment: 'min',
                          sx: {
                            color: 'primary.contrastText',
                          },
                        }}
                        size="small"
                        sx={frequencyProps}
                      />
                    }
                    labelPlacement="start"
                    label={tp.syncFrequencyLabel}
                    sx={{ marginLeft: '2em' }}
                    disabled={!sync}
                  />
                </FormGroup>
              </ExtendableDeleteExpansion>
            )}
        </Box>
        <Box id="profileMain" sx={profileMainProps}>
          {readOnly ? (
            <Stack sx={{ height: '468px' }}>
              <TextField
                id="profileName"
                label={tp.name}
                value={name}
                onClick={handleNameClick}
                sx={{ ...textFieldProps, marginTop: '11px' }}
                margin="normal"
                variant="standard"
                size="small"
                InputProps={{
                  readOnly: true,
                  disableUnderline: true,
                }}
              />
              <TextField
                id="given"
                label={tp.given}
                value={given || ''}
                sx={textFieldProps}
                margin="normal"
                variant="standard"
                size="small"
                InputProps={{
                  readOnly: true,
                  disableUnderline: true,
                }}
              />
              <TextField
                id="family"
                label={tp.family}
                value={family || ''}
                sx={textFieldProps}
                margin="normal"
                variant="standard"
                size="small"
                InputProps={{
                  readOnly: true,
                  disableUnderline: true,
                }}
              />
              <TextField
                id="select-locale"
                label={tp.locale}
                sx={selectProps}
                value={langName(locale, locale)}
                margin="normal"
                variant="standard"
                size="small"
                InputProps={{
                  readOnly: true,
                  disableUnderline: true,
                }}
              />
              <TextField
                id="select-timezone"
                label={tp.timezone}
                sx={selectProps}
                value={timezone}
                margin="normal"
                variant="standard"
                size="small"
                InputProps={{
                  readOnly: true,
                  disableUnderline: true,
                }}
              />
              {showDetail && (
                <TextField
                  id="phone"
                  label={tp.phone}
                  value={phone || 'none'}
                  sx={textFieldProps}
                  margin="normal"
                  variant="standard"
                  size="small"
                  InputProps={{
                    readOnly: true,
                    disableUnderline: true,
                  }}
                />
              )}
            </Stack>
          ) : (
            <Stack>
              <FormControl sx={{ width: '100%' }}>
                <FormGroup
                  sx={{
                    padding: '3px',
                    pb: 2,
                    marginBottom: '30px',
                    width: '100%',
                  }}
                >
                  <FormControlLabel
                    control={
                      <TextField
                        id="profileName"
                        label={tp.name}
                        value={name}
                        sx={textFieldProps}
                        margin="normal"
                        variant="outlined"
                        size="small"
                        fullWidth
                        onChange={handleNameChange}
                        onClick={handleNameClick}
                        helperText={
                          dupName && (
                            <Typography color="secondary" variant="caption">
                              {tp.userExists}
                            </Typography>
                          )
                        }
                        required
                        autoFocus
                      />
                    }
                    label=""
                  />
                  <FormControlLabel
                    control={
                      <TextField
                        id="given"
                        label={tp.given}
                        value={given || ''}
                        sx={textFieldProps}
                        margin="normal"
                        variant="outlined"
                        size="small"
                        fullWidth
                        onChange={handleGivenChange}
                        required
                      />
                    }
                    label=""
                  />
                  <FormControlLabel
                    control={
                      <TextField
                        id="family"
                        label={tp.family}
                        value={family || ''}
                        sx={textFieldProps}
                        margin="normal"
                        variant="outlined"
                        size="small"
                        fullWidth
                        onChange={handleFamilyChange}
                        required
                      />
                    }
                    label=""
                  />
                  {userIsAdmin && editId && email !== '' && (
                    <FormControlLabel
                      control={
                        <SelectRole
                          initRole={role}
                          onChange={handleRoleChange}
                          required
                          margin="normal"
                          variant="outlined"
                          size="small"
                        />
                      }
                      label=""
                    />
                  )}
                  <FormControlLabel
                    control={
                      <TextField
                        id="select-locale"
                        select
                        label={tp.locale}
                        sx={selectProps}
                        value={locale}
                        margin="normal"
                        variant="outlined"
                        size="small"
                        fullWidth
                        onChange={handleLocaleChange}
                        SelectProps={{
                          MenuProps: {
                            sx: menuProps,
                          },
                        }}
                        required
                      >
                        {uiLanguages.map((option: string, idx: number) => (
                          <MenuItem key={'loc' + idx} value={option}>
                            {langName(locale, option)}
                          </MenuItem>
                        ))}
                      </TextField>
                    }
                    label=""
                  />
                  <FormControlLabel
                    control={
                      <TextField
                        id="select-timezone"
                        select
                        label={tp.timezone}
                        sx={selectProps}
                        value={timezone}
                        margin="normal"
                        variant="outlined"
                        size="small"
                        fullWidth
                        onChange={handleTimezoneChange}
                        SelectProps={{
                          MenuProps: {
                            sx: menuProps,
                          },
                        }}
                        required={true}
                      >
                        {moment.tz
                          .names()
                          .map((option: string, idx: number) => (
                            <MenuItem key={'tz' + idx} value={option}>
                              {option}
                            </MenuItem>
                          ))}
                      </TextField>
                    }
                    label=""
                  />
                  {email !== '' && (
                    <FormControlLabel
                      sx={{
                        ...textFieldProps,
                        marginLeft: '-14px',
                        paddingLeft: '0px',
                      }}
                      control={
                        <Checkbox
                          id="digest"
                          checked={digest === 1}
                          onChange={handleDigestChange}
                          sx={{ margin: '0px' }}
                        />
                      }
                      label={tp.sendDigest}
                    />
                  )}
                  {userIsSharedContentAdmin && (
                    <FormControlLabel
                      sx={textFieldProps}
                      control={
                        <Checkbox
                          id="sharedcontent"
                          checked={sharedContent}
                          onChange={handleSharedContentChange}
                        />
                      }
                      label={tp.sharedContentCreator}
                    />
                  )}
                  {showDetail && (
                    <>
                      <FormControlLabel
                        control={
                          <TextField
                            id="phone"
                            label={tp.phone}
                            value={phone}
                            sx={textFieldProps}
                            margin="normal"
                            variant="outlined"
                            size="small"
                            fullWidth
                            onChange={handlePhoneChange}
                          />
                        }
                        label=""
                      />
                      {userIsAdmin && (
                        <FormControlLabel
                          sx={textFieldProps}
                          control={
                            <Checkbox
                              id="checkbox-locked"
                              checked={locked}
                              onChange={handleLockedChange}
                            />
                          }
                          label={tp.locked}
                        />
                      )}
                    </>
                  )}
                </FormGroup>
              </FormControl>
            </Stack>
          )}
          {!readOnly && (
            <Box
              sx={{
                position: 'sticky',
                bottom: '0px',
                padding: '10px 0px',
                paddingLeft: '10px',
                pointerEvents: 'auto',
                zIndex: '10',
                borderTop: '1px solid lightGray',
                backgroundColor: 'primary.contrastText',
              }}
            >
              <AltActionBar
                primaryLabel={
                  editId && /Add/i.test(editId)
                    ? tp.add
                    : userNotComplete()
                    ? tp.next
                    : tp.save
                }
                primaryOnClick={
                  currentUser === undefined ? handleAdd : handleSave
                }
                primaryDisabled={
                  !requiredComplete() ||
                  !myChanged ||
                  saveRequested(toolId) ||
                  dupName
                }
                primaryKey={'add'}
                primaryAria={tp.add}
                altShown={
                  mode === 'create' ||
                  (editId && /Add/i.test(editId)) ||
                  (currentUser &&
                    currentUser.attributes?.name !==
                      currentUser.attributes?.email)
                }
                altLabel={mode === 'create' ? tp.logout : tp.cancel}
                altOnClick={handleCancel}
                altKey={'cancel'}
                altAria={tp.cancel}
                sx={{ width: '100%' }}
              />
            </Box>
          )}
        </Box>
        {!readOnly && deleteItem !== '' && (
          <Confirm
            text={tp.deleteExplained}
            yesResponse={handleDeleteConfirmed}
            noResponse={handleDeleteRefused}
          />
        )}
        {!readOnly && confirmCancel && (
          <Confirm
            text="Discard unsaved data?"
            yesResponse={handleCancelConfirmed}
            noResponse={handleCancelAborted}
          />
        )}
        {!readOnly && confirmClose && (
          <Confirm
            text="Discard unsaved data?"
            yesResponse={handleCloseConfirmed}
            noResponse={handleCloseAborted}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
export default ProfileDialog;
