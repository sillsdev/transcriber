import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { useGlobal } from 'reactn';
import Auth from '../auth/Auth';
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
import { withData, WithDataProps } from '../mods/react-orbitjs';
import { QueryBuilder, TransformBuilder } from '@orbit/data';
import {
  withStyles,
  makeStyles,
  createStyles,
  Theme,
} from '@material-ui/core/styles';
import {
  Paper,
  Grid,
  TextField,
  FormControl,
  FormGroup,
  FormControlLabel,
  Button,
  Checkbox,
  Typography,
  Avatar,
  MenuItem,
} from '@material-ui/core';
import SaveIcon from '@material-ui/icons/Save';
import Confirm from '../components/AlertDialog';
import ParatextLinked from '../components/ParatextLinked';
import DeleteExpansion from '../components/DeleteExpansion';
import {
  related,
  useRole,
  useAddToOrgAndGroup,
  RemoveUserFromOrg,
} from '../crud';
import {
  makeAbbr,
  uiLang,
  uiLangDev,
  langName,
  localeDefault,
  useRemoteSave,
  getParatextDataPath,
  waitForIt,
} from '../utils';
import { Redirect } from 'react-router';
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

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
    },
    grow: {
      flexGrow: 1,
    },
    appBar: {
      width: '100%',
      boxShadow: 'none',
    },
    container: {
      display: 'flex',
      flexGrow: 1,
      margin: theme.spacing(4),
      marginTop: '80px',
      padding: '40px',
      justifyContent: 'center',
    },
    fullContainer: {
      margin: 0,
    },
    paper: {
      paddingLeft: theme.spacing(4),
    },
    group: {
      paddingBottom: theme.spacing(3),
    },
    textField: {
      marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
    },
    locale: {
      marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
      width: 206,
    },
    timezone: {
      marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
      width: 206,
    },
    menu: {
      width: 200,
    },
    actions: {
      paddingBottom: 16,
      display: 'flex',
      flexDirection: 'row',
    },
    button: {
      margin: theme.spacing(1),
    },
    icon: {
      marginLeft: theme.spacing(1),
    },
    caption: {
      width: 150,
      textAlign: 'left',
      textOverflow: 'ellipsis',
      overflow: 'hidden',
    },
    notLinked: {
      fontWeight: 'bold',
      paddingTop: theme.spacing(2),
    },
    bigAvatar: {
      width: 150,
      height: 150,
    },
  })
);

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

interface IProps
  extends IStateProps,
    IDispatchProps,
    IRecordProps,
    WithDataProps {
  auth: Auth;
  noMargin?: boolean;
  finishAdd?: () => void;
}

