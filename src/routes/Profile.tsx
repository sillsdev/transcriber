import React, { useState, useEffect, useRef, useContext } from 'react';
import { useGlobal } from 'reactn';
import { TokenContext } from '../context/TokenProvider';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import {
  IState,
  User,
  IProfileStrings,
  DigestPreference,
  OrganizationMembership,
} from '../model';
import { IAxiosStatus } from '../store/AxiosStatus';
import * as action from '../store';
import localStrings from '../selector/localize';
import { withData } from 'react-orbitjs';
import { QueryBuilder, TransformBuilder } from '@orbit/data';
import {
  Paper,
  Grid,
  TextField,
  FormControl,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Typography,
  Avatar,
  MenuItem,
  Box,
  styled,
  PaperProps,
  SxProps,
  TypographyProps,
  GridProps,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import Confirm from '../components/AlertDialog';
import ParatextLinked from '../components/ParatextLinked';
import DeleteExpansion from '../components/DeleteExpansion';
import {
  related,
  useRole,
  useAddToOrgAndGroup,
  RemoveUserFromOrg,
  useTeamDelete,
  useUser,
} from '../crud';
import {
  makeAbbr,
  uiLang,
  uiLangDev,
  langName,
  localeDefault,
  getParatextDataPath,
  waitForIt,
  useMyNavigate,
} from '../utils';
import moment from 'moment-timezone';
import {
  AddRecord,
  UpdateRecord,
  UpdateRelatedRecord,
} from '../model/baseModel';
import AppHead from '../components/App/AppHead';
import StickyRedirect from '../components/StickyRedirect';
import { useSnackBar } from '../hoc/SnackBar';
import SelectRole from '../control/SelectRole';
import { UnsavedContext } from '../context/UnsavedContext';
import { ActionRow, AltButton, PriButton } from '../control';

// see: https://mui.com/material-ui/customization/how-to-customize/
interface ContainerProps extends PaperProps {
  noMargin?: boolean;
}
const PaperContainer = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'noMargin',
})<ContainerProps>(({ noMargin, theme }) => ({
  display: 'flex',
  flexGrow: 1,
  marginTop: '80px',
  padding: '40px',
  justifyContent: 'center',
  ...(noMargin
    ? {
        margin: 0,
      }
    : {
        margin: theme.spacing(4),
      }),
}));

const Caption = styled(Typography)<TypographyProps>(() => ({
  width: 150,
  textAlign: 'left',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
}));

const textFieldProps = { mx: 1 } as SxProps;
const selectProps = { mx: 1, width: '206px' } as SxProps;
const menuProps = { width: '200px' } as SxProps;
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

const StyledGrid = styled(Grid)<GridProps>(() => ({
  padding: '0 30px',
}));

interface IStateProps {
  t: IProfileStrings;
  paratext_username: string; // state.paratext.username
  paratext_usernameStatus?: IAxiosStatus;
}

interface IDispatchProps {
  setLanguage: typeof action.setLanguage;
  getUserName: typeof action.getUserName;
}

interface IRecordProps {
  users: Array<User>;
}

interface IProps extends IStateProps, IDispatchProps, IRecordProps {
  noMargin?: boolean;
  finishAdd?: () => void;
}

