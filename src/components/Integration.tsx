import React, { useState, useEffect, useContext, useMemo } from 'react';
import * as actions from '../store';
import { useGlobal } from 'reactn';
import {
  IState,
  IIntegrationStrings,
  Project,
  ProjectD,
  Passage,
  PassageD,
  ISharedStrings,
  MediaFileD,
  ActivityStates,
  ParatextProject,
  ProjectIntegration,
  ProjectIntegrationD,
  Integration,
} from '../model';
import {
  AddRecord,
  ReplaceRelatedRecord,
  UpdateRecord,
} from '../model/baseModel';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  FormControl,
  FormGroup,
  FormControlLabel,
  FormHelperText,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  TextField,
  MenuItem,
  Box,
  SxProps,
  Checkbox,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SyncIcon from '@mui/icons-material/Sync';
import CheckIcon from '@mui/icons-material/Check';
import { useSnackBar } from '../hoc/SnackBar';
import ParatextLogo from '../control/ParatextLogo';
// import RenderLogo from '../control/RenderLogo';
import {
  remoteIdNum,
  related,
  remoteId,
  ArtifactTypeSlug,
  useArtifactType,
  useTranscription,
  findRecord,
  passageRefText,
  useOrganizedBy,
} from '../crud';
import {
  getParatextDataPath,
  useCheckOnline,
  integrationSlug,
  useDataChanges,
} from '../utils';
import { localSync } from '../business/localParatext/localSync';
import { TokenContext } from '../context/TokenProvider';
import { IAxiosStatus } from '../store/AxiosStatus';
import Memory from '@orbit/memory';
import {
  translateParatextErr,
  translateParatextError,
} from '../utils/translateParatextError';
import { PriButton, SelectExportType, StyledHeading } from '../control';
import { useOrbitData } from '../hoc/useOrbitData';
import { RecordKeyMap, StandardRecordNormalizer } from '@orbit/records';
import { useSelector } from 'react-redux';
import { integrationSelector, sharedSelector } from '../selector';
import { useDispatch } from 'react-redux';
import {
  projDefExportNumbers,
  useProjectDefaults,
} from '../crud/useProjectDefaults';

const panelProps = { flexDirection: 'column' } as SxProps;
const textFieldProps = { mx: 1, width: '600px' } as SxProps;
const formText = { fontSize: 'small' } as SxProps;
const startAlign = { alignItems: 'flex-start' } as SxProps;
const avatarProps = { color: 'green' } as SxProps;
const menuProps = { width: '300px' } as SxProps;

interface IProps {
  stopPlayer?: () => void;
  artifactType?: ArtifactTypeSlug;
  passage?: Passage;
  currentstep?: string;
  sectionArr?: [number, string][];
  setStepComplete?: (
    stepId: string,
    complete: boolean,
    psgCompleted?: any[]
  ) => Promise<void>;
  gotoNextStep?: () => void;
}

