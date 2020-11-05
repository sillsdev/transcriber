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
  Role,
  GroupMembership,
  Invitation,
} from '../model';
import { IAxiosStatus } from '../store/AxiosStatus';
import * as action from '../store';
import localStrings from '../selector/localize';
import { withData, WithDataProps } from '../mods/react-orbitjs';
import { QueryBuilder, TransformBuilder, Operation } from '@orbit/data';
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
  IconButton,
  Link,
} from '@material-ui/core';
import SaveIcon from '@material-ui/icons/Save';
import InfoIcon from '@material-ui/icons/Info';
import Confirm from '../components/AlertDialog';
import DeleteExpansion from '../components/DeleteExpansion';
import ParatextIcon from '../control/ParatextLogo';
import {
  remoteId,
  related,
  remoteIdNum,
  getRoleRec,
  getMbrRoleRec,
  allUsersRec,
} from '../crud';
import {
  makeAbbr,
  uiLang,
  uiLangDev,
  localeDefault,
  useRemoteSave,
  getParatextDataPath,
  useStickyRedirect,
} from '../utils';
import { Redirect } from 'react-router';
import moment from 'moment-timezone';
import en from '../assets/en.json';
import fr from '../assets/fr.json';
import ar from '../assets/ar.json';
import es from '../assets/es.json';
import ha from '../assets/ha.json';
import id from '../assets/id.json';
import ru from '../assets/ru.json';
import sw from '../assets/sw.json';
import pt from '../assets/pt.json';
import ta from '../assets/ta.json';
import { UpdateRecord, UpdateRelatedRecord } from '../model/baseModel';
import { currentDateTime } from '../utils/currentDateTime';
import { isElectron } from '../api-variable';
import { AppHead } from '../components/App/AppHead';
import { API_CONFIG } from '../api-variable';