export function Profile(props: IProps) {
  const { users, t, noMargin, finishAdd, setLanguage, auth } = props;
  const { paratext_username, paratext_usernameStatus, getUserName } = props;
  const classes = useStyles();
  const [isOffline] = useGlobal('offline');
  const [memory] = useGlobal('memory');
  const [coordinator] = useGlobal('coordinator');
  const [connected] = useGlobal('connected');
  const [editId, setEditId] = useGlobal('editUserId');
  const [organization] = useGlobal('organization');
  const [user, setUser] = useGlobal('user');
  const [, setLang] = useGlobal('lang');
  const [orgRole] = useGlobal('orgRole');
  const [offlineOnly] = useGlobal('offlineOnly');
  const [errorReporter] = useGlobal('errorReporter');
  const [isDeveloper] = useGlobal('developer');
  const { getMbrRoleRec } = useRole();
  const [uiLanguages] = useState(isDeveloper ? uiLangDev : uiLang);
  const [currentUser, setCurrentUser] = useState<User | undefined>();
  const [name, setName] = useState('');
  const [given, setGiven] = useState<string | null>(null);
  const [family, setFamily] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [timezone, setTimezone] = useState<string | null>(
    moment.tz.guess() || ''
  );
  const [role, setRole] = useState('');
  const [locale, setLocale] = useState<string>(localeDefault(isDeveloper));
  const [news, setNews] = useState<boolean | null>(null);
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
  const [changed, setChanged] = useGlobal('changed');
  const [doSave] = useGlobal('doSave');
  const [, saveCompleted] = useRemoteSave();
  const [ptPath, setPtPath] = React.useState('');
  const { showMessage } = useSnackBar();
  const addToOrgAndGroup = useAddToOrgAndGroup();

  const handleNameClick = (event: React.MouseEvent<HTMLElement>) => {
    if (event.shiftKey) setShowDetail(!showDetail);
  };

  const handleNameChange = (e: any) => {
    if (e.target.value === email) {
      showMessage(t.nameNotEmail);
      return;
    }
    setChanged(true);
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
    setChanged(true);
    setGiven(e.target.value);
  };

  const handleFamilyChange = (e: any) => {
    setChanged(true);
    setFamily(e.target.value);
  };

  const handlePhoneChange = (e: any) => {
    setChanged(true);
    setPhone(e.target.value);
  };

  const handleTimezoneChange = (e: any) => {
    setChanged(true);
    setTimezone(e.target.value);
  };

  const handleRoleChange = (e: string) => {
    setChanged(true);
    setRole(e);
  };

  const handleLocaleChange = (e: any) => {
    setChanged(true);
    setLocale(e.target.value);
  };

  const handleLockedChange = () => {
    setChanged(true);
    setLocked(!locked);
  };

  const handleDigestChange = () => {
    setChanged(true);
    setDigest(
      digest ? DigestPreference.noDigest : DigestPreference.dailyDigest
    );
  };
  useEffect(() => {
    if (doSave) {
      handleSave();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doSave]);

  const handleSave = () => {
    if (changed) {
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
                hotKeys,
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
          // setOrgRole(role);
        }
      }
      if (!editId) setLanguage(locale);
      setChanged(false);
    }
    saveCompleted('');
    if (editId) {
      setEditId(null);
    }
    setView('Team');
  };

  const handleAdd = async () => {
    if (changed) {
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
      setChanged(false);
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
    setChanged(false);
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

  const handleDelete = () => {
    if (currentUser) setDeleteItem(currentUser.id);
  };
  const handleDeleteConfirmed = async () => {
    RemoveUserFromOrg(memory, deleteItem, undefined, user);
    await memory.update((tb) =>
      tb.removeRecord({ type: 'user', id: deleteItem })
    );
    const remote = coordinator.getSource('remote');
    //wait to be sure orbit remote is done also
    await waitForIt(
      'logout after user delete',
      () => !remote || !connected || remote.requestQueue.length === 0,
      () => false,
      20
    );
    setView('Logout');
  };
  const handleDeleteRefused = () => {
    setDeleteItem('');
  };

  interface IBigAvatarProps {
    avatarUrl: string | null;
    name: string;
  }
  const BigAvatar = (props: IBigAvatarProps) => {
    const { avatarUrl, name } = props;

    if (!avatarUrl || avatarUrl === '') {
      return <Avatar className={classes.bigAvatar}>{makeAbbr(name)}</Avatar>;
    }
    return <Avatar className={classes.bigAvatar} src={avatarUrl} />;
  };

  const StyledGrid = withStyles({ item: { padding: '0 30px' } })(Grid);

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
    setTimezone(attr.timezone);
    setLocale(attr.locale ? attr.locale : localeDefault(isDeveloper));
    setNews(attr.newsPreference);
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
    if (timezone === null) {
      const myZone = moment.tz.guess();
      setTimezone(myZone || '');
      setChanged(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timezone]);

  useEffect(() => {
    if (!isOffline) {
      if (!paratext_usernameStatus) {
        getUserName(auth, errorReporter, t.checkingParatext);
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

  if (/Logout/i.test(view)) return <Redirect to="/logout" />;
  if (/access/i.test(view)) return <Redirect to="/" />;
  if (/Team/i.test(view)) return <StickyRedirect to="/team" />;

  return (
    <div id="Profile" className={classes.root}>
      <AppHead {...props} />
      <Paper
        className={clsx(classes.container, {
          [classes.fullContainer]: noMargin,
        })}
      >
        <div className={classes.paper}>
          <Grid container>
            <StyledGrid item xs={12} md={5}>
              <BigAvatar avatarUrl={avatarUrl} name={name || ''} />
              {name !== email && (
                <Typography variant="h6" className={classes.caption}>
                  {name || ''}
                </Typography>
              )}
              <Typography className={classes.caption}>{email || ''}</Typography>
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
                <FormGroup className={classes.group}>
                  <FormControlLabel
                    control={
                      <TextField
                        id="profileName"
                        label={t.name}
                        className={classes.textField}
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
                        className={classes.textField}
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
                        className={classes.textField}
                        value={family || ''}
                        onChange={handleFamilyChange}
                        margin="normal"
                        required
                        variant="filled"
                      />
                    }
                    label=""
                  />
                  {orgRole === 'admin' && editId && email !== '' && (
                    <FormControlLabel
                      control={
                        <SelectRole
                          org={true}
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
                        className={classes.locale}
                        value={locale}
                        onChange={handleLocaleChange}
                        SelectProps={{
                          MenuProps: {
                            className: classes.menu,
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
                        className={classes.timezone}
                        value={timezone}
                        onChange={handleTimezoneChange}
                        SelectProps={{
                          MenuProps: {
                            className: classes.menu,
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
                      className={classes.textField}
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
                  {showDetail && (
                    <>
                      <FormControlLabel
                        control={
                          <TextField
                            id="phone"
                            label={t.phone}
                            className={classes.textField}
                            value={phone}
                            onChange={handlePhoneChange}
                            margin="normal"
                            variant="filled"
                          />
                        }
                        label=""
                      />
                      {orgRole === 'admin' && (
                        <FormControlLabel
                          className={classes.textField}
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
              <div className={classes.actions}>
                {((editId && /Add/i.test(editId)) ||
                  (currentUser &&
                    currentUser.attributes?.name !==
                      currentUser.attributes?.email)) && (
                  <Button
                    id="profileCancel"
                    key="cancel"
                    aria-label={t.cancel}
                    variant="outlined"
                    color="primary"
                    className={classes.button}
                    onClick={handleCancel}
                  >
                    {t.cancel}
                  </Button>
                )}
                <Button
                  id="profileSave"
                  key="add"
                  aria-label={t.add}
                  variant="contained"
                  color="primary"
                  className={classes.button}
                  disabled={!requiredComplete() || !changed || dupName}
                  onClick={currentUser === undefined ? handleAdd : handleSave}
                >
                  {editId && /Add/i.test(editId)
                    ? t.add
                    : userNotComplete()
                    ? t.next
                    : t.save}
                  <SaveIcon className={classes.icon} />
                </Button>
              </div>
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
              />
            )}
        </div>
        {deleteItem !== '' && (
          <Confirm
            yesResponse={handleDeleteConfirmed}
            noResponse={handleDeleteRefused}
          />
        )}
      </Paper>
    </div>
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

const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
  ...bindActionCreators(
    {
      setLanguage: action.setLanguage,
      getUserName: action.getUserName,
    },
    dispatch
  ),
});

export default withData(mapRecordsToProps)(
  connect(mapStateToProps, mapDispatchToProps)(Profile) as any
) as any;