export function IntegrationPanel(props: IProps) {
  const {
    stopPlayer,
    artifactType,
    passage,
    currentstep,
    sectionArr,
    setStepComplete,
    gotoNextStep,
  } = props;
  const t: IIntegrationStrings = useSelector(integrationSelector);
  const ts: ISharedStrings = useSelector(sharedSelector);
  const bookData = useSelector((state: IState) => state.books.bookData);
  const paratext_count = useSelector((state: IState) => state.paratext.count);
  const paratext_countStatus = useSelector(
    (state: IState) => state.paratext.countStatus
  );
  const paratext_username = useSelector(
    (state: IState) => state.paratext.username
  );
  const paratext_usernameStatus = useSelector(
    (state: IState) => state.paratext.usernameStatus
  );
  const paratext_projects = useSelector(
    (state: IState) => state.paratext.projects
  );
  const paratext_projectsStatus = useSelector(
    (state: IState) => state.paratext.projectsStatus
  );
  const paratext_syncStatus = useSelector(
    (state: IState) => state.paratext.syncStatus
  );
  const dispatch = useDispatch();
  const getLocalCount = (
    mediafiles: MediaFileD[],
    plan: string,
    memory: Memory,
    errorReporter: any,
    t: IIntegrationStrings,
    artifactId: string | null,
    passageId: string | undefined
  ) =>
    dispatch(
      actions.getLocalCount(
        mediafiles,
        plan,
        memory,
        errorReporter,
        t,
        artifactId,
        passageId
      )
    );
  const getUserName = (token: string, errorReporter: any, pendingmsg: string) =>
    dispatch(actions.getUserName(token, errorReporter, pendingmsg));
  const getProjects = (
    token: string,
    pendingmsg: string,
    errorReporter: any,
    languageTag?: string
  ) =>
    dispatch(
      actions.getProjects(token, pendingmsg, errorReporter, languageTag)
    );
  const getLocalProjects = (
    ptPath: string,
    pendingmsg: string,
    projIds: {
      Name: string;
      Id: string;
    }[],
    languageTag?: string
  ) =>
    dispatch(
      actions.getLocalProjects(ptPath, pendingmsg, projIds, languageTag)
    );
  const syncProject = (
    token: string,
    projectId: number,
    artifactId: number,
    errorReporter: any,
    pendingmsg: string,
    completeMsg: string
  ) =>
    dispatch(
      actions.syncProject(
        token,
        projectId,
        artifactId,
        errorReporter,
        pendingmsg,
        completeMsg
      )
    );
  const syncPassage = (
    token: string,
    passageId: number,
    typeId: number, //0 for vernacular?
    errorReporter: any,
    pendingmsg: string,
    successmsg: string
  ) =>
    dispatch(
      actions.syncPassage(
        token,
        passageId,
        typeId,
        errorReporter,
        pendingmsg,
        successmsg
      )
    );
  const resetSync = () => dispatch(actions.resetSync());
  const resetCount = () => dispatch(actions.resetCount());
  const resetProjects = () => dispatch(actions.resetProjects());
  const resetUserName = () => dispatch(actions.resetUserName());
  const projectintegrations =
    useOrbitData<ProjectIntegrationD[]>('projectintegration');
  const integrations = useOrbitData<Integration[]>('integration');
  const projects = useOrbitData<ProjectD[]>('project');
  const passages = useOrbitData<PassageD[]>('passage');
  const mediafiles = useOrbitData<MediaFileD[]>('mediafile');
  const [connected] = useGlobal('connected');
  const [hasPtProj, setHasPtProj] = useState(false);
  const [ptProj, setPtProj] = useState(-1);
  const [ptProjId, setPtProjId] = useState('');
  const [ptShortName, setPtShortName] = useState('');
  const [hasParatext, setHasParatext] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [ptPermission, setPtPermission] = useState('None');
  const [myProject, setMyProject] = useState('');
  const [project] = useGlobal('project');
  const [user] = useGlobal('user');
  const [offline] = useGlobal('offline');
  const [offlineOnly] = useGlobal('offlineOnly');
  const [local, setLocal] = useState(offline || offlineOnly);
  const { accessToken } = useContext(TokenContext).state;
  const forceDataChanges = useDataChanges();
  const [count, setCount] = useState(-1);
  const [countMsg, setCountMsg] = useState<string | JSX.Element>();

  const [paratextIntegration, setParatextIntegration] = useState('');
  const [coordinator] = useGlobal('coordinator');
  const memory = coordinator.getSource('memory') as Memory;
  const [plan] = useGlobal('plan');

  const [errorReporter] = useGlobal('errorReporter');
  const { showMessage, showTitledMessage } = useSnackBar();
  const [busy] = useGlobal('remoteBusy');
  const [ptPath, setPtPath] = useState('');
  const syncing = React.useRef<boolean>(false);
  const setSyncing = (state: boolean) => (syncing.current = state);
  const checkOnline = useCheckOnline('Integration');
  const [exportTypes, setExportTypes] = useState([
    ArtifactTypeSlug.Vernacular,
    ArtifactTypeSlug.WholeBackTranslation,
    ArtifactTypeSlug.PhraseBackTranslation,
  ]);
  const [exportType, setExportType] = useState(exportTypes[0]);
  const { getTypeId } = useArtifactType();
  const getTranscription = useTranscription(false, ActivityStates.Approved);
  const intSave = React.useRef('');
  const { getOrganizedBy } = useOrganizedBy();
  const { getProjectDefault, setProjectDefault } = useProjectDefaults();

  const [exportNumbers, setExportNumbers] = useState(
    JSON.parse(getProjectDefault(projDefExportNumbers) ?? false) as boolean
  );

  const handleExportSectionNumbers = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const checked = event.target.checked;
    setExportNumbers(checked);
    setProjectDefault(projDefExportNumbers, JSON.stringify(checked));
  };

  const TranslateSyncError = (err: IAxiosStatus): JSX.Element => {
    return <span>{translateParatextError(err, ts)}</span>;
  };

  const getProject = () => {
    if (!project) return undefined;
    const projfind: Project[] = projects.filter((p) => p?.id === project);
    return projfind.length > 0 ? projfind[0] : undefined;
  };
  const addParatextIntegration = async (local: string): Promise<string> => {
    const int: Integration = {
      type: 'integration',
      attributes: {
        name: local,
        url: '',
      },
    };
    const rn = new StandardRecordNormalizer({ schema: memory.schema });
    let rec = rn.normalizeRecord(int);
    await memory.update((t) => t.addRecord(rec));
    return rec.id;
  };
  const getParatextIntegration = (local: string) => {
    const intfind: Integration[] = integrations.filter(
      (i) =>
        i.attributes?.name === local &&
        Boolean(i?.keys?.remoteId) !== offlineOnly
    );
    if (intfind.length === 0)
      addParatextIntegration(local).then((res) => setParatextIntegration(res));
    else setParatextIntegration(intfind[0].id as string);
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
    await memory.update((t) => [
      ...AddRecord(t, pi, user, memory),
      ...ReplaceRelatedRecord(t, pi, 'project', 'project', project),
      ...ReplaceRelatedRecord(t, pi, 'integration', 'integration', integration),
    ]);
    return pi.id;
  };
  const updateProjectIntegration = (
    projInt: string,
    setting: string
  ): string => {
    var pi = findRecord(
      memory,
      'projectintegration',
      projInt
    ) as ProjectIntegrationD;
    if (pi) {
      pi.attributes.settings = setting;
      memory.update((t) => UpdateRecord(t, pi, user));
    }
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
    return projint[0].id as string;
  };

  const handleParatextProjectChange = (e: any) => {
    let index: number = paratext_projects.findIndex(
      (p) => p.ParatextId === e.target.value
    );

    setPtProj(index);
    setPtProjId(e.target.value);
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
      const strSettings = JSON.stringify(setting);
      if (projint === '') {
        addProjectIntegration(paratextIntegration, strSettings);
      } else {
        updateProjectIntegration(projint, strSettings);
      }
    }
  };
  const handleSync = () => {
    if (stopPlayer) stopPlayer();
    setSyncing(true);
    var typeId = getTypeId(exportType)
      ? remoteIdNum(
          'artifacttype',
          getTypeId(exportType) || '',
          memory.keyMap as RecordKeyMap
        )
      : 0;
    if (passage !== undefined) {
      //from detail screen so just do passage
      syncPassage(
        accessToken || '',
        remoteIdNum(
          'passage',
          passage.id as string,
          memory.keyMap as RecordKeyMap
        ),
        typeId,
        errorReporter,
        t.syncPending,
        t.syncComplete
      );
    } else {
      syncProject(
        accessToken || '',
        remoteIdNum('project', project, memory.keyMap as RecordKeyMap),
        typeId,
        errorReporter,
        t.syncPending,
        t.syncComplete
      );
    }
  };
  const handleLocalSync = async () => {
    if (stopPlayer) stopPlayer();
    setSyncing(true);
    showMessage(t.syncPending);
    var err = await localSync({
      plan,
      ptProjName: ptShortName,
      mediafiles,
      passages,
      memory,
      userId: user,
      passage,
      exportNumbers,
      sectionArr,
      artifactId: getTypeId(exportType),
      getTranscription,
    });
    showMessage(translateParatextErr(err, ts) || t.syncComplete);
    resetCount();
    if (setStepComplete && currentstep && !err) {
      await setStepComplete(currentstep, true);
      if (gotoNextStep) gotoNextStep();
    }
    setSyncing(false);
  };

  const getProjectLabel = (): string => {
    if (local) return t.selectProject;
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
    if (paratext_projects.length === 0) return;
    let curInt = projectintegrations.filter(
      (pi) =>
        related(pi, 'integration') === paratextIntegration &&
        pi.attributes &&
        related(pi, 'project') === project
    ) as ProjectIntegration[];
    let index = -1;
    if (!offline) curInt = curInt.filter((i) => Boolean(i?.keys?.remoteId));
    if (curInt.length > 0) {
      const settings = JSON.parse(curInt[0].attributes.settings);
      index = paratext_projects.findIndex((p) => {
        return p.ParatextId === settings.ParatextId;
      });
    }
    if (curInt.length === 0 || index === -1) {
      index = paratext_projects.findIndex(
        (p) =>
          Boolean(p.BaseProject) ===
          (exportType !== ArtifactTypeSlug.Vernacular)
      );
      if (
        index >= 0 &&
        intSave.current !== paratext_projects[index].ParatextId &&
        paratextIntegration
      ) {
        intSave.current = paratext_projects[index].ParatextId;
        const setting = {
          Name: paratext_projects[index].Name,
          ParatextId: paratext_projects[index].ParatextId,
          LanguageTag: paratext_projects[index].LanguageTag,
          LanguageName: paratext_projects[index].LanguageName,
        };
        const strSettings = JSON.stringify(setting);
        if (curInt.length > 0) {
          updateProjectIntegration(curInt[0].id as string, strSettings);
        } else addProjectIntegration(paratextIntegration, strSettings);
      }
    }
    setPtProj(index);
    setPtProjId(index >= 0 ? paratext_projects[index].ParatextId : '');
    setPtShortName(index >= 0 ? paratext_projects[index].ShortName : '');
    if (pRef && pRef.current) pRef.current.focus();
  };

  const formatWithLanguage = (replLang: string): string => {
    let proj = getProject();
    let language = proj && proj.attributes ? proj.attributes.languageName : '';
    return replLang.replace('{lang0}', language || '');
  };

  const isFirstPassage = useMemo(() => {
    const sectionId = related(passage, 'section');
    const sectionPassages = passages
      .filter(
        (p) =>
          related(p, 'section') === sectionId &&
          !related(p, 'passagetype') &&
          Boolean(p?.attributes)
      )
      .sort((i, j) => i.attributes.sequencenum - j.attributes.sequencenum);
    return (
      sectionPassages.length > 0 &&
      sectionPassages[0]?.id &&
      sectionPassages[0].id === passage?.id
    );
  }, [passage, passages]);

  useEffect(() => {
    setLocal(offline || offlineOnly);
  }, [offline, offlineOnly]);

  useEffect(() => {
    if (artifactType) {
      setExportType(artifactType);
      setExportTypes([artifactType]);
    }
  }, [artifactType]);

  useEffect(() => {
    if (local) {
      getParatextDataPath().then((val) => setPtPath(val));
    } else {
      //force a current check -- will set connected
      checkOnline((result) => {});
    }
    resetProjects();
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  useEffect(() => {
    setHasParatext(false);
    resetUserName();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (connected && !hasParatext) resetUserName();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, hasParatext]);

  useEffect(() => {
    if (project && project !== myProject) {
      setPtProj(-1);
      setPtProjId('');
      setPtShortName('');
      resetProjects();
      resetCount();
      setMyProject(project);
      resetSync();
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [project]);

  useEffect(() => {
    resetCount();
    setTimeout(() => {
      if (plan)
        getLocalCount(
          mediafiles,
          plan,
          memory,
          errorReporter,
          t,
          getTypeId(exportType),
          passage?.id
        );
    }, 500);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediafiles, plan, exportType]);

  useEffect(() => {
    if (integrations.length > 0) {
      getParatextIntegration(integrationSlug(exportType, offlineOnly));
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [integrations, exportType]);

  useEffect(() => {
    if (paratext_countStatus) {
      if (paratext_countStatus.errStatus) {
        showTitledMessage(
          t.countError,
          translateParatextError(paratext_countStatus, ts)
        );
        setCountMsg(translateParatextError(paratext_countStatus, ts));
      } else if (paratext_countStatus.complete) {
        setCount(paratext_count);
        resetCount();
      }
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [paratext_countStatus]);

  useEffect(() => {
    if (!local) {
      if (!paratext_usernameStatus) {
        getUserName(accessToken || '', errorReporter, t.usernamePending);
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
        if (local) {
          const localprojs = projectintegrations.filter(
            (pi) =>
              related(pi, 'integration') === paratextIntegration &&
              pi.attributes
          ) as ProjectIntegration[];
          var projIds = localprojs.map((pi) => {
            var settings = JSON.parse(pi.attributes.settings);
            return {
              Name: settings.Name,
              Id:
                remoteId(
                  'project',
                  related(pi, 'project'),
                  memory.keyMap as RecordKeyMap
                ) || related(pi, 'project'),
            };
          });
          getParatextDataPath().then((ptPath) => {
            getLocalProjects(ptPath, t.projectsPending, projIds, langTag);
          });
        } else {
          getProjects(
            accessToken || '',
            t.projectsPending,
            errorReporter,
            langTag
          );
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
  }, [busy, paratext_projects, paratext_projectsStatus, paratextIntegration]);

  useEffect(() => {
    if (paratext_projectsStatus?.complete) {
      if (project) findConnectedProject();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectintegrations, paratext_projects, paratextIntegration, project]);

  useEffect(() => {
    if (paratext_syncStatus) {
      if (paratext_syncStatus.errStatus) {
        showTitledMessage(t.syncError, TranslateSyncError(paratext_syncStatus));
        resetSync();
        setSyncing(false);
      } else if (paratext_syncStatus.statusMsg !== '') {
        showMessage(paratext_syncStatus.statusMsg);
      }
      if (paratext_syncStatus.complete) {
        if (!paratext_syncStatus.errStatus) setCount(0); //force this to 0 now...if wrong...will reset eventually with new count
        resetCount();
        resetSync();
        setSyncing(false);
        forceDataChanges();
        if (setStepComplete && currentstep && !paratext_syncStatus.errStatus) {
          setStepComplete(currentstep, true).then(() => {
            if (gotoNextStep) gotoNextStep();
          });
        }
      }
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [paratext_syncStatus]);

  useEffect(() => {
    setHasPtProj(ptProj >= 0);

    if (ptProj >= 0 && paratext_projects && paratext_projects.length > ptProj) {
      setPtPermission(paratext_projects[ptProj].CurrentUserRole);
      setHasPermission(
        paratext_projects[ptProj].IsConnectable //&& built in to isConnectable
        //canEditParatextText(paratext_projects[ptProj].CurrentUserRole)
      );
    } else {
      setHasPermission(false);
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [ptProj, paratext_projects]);
  const pRef = React.useRef<HTMLDivElement>(null);

  return (
    <Box sx={{ width: '100%' }}>
      {isFirstPassage && (
        <FormControlLabel
          sx={{ m: 1 }}
          control={
            <Checkbox
              checked={exportNumbers}
              onChange={handleExportSectionNumbers}
              value="exportNumbers"
            />
          }
          label={t.exportSectionNumbers.replace('{0}', getOrganizedBy(true))}
        />
      )}
      <Accordion id="int-online" defaultExpanded={!local} disabled={local}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls={t.paratext}
          id={t.paratext}
        >
          <StyledHeading>
            <ParatextLogo />
            {'\u00A0' + t.paratext}
          </StyledHeading>
        </AccordionSummary>
        <AccordionDetails sx={panelProps}>
          <List id="onl-criteria" dense component="div">
            <ListItem id="onlineexporttype" key="export-type">
              <ListItemAvatar>
                <Avatar sx={avatarProps}>
                  <CheckIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <SelectExportType
                    exportType={exportType}
                    exportTypes={exportTypes}
                    setExportType={setExportType}
                  />
                }
              />
            </ListItem>
            <ListItem key="connected">
              <ListItemAvatar>
                <Avatar sx={avatarProps}>
                  <>{!connected || <CheckIcon />}</>
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={t.questionOnline}
                secondary={connected ? t.yes : t.no}
              />
            </ListItem>
            <ListItem key="hasProj" sx={startAlign}>
              <ListItemAvatar>
                <Avatar sx={avatarProps}>
                  <>{!hasPtProj || <CheckIcon />}</>
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                disableTypography
                primary={
                  <Typography>
                    {formatWithLanguage(t.questionProject)}
                  </Typography>
                }
                secondary={
                  <TextField
                    ref={pRef}
                    id="select-project"
                    select
                    label={getProjectLabel()}
                    sx={textFieldProps}
                    value={
                      paratext_projects.find((p) => p.ParatextId === ptProjId)
                        ? ptProjId
                        : ''
                    }
                    onChange={handleParatextProjectChange}
                    SelectProps={{
                      MenuProps: {
                        sx: menuProps,
                      },
                    }}
                    InputProps={{ sx: formText }}
                    InputLabelProps={{ sx: formText }}
                    margin="normal"
                    variant="filled"
                    required={true}
                  >
                    {paratext_projects
                      .sort((i, j) => (i.ShortName <= j.ShortName ? -1 : 1))
                      .map((option: ParatextProject) => (
                        <MenuItem
                          key={option.ParatextId}
                          value={option.ParatextId}
                        >
                          {`${option.ShortName ? option.ShortName + '/' : ''}${
                            option.Name
                          } (${option.LanguageTag})`}
                        </MenuItem>
                      ))}
                  </TextField>
                }
              />
            </ListItem>
            <ListItem key="hasParatext">
              <ListItemAvatar>
                <Avatar sx={avatarProps}>
                  <>{!hasParatext || <CheckIcon />}</>
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
                <Avatar sx={avatarProps}>
                  <>{!hasPermission || <CheckIcon />}</>
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
                <Avatar sx={avatarProps}>
                  <>{count <= 0 || <CheckIcon />}</>
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={t.countReady}
                secondary={
                  Boolean(countMsg)
                    ? countMsg
                    : count === 1 && passage
                    ? passageRefText(passage, bookData)
                    : count >= 0
                    ? count
                    : t.countPending
                }
              />
            </ListItem>
          </List>

          <FormControl component="fieldset" sx={{ m: 3 }}>
            <FormGroup>
              <FormControlLabel
                control={
                  <PriButton
                    id="IntWebSync"
                    key="sync"
                    aria-label={t.sync}
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
                    <SyncIcon sx={{ ml: 1 }} />
                  </PriButton>
                }
                label=""
              />
              <FormHelperText>{t.allCriteria}</FormHelperText>
            </FormGroup>
          </FormControl>
        </AccordionDetails>
      </Accordion>
      <Accordion id="int-offln" defaultExpanded={local} disabled={!local}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls={t.paratextLocal}
          id={t.paratextLocal}
        >
          <StyledHeading>
            <ParatextLogo />
            {'\u00A0' + t.paratextLocal}
          </StyledHeading>
        </AccordionSummary>
        <AccordionDetails sx={panelProps}>
          <List id="offln-criteria" dense component="div">
            <ListItem key="export-type">
              <ListItemAvatar>
                <Avatar sx={avatarProps}>
                  <CheckIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <SelectExportType
                    exportType={exportType}
                    exportTypes={exportTypes}
                    setExportType={setExportType}
                  />
                }
              />
            </ListItem>
            <ListItem key="installed">
              <ListItemAvatar>
                <Avatar sx={avatarProps}>
                  <>{!ptPath || <CheckIcon />}</>
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={t.questionInstalled}
                secondary={ptPath ? t.yes : t.no}
              />
            </ListItem>
            <ListItem key="hasLocalProj" sx={startAlign}>
              <ListItemAvatar>
                <Avatar sx={avatarProps}>
                  <>{!hasPtProj || <CheckIcon />}</>
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                disableTypography
                primary={
                  <Typography>
                    {formatWithLanguage(t.questionProject)}
                  </Typography>
                }
                secondary={
                  <TextField
                    ref={pRef}
                    id="select-project"
                    select
                    label={getProjectLabel()}
                    sx={textFieldProps}
                    value={
                      paratext_projects.find((p) => p.ParatextId === ptProjId)
                        ? ptProjId
                        : ''
                    }
                    onChange={handleParatextProjectChange}
                    SelectProps={{
                      MenuProps: {
                        sx: menuProps,
                      },
                    }}
                    InputProps={{ sx: formText }}
                    InputLabelProps={{ sx: formText }}
                    margin="normal"
                    variant="filled"
                    required={true}
                  >
                    {paratext_projects
                      .sort((i, j) => (i.ShortName <= j.ShortName ? -1 : 1))
                      .map((option: ParatextProject) => (
                        <MenuItem
                          key={option.ParatextId}
                          value={option.ParatextId}
                        >
                          {`${option.ShortName}/${option.Name} (${option.LanguageName}-${option.LanguageTag})`}
                        </MenuItem>
                      ))}
                  </TextField>
                }
              />
            </ListItem>
            <ListItem key="localReady">
              <ListItemAvatar>
                <Avatar sx={avatarProps}>
                  <>{count <= 0 || <CheckIcon />}</>
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={t.countReady}
                secondary={
                  Boolean(countMsg)
                    ? countMsg
                    : count === 1 && passage
                    ? passageRefText(passage, bookData)
                    : count >= 0
                    ? count
                    : t.countPending
                }
              />
            </ListItem>
          </List>
          <FormControl component="fieldset" sx={{ m: 3 }}>
            <FormGroup>
              <FormControlLabel
                control={
                  <PriButton
                    id="IntLocalSync"
                    key="localSync"
                    aria-label={t.sync}
                    disabled={
                      syncing.current ||
                      !ptPath ||
                      !hasPtProj ||
                      !paratext_count
                    }
                    onClick={handleLocalSync}
                  >
                    {t.sync}
                    <SyncIcon sx={{ ml: 1 }} />
                  </PriButton>
                }
                label=""
              />
              <FormHelperText>{t.allCriteria}</FormHelperText>
            </FormGroup>
          </FormControl>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}

export default IntegrationPanel;
