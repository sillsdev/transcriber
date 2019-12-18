import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { useGlobal } from 'reactn';
import Auth from '../auth/Auth';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { IState, User, IProfileStrings, DigestPreference } from '../model';
import * as action from '../store';
import localStrings from '../selector/localize';
import { withData, WithDataProps } from 'react-orbitjs';
import { QueryBuilder, TransformBuilder } from '@orbit/data';
import {
  withStyles,
  makeStyles,
  createStyles,
  Theme,
} from '@material-ui/core/styles';
import {
  AppBar,
  Toolbar,
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
import UserMenu from '../components/UserMenu';
import SaveIcon from '@material-ui/icons/Save';
import SnackBar from '../components/SnackBar';
import Confirm from '../components/AlertDialog';
import DeleteExpansion from '../components/DeleteExpansion';
import { remoteId, makeAbbr, uiLang } from '../utils';
import { API_CONFIG } from '../api-variable';
import { Redirect } from 'react-router';
import moment from 'moment-timezone';
import en from '../assets/en.json';
import fr from '../assets/fr.json';

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
const ldml: ILdml = { en, fr };

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
    }),
    button: {
      margin: theme.spacing(1),
    },
    icon: {
      marginLeft: theme.spacing(1),
    },
    caption: {
      display: 'table',
      margin: '0 auto',
    },
    bigAvatar: {
      margin: '0 auto',
      width: 200,
      height: 200,
    },
  })
);

interface IStateProps {
  t: IProfileStrings;
}

interface IDispatchProps {
  setLanguage: typeof action.setLanguage;
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
  history: {
    location: {
      pathname: string;
    };
  };
}

