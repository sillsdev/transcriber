import React, {
  useEffect,
  useState,
  useContext,
  useRef,
  CSSProperties,
  PropsWithChildren,
  useMemo,
} from 'react';
import { useGlobal } from 'reactn';
import { useParams } from 'react-router-dom';
import { connect } from 'react-redux';
import WebFontLoader from '@dr-kobros/react-webfont-loader';
import {
  default as SplitPaneBar,
  Pane as PaneBar,
  PaneProps,
  SplitPaneProps,
} from 'react-split-pane';
import styledComp from 'styled-components';
import Confirm from './AlertDialog';
import {
  MediaFile,
  Project,
  ActivityStates,
  Passage,
  Section,
  IState,
  Integration,
  ProjectIntegration,
  IActivityStateStrings,
} from '../model';
import { QueryBuilder, TransformBuilder, Operation } from '@orbit/data';
import {
  Grid,
  Paper,
  Typography,
  IconButton,
  TextareaAutosize,
} from '@mui/material';
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
  waitForIt,
  integrationSlug,
  getSegments,
  NamedRegions,
  updateSegments,
} from '../utils';
import { isElectron } from '../api-variable';
import { TokenContext } from '../context/TokenProvider';
import { debounce } from 'lodash';
import { AllDone } from './AllDone';
import { LastEdit } from '../control';
import { UpdateRecord, UpdateRelatedRecord } from '../model/baseModel';
import { withData } from 'react-orbitjs';
import { IAxiosStatus } from '../store/AxiosStatus';
import * as action from '../store';
import { bindActionCreators } from 'redux';
import { translateParatextError } from '../utils/translateParatextError';
import TranscribeAddNote from './TranscribeAddNote';
import PassageHistory from './PassageHistory';
import { HotKeyContext } from '../context/HotKeyContext';
import TaskFlag from './TaskFlag';
import Spelling from './Spelling';
import { UnsavedContext } from '../context/UnsavedContext';
import { activitySelector } from '../selector';
import { shallowEqual, useSelector } from 'react-redux';
import usePassageDetailContext from '../context/usePassageDetailContext';
import { IRegionParams } from '../crud/useWavesurferRegions';
import PassageDetailPlayer from './PassageDetail/PassageDetailPlayer';

//import useRenderingTrace from '../utils/useRenderingTrace';

const HISTORY_KEY = 'F7,CTRL+7';
const INIT_PLAYER_HEIGHT = 180;

const Wrapper = styledComp.div`
  .Resizer {
    -moz-box-sizing: border-box;
    -webkit-box-sizing: border-box;
    box-sizing: border-box;
    background: #000;
    opacity: 0.2;
    z-index: 1;
    -moz-background-clip: padding;
    -webkit-background-clip: padding;
    background-clip: padding-box;
  }

  .Resizer:hover {
    -webkit-transition: all 2s ease;
    transition: all 2s ease;
  }

  .Resizer.horizontal {
    height: 11px;
    margin: -5px 0;
    border-top: 5px solid rgba(255, 255, 255, 0);
    border-bottom: 5px solid rgba(255, 255, 255, 0);
    cursor: row-resize;
    width: 100%;
  }

  .Resizer.horizontal:hover {
    border-top: 5px solid rgba(0, 0, 0, 0.5);
    border-bottom: 5px solid rgba(0, 0, 0, 0.5);
  }

  .Resizer.vertical {
    width: 11px;
    margin: 0 -5px;
    border-left: 5px solid rgba(255, 255, 255, 0);
    border-right: 5px solid rgba(255, 255, 255, 0);
    cursor: col-resize;
  }

  .Resizer.vertical:hover {
    border-left: 5px solid rgba(0, 0, 0, 0.5);
    border-right: 5px solid rgba(0, 0, 0, 0.5);
  }
  .Pane1 {
    // background-color: blue;
    display: flex;
    min-height: 0;
  }
  .Pane2 {
    // background-color: red;
    display: flex;
    min-height: 0;
  }
`;

const SplitPane = (props: SplitPaneProps & PropsWithChildren) => {
  return <SplitPaneBar {...props} />;
};

const Pane = (props: PaneProps & PropsWithChildren) => {
  return <PaneBar {...props} className={props.className || 'pane'} />;
};

