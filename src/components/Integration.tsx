import React, { useEffect } from 'react';
import * as actions from '../store';
import { useGlobal } from 'reactn';
import { connect } from 'react-redux';
import { IState, IIntegrationStrings } from '../model';
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
import { withData, WithDataProps } from 'react-orbitjs';
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
import { Theme, createStyles, makeStyles } from '@material-ui/core/styles';
import DeleteIcon from '@material-ui/icons/Delete';
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
import { remoteIdNum, related, Online } from '../utils';
import Auth from '../auth/Auth';
import { bindActionCreators } from 'redux';
import ParatextProject from '../model/paratextProject';
import { QueryBuilder, TransformBuilder } from '@orbit/data';
import ProjectIntegration from '../model/projectintegration';
import Integration from '../model/integration';
import { schema } from '../schema';
import { IAxiosStatus } from '../store/AxiosStatus';
import localStrings from '../selector/localize';

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
  paratext_countStatus: IAxiosStatus;
  paratext_projects: ParatextProject[]; // state.paratext.projects,
  paratext_projectsStatus: IAxiosStatus; // state.paratext.projectsQueried,
  paratext_username: string; // state.paratext.username
  paratext_usernameStatus: IAxiosStatus;
  paratext_syncStatus: IAxiosStatus; // state.paratext.syncStatus,
  t: IIntegrationStrings;
}

interface IDispatchProps {
  getUserName: typeof actions.getUserName;
  getProjects: typeof actions.getProjects;
  getCount: typeof actions.getCount;
  syncProject: typeof actions.syncProject;
  resetSync: typeof actions.resetSync;
}
interface IRecordProps {
  projectintegrations: Array<ProjectIntegration>;
  integrations: Array<Integration>;
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
  const { getUserName, getCount, getProjects, syncProject, resetSync } = props;
  const { projectintegrations, integrations } = props;
  const classes = useStyles();

  const [online] = React.useState(Online());
  const [hasPtProj, setHasPtProj] = React.useState(false);
  const [ptProj, setPtProj] = React.useState(-1);
  const [hasParatext, setHasParatext] = React.useState(false);
  const [hasPermission, setHasPermission] = React.useState(false);
  const [ptPermission, setPtPermission] = React.useState('None');
  const [project] = useGlobal('project');
  const [keyMap] = useGlobal('keyMap');
  const [paratextIntegration, setParatextIntegration] = React.useState('');
  const [confirmItem, setConfirmItem] = React.useState<string | null>(null);
  const [memory] = useGlobal('memory');
  const [message, setMessage] = React.useState(<></>);

  const handleMessageReset = () => () => {
    setMessage(<></>);
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
  const getParatextIntegration = () => {
    const intfind: Integration[] = integrations.filter(
      i => i.attributes.name === 'paratext'
    );
    if (intfind.length === 0)
      addParatextIntegration().then(res => setParatextIntegration(res));
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
      t.updateRecord({
        type: 'projectintegration',
        id: projInt,
        attributes: {
          settings: setting,
        },
      })
    );
    return projInt;
  };
  const getProjectIntegration = (integration: string): string => {
    const projint: ProjectIntegration[] = projectintegrations.filter(
      pi =>
        related(pi, 'project') === project &&
        related(pi, 'integration') === integration &&
        pi.attributes
    );
    if (projint.length === 0) return '';
    return projint[0].id;
  };
  const handleParatextProjectChange = (e: any) => {
    console.log(e.target.value);
    var index: number = paratext_projects.findIndex(
      p => p.Name === e.target.value
    );
    setPtProj(index);
    if (index >= 0) {
      const paratextProject: ParatextProject = paratext_projects[index];
      const setting = {
        Name: paratextProject.Name,
        ParatextId: paratextProject.ParatextId,
        LanguageTag: paratextProject.LanguageTag,
        LanguageName: paratextProject.LanguageName,
      };
      var projint = getProjectIntegration(paratextIntegration);
      if (projint === '') {
        addProjectIntegration(paratextIntegration, JSON.stringify(setting));
      } else {
        updateProjectIntegration(projint, JSON.stringify(setting));
      }
      paratext_projects[index].ProjectId = remoteIdNum(
        'project',
        project,
        keyMap
      );
    }
  };
  const handleSync = () =>
    syncProject(auth, remoteIdNum('project', project, keyMap), t.syncPending);

  const handleRemoveIntegration = () => {
    setConfirmItem(t.paratextAssociation);
  };