export function Profile(props: IProps) {
  const { users, t, noMargin, finishAdd, auth, history, setLanguage } = props;
  const classes = useStyles();
  const [schema] = useGlobal('schema');
  const [memory] = useGlobal('memory');
  const [keyMap] = useGlobal('keyMap');
  const [bucket] = useGlobal('bucket');
  const { isAuthenticated } = auth;
  // const [orgRole] = useGlobal('orgRole');
  const [user] = useGlobal('user');
  const [orgRole] = useGlobal('orgRole');
  const [currentUser, setCurrentUser] = useState<User | undefined>();
  const [name, setName] = useState('');
  const [given, setGiven] = useState<string | null>(null);
  const [family, setFamily] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [timezone, setTimezone] = useState<string | null>(moment.tz.guess());
  const [locale, setLocale] = useState<string>(
    navigator.language.split('-')[0]
  );
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
  const [message, setMessage] = useState(<></>);
  const [view, setView] = useState('');
  const [changed, setChanged] = useState(false);

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

  const handleMessageReset = () => setMessage(<></>);

  const handleUserMenuAction = (what: string) => {
    if (!/Close/i.test(what)) {
      if (/Clear/i.test(what)) {
        bucket.setItem('remote-requests', []);
      }
      setView(what);
    }
  };

  const handleSave = () => {
    if (changed) {
      memory.update((t: TransformBuilder) => [
        t.updateRecord({
          type: 'user',
          id: user,
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
            dateUpdated: new Date().toISOString(),
          },
        }),
        // we aren't allowing them to change owner oraganization currently
      ]);
      setLanguage(locale);
    }
    setView('Main');
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
          dateCreated: new Date().toISOString(),
          dateUpdated: null,
          lastModifiedBy: remoteId('user', user, keyMap),
        },
      } as any;
      schema.initializeRecord(userRec);
      memory.update((t: TransformBuilder) => [t.addRecord(userRec)]);
    }
    if (finishAdd) {
      finishAdd();
    }
    setView('Main');
  };

  const handleCancel = () => setView('Main');

  const handleDelete = () => {
    if (currentUser) setDeleteItem(currentUser.id);
  };
  const handleDeleteConfirmed = () => {
    memory.update((t: TransformBuilder) =>
      t.removeRecord({ type: 'user', id: deleteItem })
    );
    setView('Logout');
  };
  const handleDeleteRefused = () => {
    setDeleteItem('');
  };

  const langName = (loc: string, opt: string): string => {
    return ldml[loc].ldml.localeDisplayNames.languages.language
      .filter(d => d.type === opt)
      .map(d => d.content)[0];
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
        dateCreated: null,
        dateUpdated: null,
        lastModifiedBy: remoteId('user', user, keyMap),
      },
    };
    const current = users.filter(u => u.id === user);
    if (current.length === 1) {
      userRec = current[0];
      setCurrentUser(userRec);
    }
    const attr = userRec.attributes;
    setName(attr.name !== attr.email ? attr.name : '');
    setGiven(attr.givenName ? attr.givenName : '');
    setFamily(attr.familyName ? attr.familyName : '');
    setEmail(attr.email);
    setPhone(attr.phone);
    setTimezone(attr.timezone);
    setLocale(attr.locale ? attr.locale : navigator.language.split('-')[0]);
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
  }, [timezone]);

  if (!isAuthenticated()) {
    localStorage.setItem('url', history.location.pathname);
    return <Redirect to="/" />;
  }
  if (/Logout/i.test(view)) return <Redirect to="/logout" />;
  if (/Main/i.test(view)) return <Redirect to="/main" />;

  return (
    <div id="Profile" className={classes.root}>
      <AppBar position="fixed" className={classes.appBar}>
        <Toolbar>
          <Typography variant="h6" noWrap>
            {(API_CONFIG.isApp ? t.silTranscriber : t.silTranscriberAdmin) +
              ' - ' +
              t.userProfile}
          </Typography>
          <div className={classes.grow}>{'\u00A0'}</div>
          <UserMenu action={handleUserMenuAction} />
        </Toolbar>
      </AppBar>
      <Paper
        className={clsx(classes.container, {
          [classes.fullContainer]: noMargin,
        })}
      >
        <div className={classes.paper}>
          <Grid container>
            <StyledGrid item xs={12} lg={5}>
              <BigAvatar avatarUrl={avatarUrl} name={name} />
              {name !== email && <h3 className={classes.caption}>{name}</h3>}
              <Typography className={classes.caption}>{email}</Typography>
            </StyledGrid>
            <Grid item xs={12} lg={7}>
              {(currentUser === undefined ||
                currentUser.attributes.name ===
                  currentUser.attributes.email) && <h2>{t.completeProfile}</h2>}
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
                        value={given}
                        onChange={handleGivenChange}
                        margin="normal"
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
                        value={family}
                        onChange={handleFamilyChange}
                        margin="normal"
                        variant="filled"
                      />
                    }
                    label=""
                  />
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
                        {uiLang.map((option: string, idx: number) => (
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
                  <FormControlLabel
                    className={classes.textField}
                    control={
                      <Checkbox
                        id="news"
                        checked={news === true}
                        onChange={handleNewsChange}
                      />
                    }
                    label={t.sendNews}
                  />
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
                {currentUser &&
                  currentUser.attributes.name !==
                    currentUser.attributes.email && (
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
                  disabled={name === '' || !changed}
                  onClick={currentUser === undefined ? handleAdd : handleSave}
                >
                  {currentUser === undefined ? t.add : t.save}
                  <SaveIcon className={classes.icon} />
                </Button>
              </div>
            </Grid>
          </Grid>
          {currentUser &&
            currentUser.attributes.name !== currentUser.attributes.email && (
              <DeleteExpansion
                title={t.deleteUser}
                explain={t.deleteExplained}
                handleDelete={() => handleDelete()}
              />
            )}
        </div>
        {deleteItem !== '' ? (
          <Confirm
            yesResponse={handleDeleteConfirmed}
            noResponse={handleDeleteRefused}
          />
        ) : (
          <></>
        )}
        <SnackBar {...props} message={message} reset={handleMessageReset} />
      </Paper>
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'profile' }),
});

const mapRecordsToProps = {
  users: (q: QueryBuilder) => q.findRecords('user'),
};

const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
  ...bindActionCreators(
    {
      setLanguage: action.setLanguage,
    },
    dispatch
  ),
});

export default withData(mapRecordsToProps)(
  connect(mapStateToProps, mapDispatchToProps)(Profile) as any
) as any;