interface IRecordProps {
  mediafiles: MediaFile[];
  integrations: Integration[];
  projintegrations: ProjectIntegration[];
}
const mapRecordsToProps = {
  mediafiles: (q: QueryBuilder) => q.findRecords('mediafile'),
  integrations: (q: QueryBuilder) => q.findRecords('integration'),
  projintegrations: (q: QueryBuilder) => q.findRecords('projectintegration'),
};

const mapDispatchToProps = (dispatch: any) => ({
  ...bindActionCreators(
    {
      getUserName: action.getUserName,
      getParatextText: action.getParatextText,
      getParatextTextLocal: action.getParatextTextLocal,
      resetParatextText: action.resetParatextText,
    },
    dispatch
  ),
});

interface IDispatchProps {
  getUserName: typeof action.getUserName;
  getParatextText: typeof action.getParatextText;
  getParatextTextLocal: typeof action.getParatextTextLocal;
  resetParatextText: typeof action.resetParatextText;
}
interface IStateProps {
  paratext_textStatus?: IAxiosStatus;
  paratext_username: string; // state.paratext.username
  paratext_usernameStatus?: IAxiosStatus;
}
const mapStateToProps = (state: IState): IStateProps => ({
  paratext_textStatus: state.paratext.textStatus,
  paratext_username: state.paratext.username,
  paratext_usernameStatus: state.paratext.usernameStatus,
});
interface IProps {
  defaultWidth: number;
}

interface ITrans {
  transcription: string | undefined;
  position: number;
}