  const handleDeleteConfirmed = () => {
    memory.update((t: TransformBuilder) =>
      t.removeRecord({
        type: 'projectintegration',
        id: getProjectIntegration(paratextIntegration),
      })
    );
    setConfirmItem(null);
    paratext_projects[ptProj].ProjectId = 0;
    setPtProj(-1);
  };
  const handleDeleteRefused = () => setConfirmItem(null);
  const getProjectLabel = (): string => {
    return online
      ? paratext_projectsStatus && paratext_projectsStatus.complete
        ? !paratext_projectsStatus.errStatus
          ? paratext_projects.length > 0
            ? t.selectProject
            : t.noProject
          : translateError(paratext_projectsStatus)
        : t.projectsPending
      : t.offline;
  };
  const findConnectedProject = () => {
    var index = paratext_projects.findIndex(
      p => p.ProjectId === remoteIdNum('project', project, keyMap)
    );
    setPtProj(index);
    setHasPtProj(index >= 0);
    if (pRef && pRef.current) pRef.current.focus();
  };
  const translateError = (err: IAxiosStatus): string => {
    if (err.errStatus === 401) return t.expiredToken;
    if (err.errStatus === 500 && err.errMsg.includes('401'))
      return t.expiredParatextToken;
    return err.errMsg;
  };
  const canEditParatextText = (role: string): boolean => {
    return role === 'pt_administrator' || role === 'pt_translator';
  };
  useEffect(() => {
    resetSync();
    getCount(auth, remoteIdNum('project', project, keyMap), t.countPending);
    getParatextIntegration();
    if (!paratext_projectsStatus.complete || paratext_projectsStatus.errStatus)
      getProjects(auth, t.projectsPending);
    if (!paratext_usernameStatus.complete || paratext_usernameStatus.errStatus)
      getUserName(auth, t.usernamePending);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  useEffect(() => {
    if (paratext_countStatus && paratext_countStatus.errStatus)
      setMessage(
        <span>
          {t.countError} {translateError(paratext_countStatus)}
        </span>
      );
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [paratext_count, paratext_countStatus]);

  useEffect(() => {
    if (paratext_usernameStatus!.errStatus)
      setMessage(
        <span>
          {t.usernameError}
          {translateError(paratext_usernameStatus)}
        </span>
      );
    setHasParatext(paratext_username !== '');
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [paratext_username, paratext_usernameStatus]);

  useEffect(() => {
    if (paratext_projectsStatus && paratext_projectsStatus.errStatus) {
      setMessage(
        <span>
          {t.projectError}
          {translateError(paratext_projectsStatus)}
        </span>
      );
    }

    if (
      paratext_projectsStatus &&
      paratext_projectsStatus.complete &&
      !paratext_projectsStatus.errStatus
    ) {
      findConnectedProject();
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [paratext_projects, paratext_projectsStatus]);

  useEffect(() => {
    if (paratext_syncStatus)
      if (paratext_syncStatus.errStatus)
        setMessage(
          <span>
            {t.syncError}
            {translateError(paratext_syncStatus)}
          </span>
        );
      else if (paratext_syncStatus.statusMsg !== '') {
        setMessage(<span>{paratext_syncStatus.statusMsg}</span>);
      }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [paratext_syncStatus]);

  useEffect(() => {
    if (ptProj > -1) {
      setPtPermission(paratext_projects[ptProj].CurrentUserRole);
      setHasPermission(
        paratext_projects[ptProj].IsConnectable &&
          canEditParatextText(paratext_projects[ptProj].CurrentUserRole)
      );
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [ptProj]);
  const pRef = React.useRef<HTMLDivElement>(null);

  return (
    <div className={classes.root}>
      <ExpansionPanel defaultExpanded>
        <ExpansionPanelSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1a-content"
          id="panel1a-header"
        >
          <Typography className={classes.heading}>{'Paratext'}</Typography>
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
                primary={t.questionProject}
                secondary={
                  <>
                    <TextField
                      ref={pRef}
                      id="select-project"
                      select
                      label={getProjectLabel()}
                      className={classes.textField}
                      value={
                        ptProj >= 0 && paratext_projects[ptProj]
                          ? paratext_projects[ptProj].Name
                          : null
                      }
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
                        ))}
                    </TextField>
                    <br />
                    <Button
                      key="removeassociation"
                      aria-label={'removeassociation'}
                      variant="contained"
                      color="primary"
                      className={classes.button}
                      disabled={!hasPtProj}
                      onClick={handleRemoveIntegration}
                    >
                      {t.removeProject}
                      <DeleteIcon className={classes.icon} />
                    </Button>
                  </>
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
                    ? paratext_usernameStatus.complete
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
                  paratext_countStatus.complete
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
      getCount: actions.getCount,
      syncProject: actions.syncProject,
      resetSync: actions.resetSync,
    },
    dispatch
  ),
});
const mapRecordsToProps = {
  projectintegrations: (q: QueryBuilder) => q.findRecords('projectintegration'),
  integrations: (q: QueryBuilder) => q.findRecords('integration'),
};

export default withData(mapRecordsToProps)(connect(
  mapStateToProps,
  mapDispatchToProps
)(IntegrationPanel) as any) as any;