interface ILangDes {
  type: string;
  content: string;
}
interface ILdml {
  [loc: string]: {
    ldml: {
      localeDisplayNames: {
        languages: {
          language: Array<ILangDes>;
        };
      };
    };
  };
}
const ldml: ILdml = { en, fr, ar, es, ha, id, ru, sw, pt, ta };

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
    actions: theme.mixins.gutters({
      paddingBottom: 16,
      display: 'flex',
      flexDirection: 'row',
    }) as any,
    button: {
      margin: theme.spacing(1),
    },
    icon: {
      marginLeft: theme.spacing(1),
    },
    caption: {
      display: 'table',
      width: 200,
      textAlign: 'center',
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
  const [editId, setEditId] = useGlobal('editUserId');
  const [organization] = useGlobal('organization');
  const [user] = useGlobal('user');
  const [orgRole] = useGlobal('orgRole');
  const [errorReporter] = useGlobal('errorReporter');
  const [isDeveloper] = useGlobal('developer');
  const [uiLanguages] = useState(isDeveloper ? uiLangDev : uiLang);
  const [currentUser, setCurrentUser] = useState<User | undefined>();
  const [name, setName] = useState('');
  const [given, setGiven] = useState<string | null>(null);
  const [family, setFamily] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [timezone, setTimezone] = useState<string | null>(moment.tz.guess());
  const [role, setRole] = useState('member');
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
  const [howToLink, setHowToLink] = useState(false);
  const [view, setView] = useState('');
  const [changed, setChanged] = useGlobal('changed');
  const [doSave] = useGlobal('doSave');
  const [, saveCompleted] = useRemoteSave();
  const [ptPath, setPtPath] = React.useState('');
  const stickyPush = useStickyRedirect();

  const handleNameClick = (event: React.MouseEvent<HTMLElement>) => {
    if (event.shiftKey) setShowDetail(!showDetail);
  };

  const handleNameChange = (e: any) => {
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

  const handleRoleChange = (e: any) => {
    setChanged(true);
    setRole(e.target.value);
  };

  const handleLocaleChange = (e: any) => {
    setChanged(true);
    setLocale(e.target.value);
  };

  const handleLockedChange = () => {
    setChanged(true);
    setLocked(!locked);
  };

  const handleNewsChange = () => {
    setChanged(true);
    setNews(!news);
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
      memory.update((t: TransformBuilder) => [
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
          remoteIdNum(
            'user',
            currentUser !== undefined ? currentUser.id : '',
            memory.keyMap
          )
        ),
        // we aren't allowing them to change owner oraganization currently
      ]);
      const roleRecs = memory.cache.query((q: QueryBuilder) =>
        q.findRecords('role')
      ) as Role[];
      const newRoleRec = getRoleRec(roleRecs, role, true);
      const mbrRec = getMbrRoleRec(
        memory,
        'organization',
        organization,
        currentUserId
      ) as OrganizationMembership[];
      if (newRoleRec.length > 0 && mbrRec.length > 0) {
        const curRoleId = related(mbrRec[0], 'role');
        if (curRoleId !== newRoleRec[0].id) {
          memory.update((t: TransformBuilder) =>
            UpdateRelatedRecord(
              t,
              mbrRec[0],
              'role',
              'role',
              newRoleRec[0].id,
              remoteIdNum('user', user, memory.keyMap)
            )
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

  const addToOrgAndGroup = (userRec: User) => {
    let orgMember: OrganizationMembership = {
      type: 'organizationmembership',
    } as any;
    memory.schema.initializeRecord(orgMember);
    const roleRecs = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('role')
    ) as Role[];
    const memberRec = getRoleRec(roleRecs, 'member', true);
    const allUsersGroup = allUsersRec(memory, organization);
    const editorRec = getRoleRec(roleRecs, 'editor', false);
    let groupMbr: GroupMembership = {
      type: 'groupmembership',
    } as any;
    memory.schema.initializeRecord(groupMbr);
    memory
      .update((t: TransformBuilder) => [t.addRecord(userRec)])
      .then(() => {
        memory.update((t: TransformBuilder) => [
          t.addRecord(orgMember),
          t.replaceRelatedRecord(orgMember, 'user', userRec),
          t.replaceRelatedRecord(orgMember, 'organization', {
            type: 'organization',
            id: organization,
          }),
          t.replaceRelatedRecord(orgMember, 'role', memberRec[0]),
        ]);
        memory.update((t: TransformBuilder) => [
          t.addRecord(groupMbr),
          t.replaceRelatedRecord(groupMbr, 'user', userRec),
          t.replaceRelatedRecord(groupMbr, 'group', allUsersGroup[0]),
          t.replaceRelatedRecord(groupMbr, 'role', editorRec[0]),
        ]);
      });
  };

  const handleAdd = () => {
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
          dateCreated: currentDateTime(),
          dateUpdated: currentDateTime(),
          lastModifiedBy: remoteId('user', user, memory.keyMap),
        },
      } as any;
      memory.schema.initializeRecord(userRec);
      if (!editId) {
        memory.update((t: TransformBuilder) => t.addRecord(userRec));
      } else {
        addToOrgAndGroup(userRec);
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
    if (editId) {
      setEditId(null);
    }
    setChanged(false);
    setView('Team');
  };

  const handleDelete = () => {
    if (currentUser) setDeleteItem(currentUser.id);
  };
  const handleDeleteConfirmed = async () => {
    const tb: TransformBuilder = new TransformBuilder();
    const ops: Operation[] = [];
    const current = users.filter((u) => u.id === deleteItem)[0];
    /* delete any invitations for this user
    so they can't rejoin orgs without a new invite */
    const invites: Invitation[] = memory.cache.query((q: QueryBuilder) =>
      q
        .findRecords('invitation')
        .filter({ attribute: 'email', value: current.attributes.email })
    ) as any;
    invites.forEach((i) =>
      ops.push(tb.removeRecord({ type: 'invitation', id: i.id }))
    );
    ops.push(tb.removeRecord({ type: 'user', id: deleteItem }));
    await memory.update(ops);
    setView('Logout');
  };
  const handleDeleteRefused = () => {
    setDeleteItem('');
  };

  const handleHowTo = () => {
    setHowToLink(true);
  };

  const handleLogout = () => {
    setView('Logout');
  };

  const handleNoLinkSetup = () => {
    setHowToLink(false);
  };

  const langName = (loc: string, opt: string): string => {
    return ldml[loc].ldml.localeDisplayNames.languages.language
      .filter((d) => d.type === opt)
      .map((d) => d.content)[0];
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
    if (isElectron) getParatextDataPath().then((val) => setPtPath(val));
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
        dateCreated: currentDateTime(),
        dateUpdated: currentDateTime(),
        lastModifiedBy: remoteIdNum('user', user, memory.keyMap),
      },
    };
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
          const roleId = related(mbrRec[0], 'role');
          const roleRec = memory.cache.query((q: QueryBuilder) =>
            q.findRecord({ type: 'role', id: roleId })
          ) as Role;
          const roleName = roleRec?.attributes?.roleName;
          if (roleName) {
            setRole(roleName);
          }
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
      setTimezone(myZone);
      setChanged(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timezone]);

  useEffect(() => {
    if (!isElectron) {
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
  if (/Access/i.test(view)) return <Redirect to="/" />;
  if (/Team/i.test(view)) stickyPush('/team');

  const orgRoles = ['Admin', 'Member'];

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
              <BigAvatar avatarUrl={avatarUrl} name={name} />
              {name !== email && (
                <Typography variant="h6" className={classes.caption}>
                  {name || ''}
                </Typography>
              )}
              <Typography className={classes.caption}>{email || ''}</Typography>
              <Typography
                className={clsx({
                  [classes.caption]: !paratext_usernameStatus?.errStatus || 0,
                })}
              >
                <ParatextIcon />
                {'\u00A0'}
                {paratext_usernameStatus?.errStatus ||
                0 ||
                (isElectron && !ptPath) ? (
                  <>
                    <Link onClick={handleHowTo}>{t.paratextNotLinked}</Link>
                    <IconButton color="primary" onClick={handleHowTo}>
                      <InfoIcon />
                    </IconButton>
                  </>
                ) : (hasParatext && paratext_usernameStatus?.complete) ||
                  ptPath ? (
                  t.paratextLinked
                ) : (
                  paratext_usernameStatus?.statusMsg || t.checkingParatext
                )}
              </Typography>
            </StyledGrid>
            <Grid item xs={12} md={7}>
              {editId && /Add/i.test(editId) ? (
                <Typography variant="h6">{t.addOfflineUser}</Typography>
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
                        id="name"
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
                        <TextField
                          id="select-org-role"
                          select
                          label={t.role}
                          className={classes.locale}
                          value={role}
                          onChange={handleRoleChange}
                          SelectProps={{
                            MenuProps: {
                              className: classes.menu,
                            },
                          }}
                          margin="normal"
                          variant="filled"
                          required={true}
                        >
                          {orgRoles.map((option: string, idx: number) => (
                            <MenuItem key={'role' + idx} value={option}>
                              {option}
                            </MenuItem>
                          ))}
                        </TextField>
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
                  {email !== '' && showDetail && (
                    <FormControlLabel
                      className={classes.textField}
                      control={
                        <Checkbox
                          id="news"
                          checked={news === true}
                          onChange={handleNewsChange}
                        />
                      }
                      label={t.sendNews.replace('{0}', API_CONFIG.productName)}
                    />
                  )}
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
          {!isOffline &&
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
        {howToLink && (
          <Confirm
            title={t.paratextLinking}
            text={isElectron ? t.installParatext : t.linkingExplained}
            yes={isElectron ? '' : t.logout}
            no={isElectron ? t.close : t.cancel}
            yesResponse={handleLogout}
            noResponse={handleNoLinkSetup}
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
