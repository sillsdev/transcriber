import React, { useEffect } from 'react';
import * as actions from '../store';
import { useGlobal, useState } from 'reactn';
import { connect } from 'react-redux';
import {
  IState,
  IIntegrationStrings,
  Project,
  Passage,
  ISharedStrings,
} from '../model';
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
import { withData, WithDataProps } from '../mods/react-orbitjs';
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
import { Theme, createStyles, makeStyles } from '@material-ui/core/styles';
import DeleteIcon from '@material-ui/icons/Delete';
import { AddRecord, UpdateRecord } from '../model/baseModel';
import Confirm from './AlertDialog';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  FormControl,
  FormGroup,
  FormControlLabel,
  FormHelperText,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  TextField,
  MenuItem,
} from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import SyncIcon from '@material-ui/icons/Sync';
import CheckIcon from '@material-ui/icons/Check';
import { useSnackBar } from '../hoc/SnackBar';
import ParatextLogo from '../control/ParatextLogo';
// import RenderLogo from '../control/RenderLogo';
import { remoteIdNum, related, useOfflnProjRead, remoteId } from '../crud';
import { Online, localSync, getParatextDataPath } from '../utils';
import Auth from '../auth/Auth';
import { bindActionCreators } from 'redux';
import ParatextProject from '../model/paratextProject';
import { QueryBuilder, TransformBuilder } from '@orbit/data';
import ProjectIntegration from '../model/projectintegration';
import Integration from '../model/integration';
import { IAxiosStatus } from '../store/AxiosStatus';
import localStrings from '../selector/localize';
import { doDataChanges } from '../hoc/DataChanges';
import Memory from '@orbit/memory';
import { translateParatextError } from '../utils/translateParatextError';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
    },
    panel: {
      flexDirection: 'column',
    },
    heading: {
      fontSize: theme.typography.pxToRem(15),
      fontWeight: theme.typography.fontWeightRegular,
    },
    legend: {
      paddingTop: theme.spacing(4),
    },
    textField: {
      marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
      width: 300,
    },
    //style for font size
    formTextInput: {
      fontSize: 'small',
    },
    formTextLabel: {
      fontSize: 'small',
    },
    listItem: {
      alignItems: 'flex-start',
    },
    formControl: {
      margin: theme.spacing(3),
    },
    explain: {
      marginTop: 0,
    },
    button: {
      margin: theme.spacing(1),
    },
    icon: {
      marginLeft: theme.spacing(1),
    },
    avatar: {
      color: 'green',
    },
    menu: {
      width: 300,
    },
  })
);

interface IStateProps {
  paratext_count: number; //state.paratext.count,
  paratext_countStatus?: IAxiosStatus;
  paratext_projects: ParatextProject[]; // state.paratext.projects,
  paratext_projectsStatus?: IAxiosStatus; // state.paratext.projectsQueried,
  paratext_username: string; // state.paratext.username
  paratext_usernameStatus?: IAxiosStatus;
  paratext_syncStatus?: IAxiosStatus; // state.paratext.syncStatus,
  t: IIntegrationStrings;
  ts: ISharedStrings;
}

interface IDispatchProps {
  getUserName: typeof actions.getUserName;
  getProjects: typeof actions.getProjects;
  getLocalProjects: typeof actions.getLocalProjects;
  getLocalCount: typeof actions.getLocalCount;
  syncProject: typeof actions.syncProject;
  resetSync: typeof actions.resetSync;
  resetCount: typeof actions.resetCount;
  resetProjects: typeof actions.resetProjects;
  resetUserName: typeof actions.resetUserName;
  setLanguage: typeof actions.setLanguage;
}
interface IRecordProps {
  projectintegrations: Array<ProjectIntegration>;
  integrations: Array<Integration>;
  projects: Array<Project>;
  passages: Array<Passage>;
}
interface IProps
  extends IStateProps,
    IDispatchProps,
    IRecordProps,
    WithDataProps {
  auth: Auth;
}

