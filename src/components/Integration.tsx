import React, { useEffect } from 'react';
import * as actions from '../store';
import { useGlobal } from 'reactn';
import { connect } from 'react-redux';
import { IState, IIntegrationStrings, Project, Passage } from '../model';
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
import { withData, WithDataProps } from '../mods/react-orbitjs';
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
import { Theme, createStyles, makeStyles } from '@material-ui/core/styles';
import DeleteIcon from '@material-ui/icons/Delete';
import { UpdateRecord } from '../model/baseModel';
import Confirm from './AlertDialog';
import {
  ExpansionPanel,
  ExpansionPanelSummary,
  ExpansionPanelDetails,
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
import SnackBar from '../components/SnackBar';
import {
  remoteIdNum,
  related,
  Online,
  localSync,
  getParatextDataPath,
} from '../utils';
import Auth from '../auth/Auth';
import { bindActionCreators } from 'redux';
import ParatextProject from '../model/paratextProject';
import { QueryBuilder, TransformBuilder } from '@orbit/data';
import ProjectIntegration from '../model/projectintegration';
import Integration from '../model/integration';
import { schema } from '../schema';
import { IAxiosStatus } from '../store/AxiosStatus';
import localStrings from '../selector/localize';
import { isElectron } from '../api-variable';

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
}

