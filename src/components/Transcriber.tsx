import React, {
  useEffect,
  useState,
  useContext,
  useRef,
  CSSProperties,
  useMemo,
  useCallback,
  useLayoutEffect,
} from 'react';
import { useGlobal } from '../context/GlobalContext';
import { useParams } from 'react-router-dom';
import { Allotment } from 'allotment';
import 'allotment/dist/style.css';
import Confirm from './AlertDialog';
import {
  MediaFile,
  Project,
  ActivityStates,
  Passage,
  PassageD,
  Section,
  IState,
  Integration,
  ProjectIntegration,
  IActivityStateStrings,
  IVProjectStrings,
} from '../model';
import { Grid, Paper, Typography, IconButton } from '@mui/material';
import { StyledTextAreaAudosize } from '../control/WebFontStyles';
import useTodo from '../context/useTodo';
import PullIcon from '@mui/icons-material/GetAppOutlined';
import {
  AltButton,
  formatTime,
  GrowingDiv,
  LightTooltip,
  PriButton,
} from '../control';
import TranscribeReject from './TranscribeReject';
import { useSnackBar } from '../hoc/SnackBar';
import {
  related,
  FontData,
  getFontData,
  remoteIdNum,
  UpdateMediaStateOps,
  AddPassageStateChangeToOps,
  remoteId,
  ArtifactTypeSlug,
  useArtifactType,
  findRecord,
  useOrgDefaults,
  useRole,
  GetUser,
} from '../crud';
import {
  insertAtCursor,
  logError,
  Severity,
  currentDateTime,
  getParatextDataPath,
  refMatch,
  integrationSlug,
  getSegments,
  NamedRegions,
  updateSegments,
  useWaitForRemoteQueue,
  getSortedRegions,
} from '../utils';
import { isElectron } from '../api-variable';
import { TokenContext } from '../context/TokenProvider';
import { debounce } from 'lodash';
import { AllDone } from './AllDone';
import { LastEdit } from '../control';
import { UpdateRecord, UpdateRelatedRecord } from '../model/baseModel';
import * as action from '../store';
import { translateParatextError } from '../utils/translateParatextError';
import TranscribeAddNote from './TranscribeAddNote';
import PassageHistory from './PassageHistory';
import { HotKeyContext } from '../context/HotKeyContext';
import TaskFlag from './TaskFlag';
import Spelling from './Spelling';
import { UnsavedContext } from '../context/UnsavedContext';
import { activitySelector, vProjectSelector } from '../selector';
import { shallowEqual, useSelector } from 'react-redux';
import usePassageDetailContext from '../context/usePassageDetailContext';
import { IRegionParams } from '../crud/useWavesurferRegions';
import PassageDetailPlayer, {
  SaveSegments,
} from './PassageDetail/PassageDetailPlayer';
import { PlayInPlayer } from '../context/PassageDetailContext';
import Settings from '@mui/icons-material/Settings';
import {
  EditorSettings,
  IProjectDialog,
  initProjectState,
} from './Team/ProjectDialog';
import BigDialog from '../hoc/BigDialog';
import { useOrbitData } from '../hoc/useOrbitData';
import {
  InitializedRecord,
  RecordTransformBuilder,
  RecordOperation,
  RecordKeyMap,
} from '@orbit/records';
import { useDispatch } from 'react-redux';
import { PassageTypeEnum } from '../model/passageType';
import { AllotmentWrapper } from '../control/AllotmentWrapper';

//import useRenderingTrace from '../utils/useRenderingTrace';

const HISTORY_KEY = 'F7,CTRL+7';
const INIT_PLAYER_HEIGHT = 180;

interface IProps {
  defaultWidth: number;
  stepSettings?: string;
  hasChecking?: boolean;
  setComplete?: (complete: boolean) => void;
  onReopen?: () => void;
  onReject?: (reason: string) => void;
  onReloadPlayer?: (mediafile: MediaFile) => void;
}

interface ITrans {
  transcription: string | undefined;
  position: number;
}

