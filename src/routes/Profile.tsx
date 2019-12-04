import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { useGlobal } from 'reactn';
import { connect } from 'react-redux';
import { IState, User, IProfileStrings } from '../model';
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
} from '@material-ui/core';
import UserMenu from '../components/UserMenu';
import SaveIcon from '@material-ui/icons/Save';
import SnackBar from '../components/SnackBar';
import Confirm from '../components/AlertDialog';
import DeleteExpansion from '../components/DeleteExpansion';
import { remoteId, makeAbbr } from '../utils';
import { API_CONFIG } from '../api-variable';
import { Redirect } from 'react-router';

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

interface IRecordProps {
  users: Array<User>;
}

interface IProps extends IStateProps, IRecordProps, WithDataProps {
  noMargin?: boolean;
  finishAdd?: () => void;
}

export function Profile(props: IProps) {
  const { users, t, noMargin, finishAdd } = props;
  const classes = useStyles();
  const [schema] = useGlobal('schema');
  const [memory] = useGlobal('memory');
  const [keyMap] = useGlobal('keyMap');
  const [bucket] = useGlobal('bucket');
  // const [orgRole] = useGlobal('orgRole');
  const [user] = useGlobal('user');
  const [currentUser, setCurrentUser] = useState<User | undefined>();
  const [name, setName] = useState('');
  const [given, setGiven] = useState<string | null>(null);
  const [family, setFamily] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState<string | null>(null);
  const [timezone, setTimezone] = useState<string | null>(null);
  const [locale, setLocale] = useState<string | null>(null);
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
            hotKeys,
            avatarUrl,
            dateUpdated: new Date().toISOString(),
          },
        }),
        // we aren't allowing them to change owner oraganization currently
      ]);
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

  const handleDelete = (u: User | undefined) => () => {
    if (u !== undefined) setDeleteItem(u.id);
  };
  const handleDeleteConfirmed = () => {
    memory.update((t: TransformBuilder) =>
      t.removeRecord({ type: 'user', id: deleteItem })
    );
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
        notifications: 1,
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
    setLocale(attr.locale);
    setLocked(true);
    setBcp47(attr.uilanguagebcp47);
    setTimerDir(attr.timercountUp);
    setSpeed(attr.playbackSpeed);
    setProgBar(attr.progressbarTypeid);
    setHotKeys(attr.hotKeys);
    setAvatarUrl(attr.avatarUrl);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [user]);

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
            <StyledGrid item xs={12} lg={6}>
              <BigAvatar avatarUrl={avatarUrl} name={name} />
              {name !== email && <h3 className={classes.caption}>{name}</h3>}
              <Typography className={classes.caption}>{email}</Typography>
            </StyledGrid>
            <Grid item xs={12} lg={6}>
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
                      <FormControlLabel
                        control={
                          <TextField
                            id="timezone"
                            label={t.timezone}
                            className={classes.textField}
                            value={timezone}
                            onChange={handleTimezoneChange}
                            margin="normal"
                            variant="filled"
                          />
                        }
                        label=""
                      />
                      <FormControlLabel
                        control={
                          <TextField
                            id="locale"
                            label={t.locale}
                            className={classes.textField}
                            value={locale}
                            onChange={handleLocaleChange}
                            margin="normal"
                            variant="filled"
                          />
                        }
                        label=""
                      />
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
                handleDelete={() => handleDelete(currentUser)}
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

export default withData(mapRecordsToProps)(
  connect(mapStateToProps)(Profile) as any
) as any;