export function IntegrationPanel(props: IProps) {
  const {
    t,
    ts,
    auth,
    paratext_username,
    paratext_usernameStatus,
    paratext_count,
    paratext_countStatus,
    paratext_projects,
    paratext_projectsStatus,
    paratext_syncStatus,
  } = props;
  const {
    getUserName,
    getLocalCount,
    getProjects,
    getLocalProjects,
    syncProject,
    resetSync,
    resetCount,
    resetProjects,
    resetUserName,
    setLanguage,
  } = props;
  const { projectintegrations, integrations, projects, passages } = props;
  const classes = useStyles();
  const [connected, setConnected] = useGlobal('connected');
  const [hasPtProj, setHasPtProj] = useState(false);
  const [ptProj, setPtProj] = useState(-1);
  const [ptProjName, setPtProjName] = useState('');
  const [ptShortName, setPtShortName] = useState('');
  const [hasParatext, setHasParatext] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [ptPermission, setPtPermission] = useState('None');
  const [myProject, setMyProject] = useState('');
  const [project] = useGlobal('project');
  const [user] = useGlobal('user');
  const [projectsLoaded] = useGlobal('projectsLoaded');
  const getOfflineProject = useOfflnProjRead();
  const [offline] = useGlobal('offline');
  const [count, setCount] = useState(-1);

  const [paratextIntegration, setParatextIntegration] = useState('');
  const [confirmItem, setConfirmItem] = useState<string | null>(null);
  const [coordinator] = useGlobal('coordinator');
  const memory = coordinator.getSource('memory') as Memory;
  const [plan] = useGlobal('plan');
  const [fingerprint] = useGlobal('fingerprint');

  const [errorReporter] = useGlobal('errorReporter');
  const { showMessage, showTitledMessage } = useSnackBar();
  const [busy] = useGlobal('remoteBusy');
  const [ptPath, setPtPath] = useState('');
  const syncing = React.useRef<boolean>(false);
  const setSyncing = (state: boolean) => (syncing.current = state);

  const getProject = () => {
    const projfind: Project[] = projects.filter((p) => p.id === project);
    return projfind.length > 0 ? projfind[0] : undefined;
  };
  const addParatextIntegration = async (local: string): Promise<string> => {
    const int = {
      type: 'integration',
      attributes: {
        name: local,
        url: '',
      },
    } as Integration;
    memory.schema.initializeRecord(int);
    await memory.update((t: TransformBuilder) => t.addRecord(int));
    return int.id;
  };
  const getParatextIntegration = (local: string) => {
    const intfind: Integration[] = integrations.filter(
      (i) =>
        i.attributes?.name === local && Boolean(i.keys?.remoteId) !== offline
    );
    if (intfind.length === 0)
      addParatextIntegration(local).then((res) => setParatextIntegration(res));
    else setParatextIntegration(intfind[0].id);
  };

  const addProjectIntegration = async (
    integration: string,
    setting: string
  ): Promise<string> => {
    const pi = {
      type: 'projectintegration',
      attributes: {
        settings: setting,
      },
    } as any;
    await memory.update((t: TransformBuilder) => [
      ...AddRecord(t, pi, user, memory),
      t.replaceRelatedRecord(
        { type: 'projectintegration', id: pi.id },
        'project',
        { type: 'project', id: project }
      ),
      t.replaceRelatedRecord(
        { type: 'projectintegration', id: pi.id },
        'integration',
        { type: 'integration', id: integration }
      ),
    ]);
    return pi.id;
  };
  const updateProjectIntegration = (
    projInt: string,
    setting: string
  ): string => {
    memory.update((t: TransformBuilder) =>
      UpdateRecord(
        t,
        {
          type: 'projectintegration',
          id: projInt,
          attributes: {
            settings: setting,
          },
        } as ProjectIntegration,
        user
      )
    );
    return projInt;
  };
  const getProjectIntegration = (integration: string): string => {
    const projint: ProjectIntegration[] = projectintegrations.filter(
      (pi) =>
        related(pi, 'project') === project &&
        related(pi, 'integration') === integration &&
        pi.attributes
    );
    if (projint.length === 0) return '';
    return projint[0].id;
  };
  const removeProjectFromParatextList = (index: number) => {
    paratext_projects[index].ProjectIds = paratext_projects[
      index
    ].ProjectIds.filter(
      (p) => p !== (remoteId('project', project, memory.keyMap) || project)
    );
  };
  const handleParatextProjectChange = (e: any) => {
    if (e.target.value === t.removeProject) {
      handleRemoveIntegration();
      return;
    }
    let index: number = paratext_projects.findIndex(
      (p) => p.Name === e.target.value
    );
    if (ptProj >= 0) removeProjectFromParatextList(ptProj);
    setPtProj(index);
    setPtProjName(e.target.value);
    if (index >= 0) {
      setPtShortName(paratext_projects[index].ShortName);
      const paratextProject: ParatextProject = paratext_projects[index];
      const setting = {
        Name: paratextProject.Name,
        ParatextId: paratextProject.ParatextId,
        LanguageTag: paratextProject.LanguageTag,
        LanguageName: paratextProject.LanguageName,
      };
      let projint = getProjectIntegration(paratextIntegration);
      if (projint === '') {
        addProjectIntegration(paratextIntegration, JSON.stringify(setting));
      } else {
        updateProjectIntegration(projint, JSON.stringify(setting));
      }
      paratext_projects[index].ProjectIds.push(
        remoteId('project', project, memory.keyMap) || project
      );
    }
  };
  const handleSync = () => {
    setSyncing(true);
    syncProject(
      auth,
      remoteIdNum('project', project, memory.keyMap),
      errorReporter,
      t.syncPending,
      t.syncComplete
    );
  };
  const handleLocalSync = async () => {
    setSyncing(true);
    showMessage(t.syncPending);
    var err = await localSync(plan, ptShortName, passages, memory, user);
    showMessage(err || t.syncComplete);
    resetCount();
    setSyncing(false);
  };

  const handleRemoveIntegration = () => {
    setConfirmItem(t.paratextAssociation);
  };

  const handleDeleteConfirmed = () => {
    updateProjectIntegration(getProjectIntegration(paratextIntegration), '{}');
    setConfirmItem(null);
    removeProjectFromParatextList(ptProj);
    setPtProj(-1);
    setPtProjName('');
    setPtShortName('');
  };
  const handleDeleteRefused = () => setConfirmItem(null);
  const getProjectLabel = (): string => {
    if (offline) return t.selectProject;
    return connected
      ? paratext_projectsStatus && paratext_projectsStatus.complete
        ? !paratext_projectsStatus.errStatus
          ? paratext_projects.length > 0
            ? t.selectProject
            : formatWithLanguage(t.noProject)
          : (translateParatextError(paratext_projectsStatus, ts) as string)
        : t.projectsPending
      : t.offline;
  };
  const findConnectedProject = () => {
    let index = paratext_projects.findIndex(
      (p) =>
        p.ProjectIds.indexOf(
          remoteId('project', project, memory.keyMap) || project
        ) >= 0
    );
    setPtProj(index);
    setPtProjName(index >= 0 ? paratext_projects[index].Name : '');
    setPtShortName(index >= 0 ? paratext_projects[index].ShortName : '');
    if (pRef && pRef.current) pRef.current.focus();
  };
  const translateSyncError = (err: IAxiosStatus): JSX.Element => {
    return <span>{translateParatextError(err, ts)}</span>;
  };

  const canEditParatextText = (role: string): boolean => {
    return role === 'pt_administrator' || role === 'pt_translator';
  };

  const formatWithLanguage = (replLang: string): string => {
    let proj = getProject();
    let language = proj && proj.attributes ? proj.attributes.languageName : '';
    return replLang.replace('{lang0}', language || '');
  };

  useEffect(() => {
    Online((result) => {
      setConnected(result);
    }, auth);
    if (offline) getParatextDataPath().then((val) => setPtPath(val));
    resetProjects();
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  useEffect(() => {
    setHasParatext(false);
    resetUserName();
  }, [resetUserName, user]);

  useEffect(() => {
    if (connected && !hasParatext) resetUserName();
  }, [resetUserName, connected, hasParatext]);

  useEffect(() => {
    if (project !== myProject) {
      setPtProj(-1);
      setPtProjName('');
      setPtShortName('');
      resetProjects();
      resetCount();
      setMyProject(project);
      getLocalCount(passages, project, memory, errorReporter, t);
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [project]);

  useEffect(() => {
    resetCount();
    getLocalCount(passages, project, memory, errorReporter, t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passages]);

  /* do this once */
  useEffect(() => {
    if (integrations.length > 0 && !paratextIntegration) {
      resetSync();
      getParatextIntegration(offline ? 'paratextLocal' : 'paratext');
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [integrations, paratextIntegration]);

  useEffect(() => {
    if (paratext_countStatus) {
      if (paratext_countStatus.errStatus) {
        showTitledMessage(
          t.countError,
          translateParatextError(paratext_countStatus, ts)
        );
        resetCount();
      } else if (paratext_countStatus.complete) {
        setCount(paratext_count);
        resetCount();
      }
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [paratext_countStatus]);

  useEffect(() => {
    if (!offline) {
      if (!paratext_usernameStatus) {
        getUserName(auth, errorReporter, t.usernamePending);
      } else if (paratext_usernameStatus.errStatus)
        showTitledMessage(
          t.usernameError,
          translateParatextError(paratext_usernameStatus, ts)
        );

      setHasParatext(paratext_username !== '');
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [paratext_username, paratext_usernameStatus]);

  useEffect(() => {
    if (!busy) {
      if (!paratext_projectsStatus) {
        let proj = getProject();
        const langTag =
          proj && proj.attributes ? proj.attributes.language : undefined;
        if (offline) {
          const localprojs: ProjectIntegration[] = projectintegrations.filter(
            (pi) =>
              related(pi, 'integration') === paratextIntegration &&
              pi.attributes
          );
          var projIds = localprojs.map((pi) => {
            var settings = JSON.parse(pi.attributes.settings);
            return {
              Name: settings.Name,
              Id:
                remoteId('project', related(pi, 'project'), memory.keyMap) ||
                related(pi, 'project'),
            };
          });
          getParatextDataPath().then((ptPath) => {
            getLocalProjects(ptPath, t.projectsPending, projIds, langTag);
          });
        } else {
          getProjects(auth, t.projectsPending, errorReporter, langTag);
        }
      } else {
        if (paratext_projectsStatus.errStatus) {
          showTitledMessage(
            t.projectError,
            translateParatextError(paratext_projectsStatus, ts)
          );
        } else if (paratext_projectsStatus.complete) {
          findConnectedProject();
        }
      }
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [busy, paratext_projects, paratext_projectsStatus]);

  useEffect(() => {
    findConnectedProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectintegrations]);

  useEffect(() => {
    if (paratext_syncStatus) {
      if (paratext_syncStatus.errStatus) {
        showTitledMessage(t.syncError, translateSyncError(paratext_syncStatus));
        resetSync();
        setSyncing(false);
      } else if (paratext_syncStatus.statusMsg !== '') {
        showMessage(paratext_syncStatus.statusMsg);
      }
      if (paratext_syncStatus.complete) {
        resetCount();
        resetSync();
        setSyncing(false);
        doDataChanges(
          auth,
          coordinator,
          fingerprint,
          projectsLoaded,
          getOfflineProject,
          errorReporter,
          user,
          setLanguage
        );
      }
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [paratext_syncStatus]);

  useEffect(() => {
    setHasPtProj(ptProj >= 0);

    if (ptProj >= 0 && paratext_projects && paratext_projects.length > ptProj) {
      setPtPermission(paratext_projects[ptProj].CurrentUserRole);
      setHasPermission(
        paratext_projects[ptProj].IsConnectable &&
          canEditParatextText(paratext_projects[ptProj].CurrentUserRole)
      );
    } else {
      setHasPermission(false);
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [ptProj, paratext_projects]);
  const pRef = React.useRef<HTMLDivElement>(null);

  return (
    <div className={classes.root}>
      <Accordion defaultExpanded={!offline} disabled={offline}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls={t.paratext}
          id={t.paratext}
        >
          <Typography className={classes.heading}>
            <ParatextLogo />
            {'\u00A0' + t.paratext}
          </Typography>
        </AccordionSummary>
        <AccordionDetails className={classes.panel}>
          <List dense component="div">
            <ListItem key="connected">
              <ListItemAvatar>
                <Avatar className={classes.avatar}>
                  {!connected || <CheckIcon />}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={t.questionOnline}
                secondary={connected ? t.yes : t.no}
              />
            </ListItem>
            <ListItem key="hasProj" className={classes.listItem}>
              <ListItemAvatar>
                <Avatar className={classes.avatar}>
                  {!hasPtProj || <CheckIcon />}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={formatWithLanguage(t.questionProject)}
                secondary={
                  <TextField
                    ref={pRef}
                    id="select-project"
                    select
                    label={getProjectLabel()}
                    className={classes.textField}
                    value={ptProjName}
                    onChange={handleParatextProjectChange}
                    SelectProps={{
                      MenuProps: {
                        className: classes.menu,
                      },
                    }}
                    InputProps={{
                      classes: {
                        input: classes.formTextInput,
                      },
                    }}
                    InputLabelProps={{
                      classes: {
                        root: classes.formTextLabel,
                      },
                    }}
                    margin="normal"
                    variant="filled"
                    required={true}
                  >
                    {paratext_projects
                      .sort((i, j) => (i.Name < j.Name ? -1 : 1))
                      .map((option: ParatextProject) => (
                        <MenuItem key={option.ParatextId} value={option.Name}>
                          {option.Name +
                            ' (' +
                            option.LanguageName +
                            '-' +
                            option.LanguageTag +
                            ')'}
                        </MenuItem>
                      ))
                      .concat(
                        <MenuItem
                          key={t.removeProject}
                          value={t.removeProject}
                          disabled={!hasPtProj}
                        >
                          {t.removeProject + '\u00A0\u00A0'}
                          <DeleteIcon />
                        </MenuItem>
                      )}
                  </TextField>
                }
              />
            </ListItem>
            <ListItem key="hasParatext">
              <ListItemAvatar>
                <Avatar className={classes.avatar}>
                  {!hasParatext || <CheckIcon />}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={t.questionAccount}
                secondary={
                  hasParatext
                    ? t.yes + ': ' + paratext_username
                    : connected
                    ? paratext_usernameStatus &&
                      paratext_usernameStatus.complete
                      ? t.no
                      : t.usernamePending
                    : t.offline
                }
              />
            </ListItem>
            <ListItem key="hasPermission">
              <ListItemAvatar>
                <Avatar className={classes.avatar}>
                  {!hasPermission || <CheckIcon />}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={t.questionPermission}
                secondary={
                  hasPermission
                    ? t.yes + ' :' + ptPermission
                    : connected
                    ? t.no
                    : t.offline
                }
              />
            </ListItem>
            <ListItem key="ready">
              <ListItemAvatar>
                <Avatar className={classes.avatar}>
                  {count <= 0 || <CheckIcon />}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={t.countReady}
                secondary={count >= 0 ? count : t.countPending}
              />
            </ListItem>
          </List>

          <FormControl component="fieldset" className={classes.formControl}>
            <FormGroup>
              <FormControlLabel
                control={
                  <Button
                    id="IntWebSync"
                    key="sync"
                    aria-label={t.sync}
                    variant="contained"
                    color="primary"
                    className={classes.button}
                    disabled={
                      syncing.current ||
                      !connected ||
                      !hasPtProj ||
                      !hasParatext ||
                      !hasPermission ||
                      !paratext_count
                    }
                    onClick={handleSync}
                  >
                    {t.sync}
                    <SyncIcon className={classes.icon} />
                  </Button>
                }
                label=""
              />
              <FormHelperText>{t.allCriteria}</FormHelperText>
            </FormGroup>
          </FormControl>
        </AccordionDetails>
      </Accordion>
      <Accordion defaultExpanded={offline} disabled={!offline}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls={t.paratextLocal}
          id={t.paratextLocal}
        >
          <Typography className={classes.heading}>
            <ParatextLogo />
            {'\u00A0' + t.paratextLocal}
          </Typography>
        </AccordionSummary>
        <AccordionDetails className={classes.panel}>
          <List dense component="div">
            <ListItem key="installed">
              <ListItemAvatar>
                <Avatar className={classes.avatar}>
                  {!ptPath || <CheckIcon />}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={t.questionInstalled}
                secondary={ptPath ? t.yes : t.no}
              />
            </ListItem>
            <ListItem key="hasLocalProj" className={classes.listItem}>
              <ListItemAvatar>
                <Avatar className={classes.avatar}>
                  {!hasPtProj || <CheckIcon />}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={formatWithLanguage(t.questionProject)}
                secondary={
                  <TextField
                    ref={pRef}
                    id="select-project"
                    select
                    label={getProjectLabel()}
                    className={classes.textField}
                    value={ptProjName}
                    onChange={handleParatextProjectChange}
                    SelectProps={{
                      MenuProps: {
                        className: classes.menu,
                      },
                    }}
                    InputProps={{
                      classes: {
                        input: classes.formTextInput,
                      },
                    }}
                    InputLabelProps={{
                      classes: {
                        root: classes.formTextLabel,
                      },
                    }}
                    margin="normal"
                    variant="filled"
                    required={true}
                  >
                    {paratext_projects
                      .sort((i, j) => (i.Name < j.Name ? -1 : 1))
                      .map((option: ParatextProject) => (
                        <MenuItem key={option.ParatextId} value={option.Name}>
                          {option.Name +
                            ' (' +
                            option.LanguageName +
                            '-' +
                            option.LanguageTag +
                            ')'}
                        </MenuItem>
                      ))
                      .concat(
                        <MenuItem
                          key={t.removeProject}
                          value={t.removeProject}
                          disabled={!hasPtProj}
                        >
                          {t.removeProject + '\u00A0\u00A0'}
                          <DeleteIcon />
                        </MenuItem>
                      )}
                  </TextField>
                }
              />
            </ListItem>
            <ListItem key="localReady">
              <ListItemAvatar>
                <Avatar className={classes.avatar}>
                  {count <= 0 || <CheckIcon />}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={t.countReady}
                secondary={count >= 0 ? count : t.countPending}
              />
            </ListItem>
          </List>
          <FormControl component="fieldset" className={classes.formControl}>
            <FormGroup>
              <FormControlLabel
                control={
                  <Button
                    id="IntLocalSync"
                    key="localSync"
                    aria-label={t.sync}
                    variant="contained"
                    color="primary"
                    className={classes.button}
                    disabled={
                      syncing.current ||
                      !ptPath ||
                      !hasPtProj ||
                      !paratext_count
                    }
                    onClick={handleLocalSync}
                  >
                    {t.sync}
                    <SyncIcon className={classes.icon} />
                  </Button>
                }
                label=""
              />
              <FormHelperText>{t.allCriteria}</FormHelperText>
            </FormGroup>
          </FormControl>
        </AccordionDetails>
      </Accordion>
      {/* <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel2a-content"
          id="panel2a-header"
        >
          <Typography className={classes.heading}>
            <RenderLogo />
            {'\u00A0' + t.render}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>{'Not Implemented'}</Typography>
        </AccordionDetails>
      </Accordion> */}
      {/* <Accordion disabled>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel3a-content"
          id="panel3a-header"
        >
          <Typography className={classes.heading}>{t.onestory}</Typography>
        </AccordionSummary>
      </Accordion> */}
      {confirmItem !== null ? (
        <Confirm
          title={t.removeProject}
          text={confirmItem}
          yesResponse={handleDeleteConfirmed}
          noResponse={handleDeleteRefused}
        />
      ) : (
        <></>
      )}
    </div>
  );
}
const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'integration' }),
  ts: localStrings(state, { layout: 'shared' }),
  paratext_count: state.paratext.count,
  paratext_countStatus: state.paratext.countStatus,
  paratext_username: state.paratext.username,
  paratext_usernameStatus: state.paratext.usernameStatus,
  paratext_projects: state.paratext.projects,
  paratext_projectsStatus: state.paratext.projectsStatus,
  paratext_syncStatus: state.paratext.syncStatus,
});
const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
  ...bindActionCreators(
    {
      getUserName: actions.getUserName,
      getProjects: actions.getProjects,
      getLocalProjects: actions.getLocalProjects,
      getLocalCount: actions.getLocalCount,
      syncProject: actions.syncProject,
      resetSync: actions.resetSync,
      resetCount: actions.resetCount,
      resetProjects: actions.resetProjects,
      resetUserName: actions.resetUserName,
      setLanguage: actions.setLanguage,
    },
    dispatch
  ),
});
const mapRecordsToProps = {
  projectintegrations: (q: QueryBuilder) => q.findRecords('projectintegration'),
  integrations: (q: QueryBuilder) => q.findRecords('integration'),
  projects: (q: QueryBuilder) => q.findRecords('project'),
  passages: (q: QueryBuilder) => q.findRecords('passage'),
};

export default withData(mapRecordsToProps)(
  connect(mapStateToProps, mapDispatchToProps)(IntegrationPanel) as any
) as any;