export function Transcriber(
  props: IProps & IStateProps & IDispatchProps & IRecordProps
) {
  const {
    mediafiles,
    projintegrations,
    integrations,
    paratext_textStatus,
    paratext_username,
    paratext_usernameStatus,
    getUserName,
    getParatextText,
    getParatextTextLocal,
    resetParatextText,
  } = props;
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
  const [project] = useGlobal('project');
  const [projType] = useGlobal('projType');
  const [user] = useGlobal('user');
  const [organization] = useGlobal('organization');
  const [errorReporter] = useGlobal('errorReporter');
  const { accessToken } = useContext(TokenContext).state;
  const [assigned, setAssigned] = useState('');
  const [projData, setProjData] = useState<FontData>();
  const [fontStatus, setFontStatus] = useState<string>();
  const playedSecsRef = useRef<number>(0);
  const segmentsRef = useRef<string>();
  const stateRef = useRef<string>(state);
  const [transcribing] = useState(
    state === ActivityStates.Transcribing ||
      state === ActivityStates.TranscribeReady
  );

  const [textValue, setTextValue] = useState('');
  const [lastSaved, setLastSaved] = useState('');
  const [defaultPosition, setDefaultPosition] = useState(0.0);

  const { showMessage } = useSnackBar();
  const showHistoryRef = useRef(false);
  const [showHistory, setShowHistoryx] = useState(false);
  const [rejectVisible, setRejectVisible] = useState(false);
  const [addNoteVisible, setAddNoteVisible] = useState(false);
  const [hasParatextName, setHasParatextName] = useState(false);
  const [paratextProject, setParatextProject] = React.useState('');
  const [paratextIntegration, setParatextIntegration] = React.useState('');
  const [connected] = useGlobal('connected');
  const [coordinator] = useGlobal('coordinator');
  const remote = coordinator.getSource('remote');
  const transcriptionIn = React.useRef<string>();
  const saving = React.useRef(false);
  const { toolsChanged, saveRequested, isChanged } =
    useContext(UnsavedContext).state;
  const [changed, setChanged] = useState(false);
  const [confirm, setConfirm] = useState<ITrans>();
  const transcriptionRef = React.useRef<any>();
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
    pdBusy,
    playerMediafile,
    setSelected,
    discussionSize,
  } = usePassageDetailContext();
  const [boxHeight, setBoxHeight] = useState(
    discussionSize.height - (playerSize + 200)
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
      projType,
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

  const keys = [{ key: HISTORY_KEY, cb: handleShowHistory }];

  useEffect(() => {
    const getParatextIntegration = () => {
      const intfind = integrations.findIndex(
        (i) =>
          i.attributes &&
          i.attributes.name === integrationSlug(artifactTypeSlug, offline) &&
          Boolean(i.keys?.remoteId) !== offline
      );
      if (intfind > -1) setParatextIntegration(integrations[intfind].id);
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
          i.attributes.name === integrationSlug(artifactTypeSlug, offline) &&
          Boolean(i.keys?.remoteId) !== offline
      );
      if (intfind > -1) setParatextIntegration(integrations[intfind].id);
    };

    getParatextIntegration();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [integrations]);

  useEffect(() => {
    if (saveRequested(toolId)) {
      handleSave();
    }
    var newchanged = isChanged(toolId);
    if (newchanged !== changed) setChanged(newchanged);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [toolsChanged]);

  useEffect(() => {
    const newBoxHeight = discussionSize.height - playerSize;
    console.log(`transcriber ${discussionSize.height} ${newBoxHeight}`);
    if (newBoxHeight !== boxHeight) setBoxHeight(newBoxHeight);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discussionSize, playerSize]);

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
      setSelected(transSelected);
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
        setSelected(mediafile?.id || '');
    }
    if (mediafile) {
      const trans = getTranscription();
      if (
        transcriptionIn.current !== undefined &&
        trans.transcription !== transcriptionIn.current &&
        !saving.current
      ) {
        //if someone else changed it...let the user pick
        setConfirm(trans);
      }
    }
    mediaRef.current = mediafile;
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [mediafiles, mediafile]);

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
    if (project && project !== '') {
      var r = findRecord(memory, 'project', project) as Project;
      if (r) setProjData(getFontData(r, offline));
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [project]);

  useEffect(() => {
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
  }, [paratext_username, paratext_usernameStatus]);

  const focusOnTranscription = () => {
    if (transcriptionRef.current) transcriptionRef.current.firstChild.focus();
  };
  const handleChange = (e: any) => {
    setTextValue(e.target.value);
    toolChanged(toolId, true);
  };
  const loadStatus = (status: string) => {
    setFontStatus(status);
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
        remoteIdNum('passage', passage.id, memory.keyMap),
        artifactId && remoteId('artifacttype', artifactId, memory.keyMap),
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
  const handleRejected = async (media: MediaFile, comment: string) => {
    setRejectVisible(false);
    await memory.update(
      UpdateMediaStateOps(
        media.id,
        passage.id,
        media.attributes.transcriptionstate,
        user,
        new TransformBuilder(),
        [],
        memory,
        comment
      )
    );
    //todo ?? if (IsVernacular(media))
    setLastSaved(currentDateTime());
  };
  const handleRejectCancel = () => setRejectVisible(false);

  const handleAddNote = async (pass: Passage) => {
    setAddNoteVisible(false);
    var ops = [] as Operation[];
    AddPassageStateChangeToOps(
      new TransformBuilder(),
      ops,
      pass.id,
      '',
      pass.attributes.lastComment,
      user,
      memory
    );
    await memory.update(ops);
    pass.attributes.lastComment = '';
  };
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
  const handleSubmit = async () => {
    if (next.hasOwnProperty(state)) {
      let nextState = next[state];
      if (nextState === ActivityStates.Approved && noParatext)
        nextState = ActivityStates.Done;
      await save(nextState, 0, segmentsRef.current, '');
      forcePosition(0);
    } else {
      logError(Severity.error, errorReporter, `Unhandled state: ${state}`);
    }
  };

  const stateRole: { [key: string]: string } = {
    transcribing: 'transcriber',
    reviewing: 'editor',
    transcribeReady: 'transcriber',
    transcribed: 'editor',
  };

  const handleAssign = async (curState: string) => {
    const secRec = findRecord(memory, 'section', section.id);
    const role = stateRole[curState];
    if (secRec && role) {
      const assigned = related(secRec, role);
      if (!assigned || assigned === '') {
        await memory.update(
          UpdateRelatedRecord(
            new TransformBuilder(),
            section,
            role,
            'user',
            user,
            user
          )
        );
      }
    }
  };

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
      const tb = new TransformBuilder();
      let ops: Operation[] = [];
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
              transcription: transcription,
              position: newPosition,
              segments: updateSegments(
                NamedRegions.Transcription,
                mediaRef.current.attributes?.segments,
                segments ?? '{}'
              ),
              transcriptionstate: nextState,
            },
          } as any as MediaFile,
          user
        )
      );
      //have to do this before the mediafiles useEffect kicks in
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
          new TransformBuilder(),
          [],
          memory,
          ''
        )
      );
      setLastSaved(currentDateTime());
    }
  };
  const handleReopen = async () => {
    await waitForIt(
      'busy before reopen',
      () => !remote || !connected || remote.requestQueue.length === 0,
      () => false,
      20
    ).then(() => doReopen());
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
    if (
      !playingRef.current &&
      !saving.current &&
      transcriptionRef.current &&
      transcriptionIn.current !== undefined
    ) {
      const transcription = transcriptionRef.current.firstChild.value;
      if (transcriptionIn.current !== transcription) {
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

  const onSegmentChange = (segments: string) => {
    if (segmentsRef.current !== segments) {
      if (segmentsRef.current && allowSegment) {
        toolChanged(toolId, true);
      }
      segmentsRef.current = segments;
    }
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
      setTextValue(textArea.value);
    }
  };
  const handleSplitSize = debounce((e: any) => {
    setPlayerSize(e);
  }, 50);

  const noParatext = React.useMemo(
    () =>
      [ArtifactTypeSlug.Retell, ArtifactTypeSlug.QandA].includes(
        (artifactTypeSlug || '') as ArtifactTypeSlug
      ) || projType.toLowerCase() !== 'scripture',
    [artifactTypeSlug, projType]
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

  return (
    <GrowingDiv>
      <Paper sx={{ p: 0, m: 'auto' }} style={paperStyle}>
        {allDone ? (
          <AllDone />
        ) : (
          <Grid container direction="column" style={style}>
            <Wrapper>
              <SplitPane
                defaultSize={playerSize}
                minSize={INIT_PLAYER_HEIGHT}
                maxSize={discussionSize.height - 280}
                style={{ position: 'static' }}
                split="horizontal"
                onChange={handleSplitSize}
              >
                <Pane>
                  <Grid
                    container
                    direction="row"
                    sx={{ alignItems: 'center', whiteSpace: 'nowrap' }}
                  >
                    {role === 'transcriber' &&
                      hasParatextName &&
                      paratextProject &&
                      !noParatext && (
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
                        defaultSegParams={segParams}
                        canSetDefaultParams={canSetOrgDefault}
                        allowSegment={allowSegment}
                        allowZoomAndSpeed={true}
                        onProgress={onProgress}
                        onSegment={onSegmentChange}
                        onSegmentParamChange={onSegmentParamChange}
                        onInteraction={onInteraction}
                        onSaveProgress={
                          !transSelected || role === 'view'
                            ? undefined
                            : onSaveProgress
                        }
                      />
                    </Grid>
                  </Grid>
                </Pane>
                <Pane>
                  <Grid item xs={12} sm container>
                    <Grid
                      ref={transcriptionRef}
                      item
                      xs={showHistory ? 6 : 12}
                      container
                      direction="column"
                    >
                      {projData && !fontStatus?.endsWith('active') ? (
                        <WebFontLoader
                          config={projData.fontConfig}
                          onStatus={loadStatus}
                        >
                          <TextareaAutosize
                            autoFocus
                            id="transcriber.text"
                            value={textValue}
                            readOnly={!transSelected || role === 'view'}
                            style={textAreaStyle}
                            onChange={handleChange}
                            lang={projData?.langTag || 'en'}
                            spellCheck={projData?.spellCheck}
                          />
                        </WebFontLoader>
                      ) : (
                        <TextareaAutosize
                          autoFocus
                          id="transcriber.text"
                          value={textValue}
                          readOnly={!transSelected || role === 'view'}
                          style={textAreaStyle}
                          onChange={handleChange}
                          lang={projData?.langTag || 'en'}
                          spellCheck={projData?.spellCheck}
                        />
                      )}
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
                </Pane>
              </SplitPane>
            </Wrapper>

            <Grid container direction="row" sx={{ pt: '12px' }}>
              <Grid item sx={{ display: 'flex', alignItems: 'center' }}>
                <TaskFlag
                  ta={ta}
                  state={mediafile?.attributes?.transcriptionstate || ''}
                />
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
      </Paper>
    </GrowingDiv>
  );
}

export default withData(mapRecordsToProps)(
  connect(mapStateToProps, mapDispatchToProps)(Transcriber as any) as any
) as any as (props: IProps) => JSX.Element;