export function Profile(props: IProps) {
  const { users, t, noMargin, finishAdd, setLanguage } = props;
  const { paratext_username, paratext_usernameStatus, getUserName } = props;
  const [isOffline] = useGlobal('offline');
  const [memory] = useGlobal('memory');
  const [coordinator] = useGlobal('coordinator');
  const [connected] = useGlobal('connected');
  const [editId, setEditId] = useGlobal('editUserId');
  const [organization] = useGlobal('organization');
  const [user, setUser] = useGlobal('user');
  const [, setLang] = useGlobal('lang');
  const [offlineOnly] = useGlobal('offlineOnly');
  const [errorReporter] = useGlobal('errorReporter');
  const [isDeveloper] = useGlobal('developer');
  const navigate = useMyNavigate();
  const { accessToken } = useContext(TokenContext).state;
  const { getUserRec } = useUser();
  const { getMbrRoleRec, userIsAdmin, userIsSharedContentAdmin } = useRole();
  const [uiLanguages] = useState(isDeveloper ? uiLangDev : uiLang);
  const [currentUser, setCurrentUser] = useState<User | undefined>();
  const [name, setName] = useState('');
  const [given, setGiven] = useState<string | null>(null);
  const [family, setFamily] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [timezone, setTimezone] = useState<string>(moment.tz.guess() || '');
  const [role, setRole] = useState('');
  const [locale, setLocale] = useState<string>(localeDefault(isDeveloper));
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
  const [hasParatext, setHasParatext] = useState(false);
  const [view, setView] = useState('');
  const {
    startSave,
    saveCompleted,
    toolChanged,
    toolsChanged,
    saveRequested,
    isChanged,
  } = useContext(UnsavedContext).state;
  const [myChanged, setMyChanged] = useState(false);
  const [ptPath, setPtPath] = React.useState('');
  const { showMessage } = useSnackBar();
  const addToOrgAndGroup = useAddToOrgAndGroup();
  const teamDelete = useTeamDelete();
  const toolId = 'profile';
  const saving = useRef(false);
  const [confirmCancel, setConfirmCancel] = useState<string>();
  const handleNameClick = (event: React.MouseEvent<HTMLElement>) => {
    if (event.shiftKey) setShowDetail(!showDetail);
  };

  const handleNameChange = (e: any) => {
    if (e.target.value === email) {
      showMessage(t.nameNotEmail);
      return;
    }
    toolChanged(toolId, true);
    setName(e.target.value);
    if (
      !currentUser ||
      !currentUser.attributes.givenName ||
      currentUser.attributes.givenName === ''
    ) {
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
      memory.update(
        (t: TransformBuilder) =>
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
                digestPreference: digest,
                newsPreference: news,
                sharedContentCreator: sharedContent,
                avatarUrl,
              },
            } as User,
            currentUser !== undefined ? currentUser.id : ''
          )
        // we aren't allowing them to change owner oraganization currently
      );
      setLang(locale);
      const mbrRec = getMbrRoleRec(
        'organization',
        organization,
        currentUserId
      ) as OrganizationMembership[];
      if (mbrRec.length > 0) {
        const curRoleId = related(mbrRec[0], 'role');
        if (curRoleId !== role) {
          memory.update((t: TransformBuilder) =>
            UpdateRelatedRecord(t, mbrRec[0], 'role', 'role', role, user)
          );
        }
      }
      if (!editId) setLanguage(locale);
    }
    saveCompleted(toolId);
    if (editId) {
      setEditId(null);
    }
    saving.current = false;
    setView('Team');
  };

  const handleAdd = async () => {
    if (isChanged(toolId)) {
      let userRec: User = {
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
      } as any;
      if (!editId || !organization) {
        await memory.update((t: TransformBuilder) =>
          AddRecord(t, userRec, user, memory)
        );
        if (offlineOnly) setUser(userRec.id);
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
        if (offlineOnly) localStorage.setItem('user-id', userRec.id);
      }
      toolChanged(toolId, false);
    }
    if (finishAdd) {
      finishAdd();
    }
    if (editId) {
      setEditId(null);
    }
    setView('Team');
  };

  const handleCancel = () => {
    if (myChanged) {
      const defLocale =
        currentUser?.attributes?.locale === '' ? t.defaultLocale : '';
      const defTimezone =
        currentUser?.attributes?.timezone === '' ? t.defaultTimezone : '';
      let message = t.discardChanges;
      let message2 = t.discardChangesExplained;
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
      setEditId(null);
      const userId = localStorage.getItem('user-id');
      if (!userId && offlineOnly) {
        setView('Logout');
        return;
      }
    }
    setView('Team');
  };
  const handleCancelAborted = () => {
    setConfirmCancel(undefined);
  };

  const handleDelete = () => {
    if (currentUser) setDeleteItem(currentUser.id);
  };
  const handleDeleteConfirmed = async () => {
    const deleteRec = getUserRec(deleteItem);
    const remote = coordinator.getSource('remote');
    await waitForIt(
      'wait for any changes to finish',
      () => !remote || !connected || remote.requestQueue.length === 0,
      () => false,
      200
    );
    await RemoveUserFromOrg(memory, deleteRec, undefined, user, teamDelete);
    await memory.update((tb) =>
      tb.removeRecord({ type: 'user', id: deleteItem })
    );
    //wait to be sure orbit remote is done also
    try {
      await waitForIt(
        'logout after user delete',
        () => !remote || !connected || remote.requestQueue.length === 0,
        () => false,
        200
      );
    } catch {
      //well we tried...
    }
    localStorage.removeItem('user-id');
    setView('Logout');
  };
  const handleDeleteRefused = () => {
    setDeleteItem('');
  };

  useEffect(() => {
    if (isOffline) getParatextDataPath().then((val) => setPtPath(val));
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  useEffect(() => {
    let userRec: User = {
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
        setCurrentUser(userRec);
        const orgMbrRecs = memory.cache.query((q: QueryBuilder) =>
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
    setEmail(attr.email);
    setPhone(attr.phone);
    setTimezone(attr.timezone || '');
    setLocale(attr.locale ? attr.locale : localeDefault(isDeveloper));
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
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [user]);

  useEffect(() => {
    if (timezone === '') {
      const myZone = moment.tz.guess();
      setTimezone(myZone || '');
      toolChanged(toolId, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timezone]);

  useEffect(() => {
    if (!isOffline) {
      if (!paratext_usernameStatus) {
        getUserName(accessToken || '', errorReporter, t.checkingParatext);
      }
      setHasParatext(paratext_username !== '');
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [paratext_username, paratext_usernameStatus]);

  const userNotComplete = () =>
    currentUser === undefined ||
    currentUser.attributes?.name === currentUser.attributes?.email;

  const requiredComplete = () =>
    (name || '') !== '' &&
    (family || '') !== '' &&
    (given || '') !== '' &&
    (timezone || '') !== '' &&
    (locale || '') !== '';

  if (/Logout/i.test(view)) navigate('/logout');
  if (/access/i.test(view)) navigate('/');
  if (/Team/i.test(view)) return <StickyRedirect to="/team" />;

  return (
    <Box id="Profile" sx={{ width: '100%' }}>
      <AppHead {...props} />
      <PaperContainer noMargin={noMargin}>
        <Box sx={{ pl: 4 }}>
          <Grid container>
            <StyledGrid item xs={12} md={5}>
              <BigAvatar avatarUrl={avatarUrl} name={name || ''} />
              {name !== email && <Caption variant="h6">{name || ''}</Caption>}
              <Caption>{email || ''}</Caption>
              <ParatextLinked
                hasParatext={hasParatext}
                ptPath={ptPath}
                setView={setView}
                isOffline={isOffline}
              />
            </StyledGrid>
            <Grid item xs={12} md={7}>
              {editId && /Add/i.test(editId) ? (
                <Typography variant="h6">{t.addMember}</Typography>
              ) : userNotComplete() ? (
                <Typography variant="h6">{t.completeProfile}</Typography>
              ) : (
                <Typography variant="h6">{t.userProfile}</Typography>
              )}

              <FormControl>
                <FormGroup sx={{ pb: 3 }}>
                  <FormControlLabel
                    control={
                      <TextField
                        id="profileName"
                        label={t.name}
                        sx={textFieldProps}
                        value={name}
                        onChange={handleNameChange}
                        onClick={handleNameClick}
                        helperText={
                          dupName && (
                            <Typography color="secondary" variant="caption">
                              {t.userExists}
                            </Typography>
                          )
                        }
                        margin="normal"
                        variant="filled"
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
                        label={t.given}
                        sx={textFieldProps}
                        value={given || ''}
                        onChange={handleGivenChange}
                        margin="normal"
                        required
                        variant="filled"
                      />
                    }
                    label=""
                  />
                  <FormControlLabel
                    control={
                      <TextField
                        id="family"
                        label={t.family}
                        sx={textFieldProps}
                        value={family || ''}
                        onChange={handleFamilyChange}
                        margin="normal"
                        required
                        variant="filled"
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
                          required={true}
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
                        label={t.locale}
                        sx={selectProps}
                        value={locale}
                        onChange={handleLocaleChange}
                        SelectProps={{
                          MenuProps: {
                            sx: menuProps,
                          },
                        }}
                        margin="normal"
                        variant="filled"
                        required={true}
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
                        label={t.timezone}
                        sx={selectProps}
                        value={timezone}
                        onChange={handleTimezoneChange}
                        SelectProps={{
                          MenuProps: {
                            sx: menuProps,
                          },
                        }}
                        margin="normal"
                        variant="filled"
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
                      sx={textFieldProps}
                      control={
                        <Checkbox
                          id="digest"
                          checked={digest === 1}
                          onChange={handleDigestChange}
                        />
                      }
                      label={t.sendDigest}
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
                      label={t.sharedContentCreator}
                    />
                  )}
                  {showDetail && (
                    <>
                      <FormControlLabel
                        control={
                          <TextField
                            id="phone"
                            label={t.phone}
                            sx={textFieldProps}
                            value={phone}
                            onChange={handlePhoneChange}
                            margin="normal"
                            variant="filled"
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
                          label={t.locked}
                        />
                      )}
                    </>
                  )}
                </FormGroup>
              </FormControl>
              <ActionRow>
                {((editId && /Add/i.test(editId)) ||
                  (currentUser &&
                    currentUser.attributes?.name !==
                      currentUser.attributes?.email)) && (
                  <AltButton
                    id="profileCancel"
                    key="cancel"
                    aria-label={t.cancel}
                    onClick={handleCancel}
                  >
                    {t.cancel}
                  </AltButton>
                )}
                <PriButton
                  id="profileSave"
                  key="add"
                  aria-label={t.add}
                  disabled={
                    !requiredComplete() ||
                    !myChanged ||
                    saveRequested(toolId) ||
                    dupName
                  }
                  onClick={currentUser === undefined ? handleAdd : handleSave}
                >
                  {editId && /Add/i.test(editId)
                    ? t.add
                    : userNotComplete()
                    ? t.next
                    : t.save}
                  <SaveIcon sx={{ ml: 1 }} />
                </PriButton>
              </ActionRow>
            </Grid>
          </Grid>
          {(!isOffline || offlineOnly) &&
            !editId &&
            currentUser &&
            currentUser.attributes.name !== currentUser.attributes.email && (
              <DeleteExpansion
                title={t.deleteUser}
                explain={t.deleteExplained}
                handleDelete={() => handleDelete()}
                inProgress={deleteItem !== ''}
              />
            )}
        </Box>
        {deleteItem !== '' && (
          <Confirm
            yesResponse={handleDeleteConfirmed}
            noResponse={handleDeleteRefused}
          />
        )}
        {confirmCancel && (
          <Confirm
            text="Discard unsaved data?"
            yesResponse={handleCancelConfirmed}
            noResponse={handleCancelAborted}
          />
        )}
      </PaperContainer>
    </Box>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'profile' }),
  paratext_username: state.paratext.username,
  paratext_usernameStatus: state.paratext.usernameStatus,
});

const mapRecordsToProps = {
  users: (q: QueryBuilder) => q.findRecords('user'),
};

const mapDispatchToProps = (dispatch: any) => ({
  ...bindActionCreators(
    {
      setLanguage: action.setLanguage,
      getUserName: action.getUserName,
    },
    dispatch
  ),
});

export default withData(mapRecordsToProps)(
  connect(mapStateToProps, mapDispatchToProps)(Profile as any) as any
) as any;