interface IDispatchProps {
  getUserName: typeof actions.getUserName;
  getProjects: typeof actions.getProjects;
  getLocalProjects: typeof actions.getLocalProjects;
  getCount: typeof actions.getCount;
  getLocalCount: typeof actions.getLocalCount;
  syncProject: typeof actions.syncProject;
  resetSync: typeof actions.resetSync;
  resetCount: typeof actions.resetCount;
  resetProjects: typeof actions.resetProjects;
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
    getCount,
    getLocalCount,
    getProjects,
    getLocalProjects,
    syncProject,
    resetSync,
    resetCount,
    resetProjects,
  } = props;
  const { projectintegrations, integrations, projects, passages } = props;
  const classes = useStyles();

  const [online, setOnline] = React.useState<boolean>();
  const [hasPtProj, setHasPtProj] = React.useState(false);
  const [ptProj, setPtProj] = React.useState(-1);
  const [ptProjName, setPtProjName] = React.useState('');
  const [ptShortName, setPtShortName] = React.useState('');
  const [hasParatext, setHasParatext] = React.useState(false);
  const [hasPermission, setHasPermission] = React.useState(false);
  const [ptPermission, setPtPermission] = React.useState('None');
  const [myProject, setMyProject] = React.useState('');
  const [project] = useGlobal('project');
  const [keyMap] = useGlobal('keyMap');
  const [user] = useGlobal('user');

  const [paratextIntegration, setParatextIntegration] = React.useState('');
  const [confirmItem, setConfirmItem] = React.useState<string | null>(null);
  const [memory] = useGlobal('memory');
  const [errorReporter] = useGlobal('errorReporter');
  const [message, setMessage] = React.useState(<></>);
  const [busy] = useGlobal('remoteBusy');
  const [ptPath, setPtPath] = React.useState('');
  const [syncing, setSyncing] = React.useState(false);

  const showMessage = (title: string, msg: string) => {
    setMessage(
      <span>
        {title}
        <br />
        {msg}
      </span>
    );
  };
  const handleMessageReset = () => () => {
    setMessage(<></>);
  };
  const getProject = () => {
    const projfind: Project[] = projects.filter((p) => p.id === project);
    return projfind.length > 0 ? projfind[0] : undefined;
  };
  const addParatextIntegration = async (): Promise<string> => {
    const int = {
      type: 'integration',
      attributes: {
        name: 'paratext',
        url: '',
      },
    } as Integration;
    schema.initializeRecord(int);
    await memory.update((t: TransformBuilder) => t.addRecord(int));
    return int.id;
  };
  const getParatextIntegration = (local: string) => {
    const intfind: Integration[] = integrations.filter(
      (i) => i.attributes && i.attributes.name === local
    );
    if (intfind.length === 0)
      addParatextIntegration().then((res) => setParatextIntegration(res));
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
    schema.initializeRecord(pi);
    await memory.update((t: TransformBuilder) => [
      t.addRecord(pi),
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
        remoteIdNum('user', user, keyMap)
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
    ].ProjectIds.filter((p) => p !== remoteIdNum('project', project, keyMap));
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
    setPtShortName(paratext_projects[index].ShortName);
    if (index >= 0) {
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
        remoteIdNum('project', project, keyMap)
      );
    }
  };
  const handleSync = () => {
    setSyncing(true);
    syncProject(
      auth,
      remoteIdNum('project', project, keyMap),
      errorReporter,
      t.syncPending
    );
  };
  const handleLocalSync = async () => {
    setSyncing(true);
    showMessage('', t.syncPending);
    await localSync(
      project,
      ptShortName,
      passages,
      memory,
      remoteIdNum('user', user, memory.keyMap)
    );
    showMessage('', t.syncComplete);
    resetCount();
    setSyncing(false);
  };

  const handleRemoveIntegration = () => {
    setConfirmItem(t.paratextAssociation);
  };

  const handleDeleteConfirmed = () => {
    updateProjectIntegration(getProjectIntegration(paratextIntegration), '');
    setConfirmItem(null);
    removeProjectFromParatextList(ptProj);
    setPtProj(-1);
    setPtProjName('');
    setPtShortName('');
  };
  const handleDeleteRefused = () => setConfirmItem(null);
  const getProjectLabel = (): string => {
    if (isElectron) return t.selectProject;
    return online
      ? paratext_projectsStatus && paratext_projectsStatus.complete
        ? !paratext_projectsStatus.errStatus
          ? paratext_projects.length > 0
            ? t.selectProject
            : formatWithLanguage(t.noProject)
          : translateError(paratext_projectsStatus)
        : t.projectsPending
      : t.offline;
  };
  const findConnectedProject = () => {
    let index = paratext_projects.findIndex(
      (p) => p.ProjectIds.indexOf(remoteIdNum('project', project, keyMap)) >= 0
    );
    setPtProj(index);
    setPtProjName(index >= 0 ? paratext_projects[index].Name : '');
    if (pRef && pRef.current) pRef.current.focus();
  };
  const translateError = (err: IAxiosStatus): string => {
    if (err.errStatus === 401) return t.expiredToken;
    if (err.errStatus === 500) {
      if (err.errMsg.includes('401')) return t.expiredParatextToken;

      return t.invalidParatextLogin;
    }
    return err.errMsg;
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
    Online((result) => setOnline(result), auth);
    if (isElectron) getParatextDataPath().then((val) => setPtPath(val));
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  useEffect(() => {
    if (project !== myProject) {
      setPtProj(-1);
      setPtProjName('');
      setPtShortName('');
      resetProjects();
      resetCount();
      setMyProject(project);
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [project]);

  useEffect(() => {
    resetCount();
  }, [passages, resetCount]);

  /* do this once */
  useEffect(() => {
    if (integrations.length > 0 && !paratextIntegration) {
      resetSync();
      getParatextIntegration(isElectron ? 'paratextLocal' : 'paratext');
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [integrations, paratextIntegration]);

  useEffect(() => {
    if (!paratext_countStatus) {
      isElectron
        ? getLocalCount(passages, project, memory, t.countPending)
        : getCount(
            auth,
            remoteIdNum('project', project, keyMap),
            errorReporter,
            t.countPending
          );
    } else if (paratext_countStatus.errStatus)
      showMessage(t.countError, translateError(paratext_countStatus));

    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [paratext_count, paratext_countStatus]);

  useEffect(() => {
    if (!isElectron) {
      if (!paratext_usernameStatus) {
        getUserName(auth, errorReporter, t.usernamePending);
      } else if (paratext_usernameStatus.errStatus)
        showMessage(t.usernameError, translateError(paratext_usernameStatus));

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
        if (isElectron) {
          getParatextDataPath().then((ptPath) =>
            getLocalProjects(ptPath, t.projectsPending, langTag)
          );
        } else {
          getProjects(auth, t.projectsPending, errorReporter, langTag);
        }
      } else {
        if (paratext_projectsStatus.errStatus) {
          showMessage(t.projectError, translateError(paratext_projectsStatus));
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
        showMessage(t.syncError, translateError(paratext_syncStatus));
        setSyncing(false);
      } else if (paratext_syncStatus.statusMsg !== '') {
        showMessage('', paratext_syncStatus.statusMsg);
      }
      if (paratext_syncStatus.complete) {
        resetCount();
        setSyncing(false);
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
      <ExpansionPanel defaultExpanded={!isElectron} disabled={isElectron}>
        <ExpansionPanelSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls={t.paratext}
          id={t.paratext}
        >
          <Typography className={classes.heading}>{t.paratext}</Typography>
        </ExpansionPanelSummary>
        <ExpansionPanelDetails className={classes.panel}>
          <List dense component="div">
            <ListItem key="online">
              <ListItemAvatar>
                <Avatar className={classes.avatar}>
                  {!online || <CheckIcon />}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={t.questionOnline}
                secondary={online ? t.yes : t.no}
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
                    : online
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
                    : online
                    ? t.no
                    : t.offline
                }
              />
            </ListItem>
            <ListItem key="ready">
              <ListItemAvatar>
                <Avatar className={classes.avatar}>
                  {paratext_count === 0 || <CheckIcon />}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={t.countReady}
                secondary={
                  paratext_countStatus && paratext_countStatus.complete
                    ? paratext_count
                    : t.countPending
                }
              />
            </ListItem>
          </List>

          <FormControl component="fieldset" className={classes.formControl}>
            <FormGroup>
              <FormControlLabel
                control={
                  <Button
                    key="sync"
                    aria-label={t.sync}
                    variant="contained"
                    color="primary"
                    className={classes.button}
                    disabled={
                      syncing ||
                      !online ||
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
        </ExpansionPanelDetails>
      </ExpansionPanel>
      <ExpansionPanel defaultExpanded={isElectron} disabled={!isElectron}>
        <ExpansionPanelSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls={t.paratextLocal}
          id={t.paratextLocal}
        >
          <Typography className={classes.heading}>{t.paratextLocal}</Typography>
        </ExpansionPanelSummary>
        <ExpansionPanelDetails className={classes.panel}>
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
                  {paratext_count === 0 || <CheckIcon />}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={t.countReady}
                secondary={
                  paratext_countStatus && paratext_countStatus.complete
                    ? paratext_count
                    : t.countPending
                }
              />
            </ListItem>
          </List>
          <FormControl component="fieldset" className={classes.formControl}>
            <FormGroup>
              <FormControlLabel
                control={
                  <Button
                    key="localSync"
                    aria-label={t.sync}
                    variant="contained"
                    color="primary"
                    className={classes.button}
                    disabled={
                      syncing || !ptPath || !hasPtProj || !paratext_count
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
        </ExpansionPanelDetails>
      </ExpansionPanel>
      <ExpansionPanel>
        <ExpansionPanelSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel2a-content"
          id="panel2a-header"
        >
          <Typography className={classes.heading}>{t.render}</Typography>
        </ExpansionPanelSummary>
        <ExpansionPanelDetails>
          <Typography>{'Not Implemented'}</Typography>
        </ExpansionPanelDetails>
      </ExpansionPanel>
      <ExpansionPanel disabled>
        <ExpansionPanelSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel3a-content"
          id="panel3a-header"
        >
          <Typography className={classes.heading}>{t.onestory}</Typography>
        </ExpansionPanelSummary>
      </ExpansionPanel>
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
      <SnackBar {...props} message={message} reset={handleMessageReset} />
    </div>
  );
}
const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'integration' }),
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
      getCount: actions.getCount,
      getLocalCount: actions.getLocalCount,
      syncProject: actions.syncProject,
      resetSync: actions.resetSync,
      resetCount: actions.resetCount,
      resetProjects: actions.resetProjects,
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