export function Transcriber(props: IProps) {
  const {
    stepSettings,
    hasChecking,
    setComplete,
    onReopen,
    onReject,
    onReloadPlayer,
  } = props;
  const paratext_textStatus = useSelector(
    (state: IState) => state.paratext.textStatus
  );
  const paratext_username = useSelector(
    (state: IState) => state.paratext.username
  );
  const paratext_usernameStatus = useSelector(
    (state: IState) => state.paratext.usernameStatus
  );
  const dispatch = useDispatch();
  const resetParatextText = () => dispatch(action.resetParatextText());
  const getUserName = (token: string, errorReporter: any, msg: string) =>
    dispatch(action.getUserName(token, errorReporter, msg));
  const getParatextText = (
    token: string,
    passageId: number,
    artifactId: string | null,
    errorReporter: any,
    pendingmsg: string
  ) =>
    dispatch(
      action.getParatextText(
        token,
        passageId,
        artifactId,
        errorReporter,
        pendingmsg
      )
    );
  const getParatextTextLocal = (
    ptPath: string,
    passage: Passage,
    ptProjName: string,
    errorReporter: any,
    pendingmsg: string
  ) =>
    dispatch(
      action.getParatextTextLocal(
        ptPath,
        passage,
        ptProjName,
        errorReporter,
        pendingmsg
      )
    );
  const {
    rowData,
    index,
    transcriberStr,
    sharedStr,
    transSelected,
    setTransSelected,
    allDone,
    artifactId,
  } = useTodo();
  const integrations = useOrbitData<Integration[]>('integration');
  const projintegrations =
    useOrbitData<ProjectIntegration[]>('projectintegration');

  const { slug } = useParams();
  const { section, passage, mediafile, state, role } = rowData[index] || {
    section: {} as Section,
    passage: {} as Passage,
    mediafile: undefined,
    state: '',
    role: '',
  };

  const { toolChanged, saveCompleted } = useContext(UnsavedContext).state;
  const [memory] = useGlobal('memory');
  const [offline] = useGlobal('offline');
  const [offlineOnly] = useGlobal('offlineOnly');
  const [project] = useGlobal('project');
  const [projType] = useGlobal('projType');
  const [user] = useGlobal('user');
  const [organization] = useGlobal('organization');
  const [errorReporter] = useGlobal('errorReporter');
  const { accessToken } = useContext(TokenContext).state;
  const [assigned, setAssigned] = useState('');
  const [projData, setProjData] = useState<FontData>();
  const [suggestedSegs, setSuggestedSegs] = useState<string>();
  const verseSegs = useRef<string>();
  const playedSecsRef = useRef<number>(0);
  const segmentsRef = useRef<string>();
  const stateRef = useRef<string>(state);
  const [transcribing] = useState(
    state === ActivityStates.Transcribing ||
      state === ActivityStates.TranscribeReady
  );

  const [showSettings, setShowSettings] = useState(false);
  const [settingsState, setSettingsState] = useState<IProjectDialog>();
  const vProjectStrings: IVProjectStrings = useSelector(
    vProjectSelector,
    shallowEqual
  );
  const [textValue, setTextValue] = useState('');
  const [lastSaved, setLastSaved] = useState('');
  const [defaultPosition, setDefaultPosition] = useState(0.0);
  const waitForRemoteQueue = useWaitForRemoteQueue();
  const { showMessage } = useSnackBar();
  const showHistoryRef = useRef(false);
  const [showHistory, setShowHistoryx] = useState(false);
  const [rejectVisible, setRejectVisible] = useState(false);
  const [addNoteVisible, setAddNoteVisible] = useState(false);
  const [hasParatextName, setHasParatextName] = useState(false);
  const [noParatext, setNoParatext] = useState(false);
  const [paratextProject, setParatextProject] = React.useState('');
  const [paratextIntegration, setParatextIntegration] = React.useState('');
  const transcriptionIn = React.useRef<string>();
  const saving = React.useRef(false);
  const {
    toolsChanged,
    saveRequested,
    clearRequested,
    clearCompleted,
    isChanged,
  } = useContext(UnsavedContext).state;
  const [changed, setChanged] = useState(false);
  const [confirm, setConfirm] = useState<ITrans>();
  const transcriptionRef = React.useRef<any>(null);
  const playingRef = useRef<Boolean>();
  const mediaRef = useRef<MediaFile>({} as MediaFile);
  const autosaveTimer = React.useRef<NodeJS.Timeout>();
  const { subscribe, unsubscribe } = useContext(HotKeyContext).state;
  const t = transcriberStr;
  const {
    loading,
    playing,
    playerSize,
    setPlayerSize,
    chooserSize,
    pdBusy,
    playerMediafile,
    setSelected,
    discussionSize,
  } = usePassageDetailContext();
  const [boxHeight, setBoxHeight] = useState(
    discussionSize.height - (playerSize + 200)
  );
  const [maxPlayerSize, setMaxPlayerSize] = useState(
    (discussionSize.height - chooserSize) / 2
  );
  const [style, setStyle] = useState({
    cursor: 'default',
  });
  const transcribeDefaultParams = {
    silenceThreshold: 0.004,
    timeThreshold: 0.02,
    segLenThreshold: 0.5,
  };
  const { userIsAdmin } = useRole();
  const [segParams, setSegParams] = useState(transcribeDefaultParams);

  const { getOrgDefault, setOrgDefault, canSetOrgDefault } = useOrgDefaults();

  const [artifactTypeSlug, setArtifactTypeSlug] = useState(slug);
  const { slugFromId } = useArtifactType();

  const [textAreaStyle, setTextAreaStyle] = useState<CSSProperties>({
    overflow: 'auto',
    backgroundColor: '#cfe8fc',
    height: boxHeight,
    width: '98hu',
    fontFamily: projData?.fontFamily,
    fontSize: projData?.fontSize,
    direction: projData?.fontDir as any,
    cursor: 'default',
    resize: 'none',
  });
  const ta: IActivityStateStrings = useSelector(activitySelector, shallowEqual);
  const toolId = 'transcriber';
  /* debug what props are changing to force renders
  useRenderingTrace(
    'Transcriber',
    {
      ...props,
      memory,
      offline,
      project,
      plan,
      user,
      orgRole,
      errorReporter,
      busy,
      assigned,
      changed,
      projData,
      fontStatus,
      transcribing,
      height,
      boxHeight,
      width,
      textValue,
      lastSaved,
      defaultPosition,
      showHistory,
      rejectVisible,
      addNoteVisible,
      hasParatextName,
      paratextProject,
      paratextIntegration,
      connected,
      coordinator,
      audioBlob,
      subscribe,
      unsubscribe,
      localizeHotKey,
      playerSize,
    },
    'log'
  ); */

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  useEffect(() => {
    var def = getOrgDefault(NamedRegions.Transcription);
    if (def) setSegParams(def);
    else setSegParams(transcribeDefaultParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization]);

  useEffect(() => {
    setStyle({
      cursor: pdBusy || loading ? 'progress' : 'default',
    });
    setTextAreaStyle({
      ...textAreaStyle,
      height: boxHeight,
      fontFamily: projData?.fontFamily,
      fontSize: projData?.fontSize,
      direction: projData?.fontDir as any,
      cursor: pdBusy || loading ? 'progress' : 'default',
    });
    if (transcriptionRef.current) {
      const el = transcriptionRef?.current?.firstChild as HTMLTextAreaElement;
      if (el && !el.selectionStart && !el.selectionEnd) {
        el.selectionStart = el.selectionEnd = el.textLength;
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdBusy, loading, boxHeight, projData]);

  const handleShowHistory = () => {
    setShowHistory(!showHistoryRef.current);
    return true;
  };

  const keys = [
    { key: HISTORY_KEY, cb: handleShowHistory },
    { key: 'SHIFT+ARROWRIGHT', cb: () => false },
    { key: 'SHIFT+ARROWLEFT', cb: () => false },
  ];

  useEffect(() => {
    const getParatextIntegration = () => {
      const intfind = integrations.findIndex(
        (i) =>
          i.attributes &&
          i.attributes.name ===
            integrationSlug(artifactTypeSlug, offlineOnly) &&
          Boolean(i.keys?.remoteId) !== offlineOnly
      );
      if (intfind > -1)
        setParatextIntegration(integrations[intfind].id as string);
    };
    if (playerSize < INIT_PLAYER_HEIGHT) setPlayerSize(INIT_PLAYER_HEIGHT);
    getParatextIntegration();

    keys.forEach((k) => subscribe(k.key, k.cb));

    return () => {
      keys.forEach((k) => unsubscribe(k.key));
    };
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  useEffect(() => {
    if (!allDone) {
      keys.forEach((k) => subscribe(k.key, k.cb));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDone]);

  const allowSegment = useMemo(() => {
    return transSelected && role !== 'view'
      ? NamedRegions.Transcription
      : undefined;
  }, [transSelected, role]);

  useEffect(() => {
    const getParatextIntegration = () => {
      const intfind = integrations.findIndex(
        (i) =>
          i.attributes &&
          i.attributes.name ===
            integrationSlug(artifactTypeSlug, offlineOnly) &&
          Boolean(i.keys?.remoteId) !== offlineOnly
      );
      if (intfind > -1)
        setParatextIntegration(integrations[intfind].id as string);
    };

    getParatextIntegration();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [integrations]);

  useEffect(() => {
    if (saveRequested(toolId)) {
      handleSave();
    } else if (clearRequested(toolId)) {
      clearCompleted(toolId);
    }
    var newchanged = isChanged(toolId);
    if (newchanged !== changed) setChanged(newchanged);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [toolsChanged]);

  const handleBoxHeight = useMemo(
    () =>
      debounce((size: number) => {
        if (size !== boxHeight) {
          // console.log('write_boxheight', size);
          setBoxHeight(Math.floor(size));
        }
      }, 100),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  useLayoutEffect(() => {
    handleBoxHeight(discussionSize.height - playerSize - chooserSize + 20);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discussionSize, playerSize]);

  useLayoutEffect(() => {
    setMaxPlayerSize((discussionSize.height - chooserSize) / 2);
  }, [discussionSize, chooserSize]);

  //user changes selected...tell the task table
  useEffect(() => {
    if (transSelected !== playerMediafile?.id)
      setTransSelected(playerMediafile?.id);
    segmentsRef.current = undefined; //when they're loaded we'll be notified
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerMediafile]);

  //if task table has changed selected...tell the world
  useEffect(() => {
    if (transSelected !== undefined && transSelected !== playerMediafile?.id)
      setSelected(transSelected, PlayInPlayer.yes);
    if (!transSelected)
      showTranscription({
        transcription: undefined,
        position: 0,
      });
    else if (!saving.current) showTranscription(getTranscription());
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [transSelected]);

  useEffect(() => {
    if (mediaRef.current?.id !== mediafile?.id) {
      if (playerMediafile?.id !== mediafile?.id || '')
        setSelected(mediafile?.id || '', PlayInPlayer.yes);
    }
    if (mediafile) {
      const trans = getTranscription();
      if (
        transcriptionIn.current !== undefined &&
        (trans.transcription ?? '') !== transcriptionIn.current &&
        !saving.current
      ) {
        //if someone else changed it...let the user pick
        setConfirm(trans);
      }
      const defaultSegments = mediafile?.attributes?.segments;
      if (defaultSegments) {
        let segs = getSortedRegions(
          getSegments(NamedRegions.Verse, defaultSegments)
        );
        if (segs.length > 0) {
          const textArea = transcriptionRef.current
            .firstChild as HTMLTextAreaElement;
          if (!textArea.value || textArea.value === 'undefined') {
            let refText = segs.find(
              (s) => s?.label && refMatch(s.label)
            )?.label;
            const vNum = refText?.split(':')[1];
            if (vNum) {
              refText = `\\v ${vNum} `;
              if (textArea.value === 'undefined') textArea.value = '';
              insertAtCursor(textArea, refText);
              setTextValue(textArea.value ?? '');
            }
          }
        }
        verseSegs.current = JSON.stringify({ regions: JSON.stringify(segs) });
        setSuggestedSegs(
          getSegments(NamedRegions.Transcription, defaultSegments)
        );
      }
    }
    mediaRef.current = mediafile;
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [mediafile]);

  useEffect(() => {
    if (autosaveTimer.current === undefined) {
      launchTimer();
    } else {
      clearTimeout(autosaveTimer.current);
      launchTimer();
    }
    return () => {
      if (autosaveTimer.current) {
        clearTimeout(autosaveTimer.current);
        autosaveTimer.current = undefined;
      }
    };
    /* any variable used in save that isn't in a ref needs to be here! */
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [passage]);

  useEffect(() => {
    if (paratext_textStatus?.errStatus) {
      showMessage(translateParatextError(paratext_textStatus, sharedStr));
      resetParatextText();
    } else if (!paratext_textStatus?.complete && paratext_textStatus?.statusMsg)
      showMessage(paratext_textStatus?.statusMsg);
    else if (paratext_textStatus?.complete) {
      showTranscription({
        transcription: paratext_textStatus.statusMsg,
        position: 0,
      });
      toolChanged(toolId, true);
      save(
        mediafile.attributes.transcriptionstate ||
          ActivityStates.TranscribeReady,
        0,
        segmentsRef.current,
        t.pullParatextStatus
      );
      resetParatextText();
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [paratext_textStatus]);

  useEffect(() => {
    var thisint = projintegrations.findIndex(
      (pi) =>
        related(pi, 'project') === project &&
        related(pi, 'integration') === paratextIntegration
    );
    if (
      thisint > -1 &&
      projintegrations[thisint].attributes.settings !== '{}'
    ) {
      var settings = JSON.parse(projintegrations[thisint].attributes.settings);
      setParatextProject(settings.Name);
    } else setParatextProject('');
  }, [paratextIntegration, project, projintegrations]);

  useEffect(() => {
    const lgSettings = JSON.parse(stepSettings || '{}');
    const [language] = lgSettings?.language?.split('|') ?? ['', 'und'];
    if (artifactTypeSlug === ArtifactTypeSlug.Vernacular || !language) {
      if (project) {
        const r = findRecord(memory, 'project', project) as Project | undefined;
        if (r) getFontData(r, offline).then((data) => setProjData(data));
      }
    } else {
      const defaultFont = lgSettings?.font;
      const rtl = lgSettings?.rtl ?? false;
      const spellCheck = lgSettings?.spellCheck ?? false;
      const rec = {
        attributes: { language, spellCheck, defaultFont, rtl },
      } as Project;
      getFontData(rec, offline).then((data) => setProjData(data));
    }
    const ptCheck =
      [ArtifactTypeSlug.Retell, ArtifactTypeSlug.QandA].includes(
        (artifactTypeSlug || '') as ArtifactTypeSlug
      ) || projType.toLowerCase() !== 'scripture';
    if (ptCheck !== noParatext) setNoParatext(ptCheck);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [project, projType, artifactTypeSlug]);

  useLayoutEffect(() => {
    const newAssigned = rowData[index]?.assigned;
    if (newAssigned !== assigned) setAssigned(newAssigned);
    stateRef.current = state;
    focusOnTranscription();
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [index, rowData, state]);

  useEffect(() => {
    if (!offline) {
      if (!paratext_usernameStatus && !noParatext) {
        getUserName(accessToken || '', errorReporter, '');
      }
      setHasParatextName(paratext_username !== '');
    } else setHasParatextName(true);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [paratext_username, paratext_usernameStatus, noParatext, offline]);

  const focusOnTranscription = () => {
    if (transcriptionRef.current) transcriptionRef.current.firstChild.focus();
  };
  const handleChange = (e: any) => {
    setTextValue(e.target.value ?? '');
    toolChanged(toolId, true);
  };

  const setShowHistory = (value: boolean) => {
    showHistoryRef.current = value;
    setShowHistoryx(value);
  };

  const handlePullParatext = () => {
    if (
      !refMatch(passage?.attributes?.reference || 'Err') ||
      !passage?.attributes?.book
    ) {
      showMessage(t.invalidReference);
      return;
    }
    if (offline) {
      getParatextDataPath().then((ptPath: string) => {
        getParatextTextLocal(
          ptPath,
          passage,
          paratextProject,
          errorReporter,
          t.pullParatextStart
        );
      });
    } else {
      getParatextText(
        accessToken || '',
        remoteIdNum(
          'passage',
          passage.id as string,
          memory?.keyMap as RecordKeyMap
        ),
        artifactId &&
          (remoteId(
            'artifacttype',
            artifactId,
            memory?.keyMap as RecordKeyMap
          ) as string),
        errorReporter,
        t.pullParatextStart
      );
    }
  };

  const handleReject = () => {
    if (saving.current) {
      showMessage(t.saving);
      return;
    }
    setRejectVisible(true);
  };
  const handleRejected = useCallback(
    async (media: MediaFile, comment: string) => {
      setRejectVisible(false);
      await memory.update(
        UpdateMediaStateOps(
          media.id as string,
          passage.id as string,
          media.attributes.transcriptionstate,
          user,
          new RecordTransformBuilder(),
          [],
          memory,
          comment
        )
      );
      //todo ?? if (IsVernacular(media))
      setLastSaved(currentDateTime());
      if (onReject) onReject(media.attributes.transcriptionstate);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [passage.id, user]
  );

  const handleRejectCancel = () => setRejectVisible(false);

  const handleAddNote = useCallback(
    async (pass: PassageD) => {
      setAddNoteVisible(false);
      var ops = [] as RecordOperation[];
      AddPassageStateChangeToOps(
        new RecordTransformBuilder(),
        ops,
        pass.id,
        '',
        pass.attributes.lastComment,
        user,
        memory
      );
      await memory.update(ops);
      pass.attributes.lastComment = '';
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user]
  );
  const handleAddNoteCancel = () => setAddNoteVisible(false);

  const next: { [key: string]: string } = {
    incomplete: ActivityStates.Transcribed,
    transcribing: ActivityStates.Transcribed,
    reviewing: ActivityStates.Approved,
    transcribeReady: ActivityStates.Transcribed,
    transcribed: ActivityStates.Approved,
    needsNewTranscription: ActivityStates.Transcribed,
  };

  const forcePosition = (position: number) => {
    setDefaultPosition(playedSecsRef.current || 0);
    setDefaultPosition(position);
  };

  const handleSubmit = useCallback(
    async () => {
      if (next.hasOwnProperty(state)) {
        let nextState = next[state];
        if (nextState === ActivityStates.Transcribed && !hasChecking)
          nextState = ActivityStates.Approved;
        if (nextState === ActivityStates.Approved && noParatext)
          nextState = ActivityStates.Done;
        await save(nextState, 0, segmentsRef.current, '');
        onReloadPlayer && onReloadPlayer(mediaRef.current);
        forcePosition(0);
        if (setComplete) setComplete(true);
      } else {
        logError(Severity.error, errorReporter, `Unhandled state: ${state}`);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [errorReporter, hasChecking, noParatext, state]
  );

  const stateRole: { [key: string]: string } = {
    transcribing: 'transcriber',
    reviewing: 'editor',
    transcribeReady: 'transcriber',
    transcribed: 'editor',
  };

  const handleAssign = useCallback(
    async (curState: string) => {
      const secRec = findRecord(memory, 'section', section.id as string);
      const role = stateRole[curState];
      if (secRec && role) {
        const assigned = related(secRec, role);
        if (!assigned || assigned === '') {
          await memory.update(
            UpdateRelatedRecord(
              new RecordTransformBuilder(),
              section,
              role,
              'user',
              user,
              user
            )
          );
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [section, user]
  );

  const handleEditorSettings = (isOpen: boolean) => {
    if (!isOpen) {
      setShowSettings(false);
      return;
    }
    setSettingsState({
      rtl: projData?.fontDir === 'rtl',
      fontSize: projData?.fontSize,
      spellCheck: projData?.spellCheck,
      vProjectStrings,
    } as IProjectDialog);
    setShowSettings(true);
  };

  useEffect(() => {
    if (projData && settingsState) {
      let newData = projData;
      let change = false;
      if (settingsState?.rtl !== (newData.fontDir === 'rtl')) {
        change = true;
        newData = { ...newData, fontDir: settingsState?.rtl ? 'rtl' : 'ltr' };
      }
      if (settingsState?.fontSize !== newData.fontSize) {
        change = true;
        newData = { ...newData, fontSize: settingsState.fontSize };
      }
      if (settingsState?.spellCheck !== newData.spellCheck) {
        change = true;
        newData = { ...newData, spellCheck: settingsState.spellCheck };
      }
      if (change) setProjData(newData);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsState]);

  const nextOnSave: { [key: string]: string } = {
    incomplete: ActivityStates.Transcribing,
    needsNewTranscription: ActivityStates.Transcribing,
    transcribeReady: ActivityStates.Transcribing,
    transcribed: ActivityStates.Reviewing,
  };

  const handleUpdateConfirmed = () => {
    if (confirm) showTranscription(confirm);
    setConfirm(undefined);
  };
  const handleUpdateRefused = () => {
    //it's been changed on the backend, but I want mine, so save mine over theirs
    handleSave();
    setConfirm(undefined);
  };

  const handleSave = async () => {
    //this needs to use the refs because it is called from a timer, which
    //apparently remembers the values when it is kicked off...not when it is run
    await save(
      nextOnSave[stateRef.current] ?? stateRef.current,
      playedSecsRef.current,
      segmentsRef.current,
      undefined
    );
  };

  const save = async (
    nextState: string,
    newPosition: number,
    segments: string | undefined,
    thiscomment: string | undefined
  ) => {
    if (transcriptionRef.current && mediaRef.current) {
      saving.current = true;
      let transcription = transcriptionRef.current.firstChild.value;
      const curState = stateRef.current;
      const tb = new RecordTransformBuilder();
      let ops: RecordOperation[] = [];
      //todo
      //always update the state, because we need the dateupdated to be updated
      if (stateRef.current !== nextState || thiscomment)
        AddPassageStateChangeToOps(
          tb,
          ops,
          passage.id,
          stateRef.current !== nextState ? nextState : '',
          thiscomment || '',
          user,
          memory
        );

      ops.push(
        ...UpdateRecord(
          tb,
          {
            type: 'mediafile',
            id: mediaRef.current.id,
            attributes: {
              ...mediaRef.current?.attributes,
              transcription: transcription,
              position: newPosition,
              segments: updateSegments(
                NamedRegions.Transcription,
                mediaRef.current.attributes?.segments,
                segments || '{}'
              ),
              transcriptionstate: nextState,
            },
          } as InitializedRecord & MediaFile,
          user
        )
      );
      //have to do this before the mediafiles useEffect kicks in
      var prevtran = transcriptionIn.current;
      transcriptionIn.current = transcription;
      await memory
        .update(ops)
        .then(() => {
          //we come here before we get an error because we're non-blocking
          saveCompleted(toolId);
          setLastSaved(currentDateTime());
          saving.current = false;
          handleAssign(curState);
        })
        .catch((err) => {
          //so we don't come here...we go to continue/logout
          transcriptionIn.current = prevtran;
          saveCompleted(toolId, err.message);
          saving.current = false;
        });
    }
  };
  const handleSaveButton = () => {
    if (saving.current) {
      showMessage(t.saving);
      return;
    }
    handleSave();
  };

  const previous: { [key: string]: string } = {
    incomplete: ActivityStates.TranscribeReady,
    transcribed: ActivityStates.TranscribeReady,
    transcribing: ActivityStates.TranscribeReady,
    reviewing: ActivityStates.TranscribeReady,
    approved: ActivityStates.TranscribeReady,
    done: ActivityStates.TranscribeReady,
    synced: ActivityStates.TranscribeReady,
  };

  const doReopen = async () => {
    if (previous.hasOwnProperty(state)) {
      await memory.update(
        UpdateMediaStateOps(
          mediafile.id,
          passage.id,
          previous[state],
          user,
          new RecordTransformBuilder(),
          [],
          memory,
          ''
        )
      );
      setLastSaved(currentDateTime());
      if (setComplete) setComplete(false);
    }
  };
  const handleReopen = async () => {
    waitForRemoteQueue('busy before reopen').then(() =>
      doReopen().then(() => onReopen && onReopen())
    );
  };

  const getTranscription = () => {
    const attr = mediafile?.attributes;
    return {
      transcription: attr?.transcription || undefined,
      position: attr?.position,
      segments: getSegments(NamedRegions.Transcription, attr?.segments),
    };
  };

  const showTranscription = (val: ITrans) => {
    transcriptionIn.current = val.transcription;
    setTextValue(val.transcription ?? '');
    setDefaultPosition(val.position);
    //focus on player
    if (transcriptionRef.current) {
      transcriptionRef.current.firstChild.value = val.transcription;
      focusOnTranscription();
    }
    setLastSaved(mediafile?.attributes?.dateUpdated || '');
  };

  const handleAutosave = async () => {
    if (!playingRef.current && !saving.current && transcriptionRef.current) {
      const transcription = transcriptionRef.current.firstChild.value;
      if ((transcriptionIn.current ?? '') !== transcription) {
        await handleSave();
      }
    }

    launchTimer();
  };

  const launchTimer = () => {
    autosaveTimer.current = setTimeout(() => {
      handleAutosave();
    }, 1000 * 30);
  };

  const paperStyle = { width: props.defaultWidth - 36 };

  const onInteraction = () => {
    focusOnTranscription();
  };

  const onProgress = (progress: number) => (playedSecsRef.current = progress);

  const onSegmentChange = (segments: string, init: boolean) => {
    segmentsRef.current = segments;
  };
  const onSegmentParamChange = (
    params: IRegionParams,
    teamDefault: boolean
  ) => {
    setSegParams(params);
    if (teamDefault) setOrgDefault(NamedRegions.Transcription, params);
  };

  const onSaveProgress = (progress: number) => {
    if (transcriptionRef.current) {
      focusOnTranscription();
      const timeStamp = '(' + formatTime(progress) + ')';
      const textArea = transcriptionRef.current
        .firstChild as HTMLTextAreaElement;
      insertAtCursor(textArea, timeStamp);
      setTextValue(textArea.value ?? '');
    }
  };
  const handleSplitSize = useMemo(
    () =>
      debounce((sizes: number[]) => {
        const newSize = Math.floor(sizes[0]);
        if (newSize !== playerSize) {
          // console.log('write_playersize', newSize);
          setPlayerSize(newSize);
        }
      }, 500),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  useEffect(() => {
    setArtifactTypeSlug(
      slug
        ? slug
        : artifactId
        ? slugFromId(artifactId)
        : ArtifactTypeSlug.Vernacular
    );
  }, [slug, artifactId, slugFromId]);

  const handleStartRegion = (position: number) => {
    const segs = getSortedRegions(verseSegs.current || '');
    const ref = segs.find((s) => s.start === position)?.label;
    const m = refMatch(ref || '');
    if (ref && m) {
      const vNum = ref.substring(m[1].length + 1);
      let refText = `\\v ${vNum} `;
      const textArea = transcriptionRef.current
        .firstChild as HTMLTextAreaElement;
      const refPos = textArea.value.indexOf(refText);
      // look for alternate verse markup format too
      const refPos2 = textArea.value.indexOf(`\\v${vNum} `);
      if (refPos === -1 && refPos2 === -1) {
        // vNum is undefined for bad references
        refText = vNum ? ' ' + refText : '';
        if (parseInt(m[2]) === 1) {
          refText = ` \\c ${m[1]} ` + refText;
        }
        insertAtCursor(textArea, refText);
        setTextValue(textArea.value ?? '');
      }
    }
  };

  return (
    <GrowingDiv>
      <Paper sx={{ p: 0, m: 'auto' }} style={paperStyle}>
        {allDone ? (
          <AllDone />
        ) : (
          <Grid container direction="column" style={style}>
            <AllotmentWrapper vert={`${playerSize + boxHeight}px`}>
              <Allotment
                vertical
                defaultSizes={[playerSize, boxHeight]}
                onChange={handleSplitSize}
              >
                <Allotment.Pane maxSize={maxPlayerSize}>
                  <Grid
                    container
                    direction="row"
                    sx={{ alignItems: 'center', whiteSpace: 'nowrap' }}
                  >
                    {role === 'transcriber' &&
                      hasParatextName &&
                      paratextProject &&
                      !noParatext &&
                      !passage?.attributes?.reference.startsWith(
                        PassageTypeEnum.NOTE
                      ) && (
                        <Grid item>
                          <LightTooltip title={t.pullParatextTip}>
                            <span>
                              <IconButton
                                id="transcriber.pullParatext"
                                onClick={handlePullParatext}
                                disabled={!transSelected}
                              >
                                <>
                                  <PullIcon />{' '}
                                  <Typography>
                                    {t.pullParatextCaption}
                                  </Typography>
                                </>
                              </IconButton>
                            </span>
                          </LightTooltip>
                        </Grid>
                      )}
                    <Grid item xs id="transcriberplayer">
                      <PassageDetailPlayer
                        position={defaultPosition}
                        allowAutoSegment={true}
                        saveSegments={
                          allowSegment
                            ? SaveSegments.saveButNoButton
                            : undefined
                        }
                        defaultSegParams={segParams}
                        canSetDefaultParams={canSetOrgDefault}
                        allowSegment={allowSegment}
                        allowZoomAndSpeed={true}
                        onProgress={onProgress}
                        suggestedSegments={suggestedSegs}
                        verses={verseSegs.current}
                        onStartRegion={handleStartRegion}
                        onSegment={onSegmentChange}
                        onSegmentParamChange={onSegmentParamChange}
                        onInteraction={onInteraction}
                        parentToolId={toolId}
                        onSaveProgress={
                          !transSelected || role === 'view'
                            ? undefined
                            : onSaveProgress
                        }
                      />
                    </Grid>
                  </Grid>
                </Allotment.Pane>
                <Allotment.Pane>
                  <Grid item xs={12} sm container sx={{ height: 'inherit' }}>
                    <Grid
                      item
                      ref={transcriptionRef}
                      xs={showHistory ? 6 : 12}
                      container
                      direction="column"
                      sx={{ height: 'inherit' }}
                    >
                      <StyledTextAreaAudosize
                        autoFocus
                        id="transcriber.text"
                        value={textValue}
                        readOnly={!transSelected || role === 'view'}
                        family={projData?.fontConfig?.custom?.families[0] ?? ''}
                        url={projData?.fontConfig?.custom?.urls[0] ?? ''}
                        style={textAreaStyle}
                        onChange={handleChange}
                        lang={projData?.langTag || 'en'}
                        spellCheck={projData?.spellCheck}
                      />
                    </Grid>
                    {showHistory && (
                      <Grid item xs={6} container direction="column">
                        <PassageHistory
                          passageId={passage?.id}
                          boxHeight={boxHeight - 16}
                        />
                      </Grid>
                    )}
                  </Grid>
                </Allotment.Pane>
              </Allotment>
            </AllotmentWrapper>

            <Grid container direction="row" sx={{ pt: '12px' }}>
              <Grid item sx={{ display: 'flex', alignItems: 'center' }}>
                <TaskFlag
                  ta={ta}
                  state={mediafile?.attributes?.transcriptionstate || ''}
                />
                <LightTooltip title={vProjectStrings.editorSettings}>
                  <IconButton onClick={() => handleEditorSettings(true)}>
                    <Settings />
                  </IconButton>
                </LightTooltip>
                {isElectron && <Spelling />}
              </Grid>
              <Grid item xs>
                <Grid container justifyContent="flex-end">
                  <div>
                    <LastEdit
                      when={lastSaved}
                      cb={handleShowHistory}
                      t={sharedStr}
                    />
                    {role !== 'view' ? (
                      <>
                        <AltButton
                          id="transcriber.reject"
                          onClick={handleReject}
                          disabled={!transSelected || playing}
                        >
                          {t.reject}
                        </AltButton>
                        <LightTooltip
                          title={transcribing ? t.saveTip : t.saveReviewTip}
                        >
                          <span>
                            <AltButton
                              id="transcriber.save"
                              variant={changed ? 'contained' : 'outlined'}
                              onClick={handleSaveButton}
                              disabled={!transSelected || playing}
                            >
                              {t.save}
                            </AltButton>
                          </span>
                        </LightTooltip>
                        <LightTooltip
                          title={
                            transcribing
                              ? t.submitTranscriptionTip
                              : t.submitReviewTip
                          }
                        >
                          <span>
                            <PriButton
                              id="transcriber.submit"
                              onClick={handleSubmit}
                              disabled={!transSelected || playing}
                            >
                              {t.submit}
                            </PriButton>
                          </span>
                        </LightTooltip>
                      </>
                    ) : (
                      <AltButton
                        id="transcriber.reopen"
                        onClick={handleReopen}
                        disabled={
                          !transSelected ||
                          !previous.hasOwnProperty(state) ||
                          playing ||
                          (user !== related(section, 'transcriber') &&
                            !userIsAdmin)
                        }
                      >
                        {t.reopen}
                      </AltButton>
                    )}
                  </div>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        )}
        <TranscribeReject
          visible={rejectVisible}
          mediaIn={mediafile}
          editMethod={handleRejected}
          cancelMethod={handleRejectCancel}
        />
        <TranscribeAddNote
          visible={addNoteVisible}
          passageIn={passage}
          addMethod={handleAddNote}
          cancelMethod={handleAddNoteCancel}
        />
        {confirm && (
          <Confirm
            isDelete={false}
            text={t.updateByOther2
              .replace(
                '{0}',
                GetUser(memory, related(mediafile, 'lastModifiedByUser'))
                  .attributes?.name ?? 'unknown'
              )
              .replace('{1}', confirm.transcription ?? '')}
            yesResponse={handleUpdateConfirmed}
            noResponse={handleUpdateRefused}
          />
        )}
        <BigDialog
          title={vProjectStrings.editorSettings}
          isOpen={showSettings}
          onOpen={handleEditorSettings}
        >
          <EditorSettings
            state={settingsState ?? initProjectState}
            setState={setSettingsState as any}
          />
        </BigDialog>
      </Paper>
    </GrowingDiv>
  );
}

export default Transcriber;
