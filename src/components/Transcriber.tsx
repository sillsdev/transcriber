import React, { useEffect, useState, useContext, useRef } from 'react';
import { useGlobal } from 'reactn';
import { connect } from 'react-redux';
import WebFontLoader from '@dr-kobros/react-webfont-loader';
import SplitPane, { Pane } from 'react-split-pane';
import styled from 'styled-components';
import {
  MediaFile,
  Project,
  ActivityStates,
  Passage,
  Section,
  IState,
  Integration,
  ProjectIntegration,
  RoleNames,
} from '../model';
import { QueryBuilder, TransformBuilder, Operation } from '@orbit/data';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import {
  Grid,
  Paper,
  Typography,
  Button,
  IconButton,
  TextareaAutosize,
} from '@material-ui/core';
import useTodo from '../context/useTodo';
import PullIcon from '@material-ui/icons/GetAppOutlined';
import HistoryIcon from '@material-ui/icons/History';
import { formatTime, LightTooltip } from '../control';
import TranscribeReject from './TranscribeReject';
import { useSnackBar } from '../hoc/SnackBar';
import {
  sectionDescription,
  passageDescription,
  related,
  FontData,
  getFontData,
  UpdatePassageStateOps,
  remoteIdNum,
} from '../crud';
import {
  insertAtCursor,
  useRemoteSave,
  logError,
  Severity,
  currentDateTime,
  getParatextDataPath,
  camel2Title,
  refMatch,
  waitForIt,
} from '../utils';
import { isElectron } from '../api-variable';
import Auth from '../auth/Auth';
import { debounce } from 'lodash';
import { TaskItemWidth } from '../components/TaskTable';
import { AllDone } from './AllDone';
import { LastEdit } from '../control';
import { UpdateRecord, UpdateRelatedRecord } from '../model/baseModel';
import { withData } from '../mods/react-orbitjs';
import { IAxiosStatus } from '../store/AxiosStatus';
import * as action from '../store';
import { bindActionCreators } from 'redux';
import { translateParatextError } from '../utils/translateParatextError';
import TranscribeAddNote from './TranscribeAddNote';
import WSAudioPlayer from './WSAudioPlayer';
import PassageHistory from './PassageHistory';
import { HotKeyContext } from '../context/HotKeyContext';
import Spelling from './Spelling';
//import useRenderingTrace from '../utils/useRenderingTrace';

const HISTORY_KEY = 'F7,CTRL+7';
const INIT_PLAYER_HEIGHT = 180;

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      flexGrow: 1,
    },
    paper: {
      padding: theme.spacing(2),
      margin: 'auto',
    },
    description: {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    row: {
      alignItems: 'center',
      whiteSpace: 'nowrap',
    },
    padRow: {
      paddingTop: '16px',
    },
    button: {
      marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
    },
    pane: {},
    textarea: { resize: 'none' },
  })
);
const Wrapper = styled.div`
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

const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
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
interface IProps extends IStateProps, IRecordProps, IDispatchProps {
  auth: Auth;
}

export function Transcriber(props: IProps) {
  const {
    auth,
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
    allBookData,
    selected,
    playing,
    setPlaying,
    allDone,
    refresh,
    mediaUrl,
    audioBlob,
    loading,
  } = useTodo();

  const { section, passage, duration, mediaId, state, role } = rowData[
    index
  ] || {
    section: {} as Section,
    passage: {} as Passage,
    duration: 0,
    mediaId: '',
    state: '',
    role: '',
  };
  const classes = useStyles();

  const [memory] = useGlobal('memory');
  const [offline] = useGlobal('offline');
  const [project] = useGlobal('project');
  const [projType] = useGlobal('projType');
  const [plan] = useGlobal('plan');
  const [user] = useGlobal('user');
  const [projRole] = useGlobal('projRole');
  const [errorReporter] = useGlobal('errorReporter');
  const [busy, setBusy] = useGlobal('remoteBusy');
  const [assigned, setAssigned] = useState('');
  const [changed, setChanged] = useGlobal('changed');
  const [doSave] = useGlobal('doSave');
  const [projData, setProjData] = useState<FontData>();
  const [fontStatus, setFontStatus] = useState<string>();
  const playedSecsRef = useRef<number>(0);
  const segmentsRef = useRef('{}');
  const stateRef = useRef<string>(state);
  const [totalSeconds, setTotalSeconds] = useState(duration);
  const [transcribing] = useState(
    state === ActivityStates.Transcribing ||
      state === ActivityStates.TranscribeReady
  );
  const [height, setHeight] = useState(window.innerHeight);
  const [boxHeight, setBoxHeight] = useState(
    height - (INIT_PLAYER_HEIGHT + 200)
  );
  const [width, setWidth] = useState(window.innerWidth);
  const [textValue, setTextValue] = useState('');
  const [lastSaved, setLastSaved] = useState('');
  const [defaultPosition, setDefaultPosition] = useState(0.0);
  const [initialSegments, setInitialSegments] = useState('{}');
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
  const [, saveCompleted] = useRemoteSave();
  const transcriptionRef = React.useRef<any>();
  const playingRef = useRef<Boolean>();
  const autosaveTimer = React.useRef<NodeJS.Timeout>();
  const { subscribe, unsubscribe, localizeHotKey } =
    useContext(HotKeyContext).state;
  const t = transcriberStr;
  const [playerSize, setPlayerSize] = useState(INIT_PLAYER_HEIGHT);
  const [style, setStyle] = useState({
    cursor: busy || loading ? 'progress' : 'default',
  });

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
      projRole,
      errorReporter,
      busy,
      assigned,
      changed,
      doSave,
      projData,
      fontStatus,
      totalSeconds,
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
    setStyle({
      cursor: busy || loading ? 'progress' : 'default',
    });
  }, [busy, loading]);

  useEffect(() => {
    const getParatextIntegration = () => {
      const intfind = integrations.findIndex(
        (i) =>
          i.attributes &&
          i.attributes.name === (offline ? 'paratextLocal' : 'paratext') &&
          Boolean(i.keys?.remoteId) !== offline
      );
      if (intfind > -1) setParatextIntegration(integrations[intfind].id);
    };

    getParatextIntegration();

    setDimensions();
    const handleResize = debounce(() => {
      setDimensions();
    }, 100);
    const keys = [{ key: HISTORY_KEY, cb: handleShowHistory }];
    keys.forEach((k) => subscribe(k.key, k.cb));

    window.addEventListener('resize', handleResize);
    return () => {
      keys.forEach((k) => unsubscribe(k.key));
      window.removeEventListener('resize', handleResize);
    };
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  useEffect(() => {
    const getParatextIntegration = () => {
      const intfind = integrations.findIndex(
        (i) =>
          i.attributes &&
          i.attributes.name === (offline ? 'paratextLocal' : 'paratext') &&
          Boolean(i.keys?.remoteId) !== offline
      );
      if (intfind > -1) setParatextIntegration(integrations[intfind].id);
    };

    getParatextIntegration();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [integrations]);

  useEffect(() => {
    if (doSave) {
      handleSave();
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [doSave]);

  useEffect(() => {
    const newBoxHeight = height - (playerSize + 200);
    if (newBoxHeight !== boxHeight) setBoxHeight(newBoxHeight);
  }, [height, boxHeight, playerSize]);

  useEffect(() => {
    if (!saving.current && selected) showTranscription(getTranscription());
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [selected]);

  useEffect(() => {
    const trans = getTranscription();
    if (trans.transcription !== transcriptionIn.current && !saving.current) {
      //show warning if changed
      if (changed) showMessage(t.updateByOther);
      //but do it either way
      showTranscription(trans);
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [mediafiles]);

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
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [mediaId]);

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
      setChanged(true);
      save(
        passage.attributes.state,
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
      var r = memory.cache.query((q) =>
        q.findRecord({ type: 'project', id: project })
      ) as Project;
      setProjData(getFontData(r, offline));
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [project]);

  useEffect(() => {
    const newAssigned = rowData[index]?.assigned;
    if (newAssigned !== assigned) setAssigned(newAssigned);
    stateRef.current = rowData[index]?.state;
    focusOnTranscription();
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [index, rowData]);

  useEffect(() => {
    if (totalSeconds && (!duration || duration !== Math.floor(totalSeconds))) {
      const mediaRecs = memory.cache.query((q: QueryBuilder) =>
        q.findRecords('mediafile')
      ) as MediaFile[];
      const oldRec = mediaRecs.filter((m) => m.id === mediaId);
      var cut = mediaUrl.lastIndexOf('&Signature');
      var check = cut > 0 ? mediaUrl.substr(0, cut) : mediaUrl;
      if (
        oldRec.length > 0 &&
        check === oldRec[0].attributes.audioUrl.substr(0, cut)
      ) {
        memory
          .update((t: TransformBuilder) =>
            t.replaceAttribute(oldRec[0], 'duration', Math.floor(totalSeconds))
          )
          .then(() => {
            refresh();
          });
        console.log(`update duration to ${Math.floor(totalSeconds)}`);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration, totalSeconds]);

  useEffect(() => {
    if (!offline) {
      if (!paratext_usernameStatus && projType.toLowerCase() === 'scripture') {
        getUserName(auth, errorReporter, '');
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
    if (!changed) setChanged(true);
  };
  const loadStatus = (status: string) => {
    setFontStatus(status);
  };

  const setShowHistory = (value: boolean) => {
    showHistoryRef.current = value;
    setShowHistoryx(value);
  };
  const handleShowHistory = () => {
    setShowHistory(!showHistoryRef.current);
    return true;
  };

  const handlePullParatext = () => {
    if (
      !refMatch(passage?.attributes?.reference || 'Err') ||
      !passage?.attributes?.book
    ) {
      showMessage(t.invalidReference);
      return;
    }
    if (offline)
      getParatextDataPath().then((ptPath: string) =>
        getParatextTextLocal(
          ptPath,
          passage,
          paratextProject,
          errorReporter,
          t.pullParatextStart
        )
      );
    else
      getParatextText(
        auth,
        remoteIdNum('passage', selected, memory.keyMap),
        errorReporter,
        t.pullParatextStart
      );
  };
  const handleShowAddNote = () => {
    setAddNoteVisible(true);
  };
  const handleReject = () => {
    if (busy) {
      showMessage(t.saving);
      return;
    }
    setRejectVisible(true);
  };
  const handleRejected = async (pass: Passage) => {
    setRejectVisible(false);
    await memory.update(
      UpdatePassageStateOps(
        pass.id,
        section.id,
        plan,
        pass.attributes.state,
        pass.attributes.lastComment,
        user,
        new TransformBuilder(),
        [],
        memory
      )
    );
    pass.attributes.lastComment = '';
    setLastSaved(currentDateTime());
  };
  const handleRejectCancel = () => setRejectVisible(false);
  const handleAddNote = async (pass: Passage) => {
    setAddNoteVisible(false);
    await memory.update(
      UpdatePassageStateOps(
        pass.id,
        section.id,
        plan,
        pass.attributes.state,
        pass.attributes.lastComment,
        user,
        new TransformBuilder(),
        [],
        memory,
        pass.attributes.lastComment !== ''
      )
    );
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
      if (
        nextState === ActivityStates.Approved &&
        projType.toLowerCase() !== 'scripture'
      )
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

  const roleHierarchy = [
    RoleNames.Transcriber,
    RoleNames.Editor,
    RoleNames.Admin,
  ];

  const handleAssign = async (curState: string) => {
    const secRec = memory.cache.query((q: QueryBuilder) =>
      q.findRecord(section)
    );
    const role = stateRole[curState];
    if (
      role &&
      roleHierarchy.indexOf(camel2Title(role) as RoleNames) <=
        roleHierarchy.indexOf(camel2Title(projRole) as RoleNames)
    ) {
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
    segments: string,
    thiscomment: string | undefined
  ) => {
    if (transcriptionRef.current) {
      saving.current = true;
      let transcription = transcriptionRef.current.firstChild.value;
      const curState = stateRef.current;
      const tb = new TransformBuilder();
      let ops: Operation[] = [];
      //always update the state, because we need the dateupdated to be updated
      ops = UpdatePassageStateOps(
        passage.id,
        section.id,
        plan,
        nextState,
        thiscomment || '',
        user,
        tb,
        ops,
        memory,
        nextState !== stateRef.current || (thiscomment || '') !== ''
      );
      ops.push(
        ...UpdateRecord(
          tb,
          {
            type: 'mediafile',
            id: mediaId,
            attributes: {
              transcription: transcription,
              position: newPosition,
              segments: segments,
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
          saveCompleted('');
          setLastSaved(currentDateTime());
          saving.current = false;
          handleAssign(curState);
        })
        .catch((err) => {
          //so we don't come here...we go to continue/logout
          saveCompleted(err.message);
          saving.current = false;
        });
    }
  };
  const handleSaveButton = () => {
    if (busy) {
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
        UpdatePassageStateOps(
          passage.id,
          section.id,
          plan,
          previous[state],
          '',
          user,
          new TransformBuilder(),
          [],
          memory
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

  const setDimensions = () => {
    setHeight(window.innerHeight);
    setWidth(window.innerWidth - TaskItemWidth - 16);
  };

  const getTranscription = () => {
    const mediaRec = mediafiles.filter((m) => m.id === mediaId);
    if (mediaRec.length > 0 && mediaRec[0] && mediaRec[0].attributes) {
      const attr = mediaRec[0].attributes;
      segmentsRef.current = attr.segments || '{}';
      setInitialSegments(segmentsRef.current);
      return {
        transcription: attr.transcription ? attr.transcription : '',
        position: attr.position,
      };
    } else return { transcription: '', position: 0 }; //shouldn't ever happen
  };
  const showTranscription = (val: {
    transcription: string;
    position: number;
  }) => {
    transcriptionIn.current = val.transcription;
    setTextValue(val.transcription);
    setDefaultPosition(val.position);

    //focus on player
    if (transcriptionRef.current) {
      transcriptionRef.current.firstChild.value = val.transcription;
      focusOnTranscription();
    }
    setLastSaved(passage.attributes?.dateUpdated || '');
    setTotalSeconds(duration);
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

  const textAreaStyle = {
    overflow: 'auto',
    backgroundColor: '#cfe8fc',
    height: boxHeight,
    width: '98hu',
    fontFamily: projData?.fontFamily,
    fontSize: projData?.fontSize,
    direction: projData?.fontDir as any,
  };

  const paperStyle = { width: width - 36 };

  const onDuration = (value: number) => {
    setTotalSeconds(value);
  };
  const onInteraction = () => {
    focusOnTranscription();
  };

  const onProgress = (progress: number) => (playedSecsRef.current = progress);
  const onBusy = (value: boolean) => {
    setBusy(value);
  };
  const onSegmentChange = (segments: string) => {
    segmentsRef.current = segments;
    setChanged(true);
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

  const onPlayStatus = (newPlaying: boolean) => {
    setPlaying(newPlaying);
    playingRef.current = newPlaying;
  };
  return (
    <div className={classes.root}>
      <Paper className={classes.paper} style={paperStyle}>
        {allDone ? (
          <AllDone />
        ) : (
          <Grid container direction="column" style={style}>
            <Grid container direction="row" className={classes.row}>
              <Grid item xs={9} className={classes.description}>
                {sectionDescription(section)}
              </Grid>
              <Grid item>{passageDescription(passage, allBookData)}</Grid>
            </Grid>
            <Wrapper>
              <SplitPane
                defaultSize={180}
                minSize={180}
                style={{ position: 'static' }}
                split="horizontal"
                onChange={handleSplitSize}
              >
                <Pane className={classes.pane}>
                  <Grid container direction="row" className={classes.row}>
                    {role === 'transcriber' &&
                      hasParatextName &&
                      paratextProject && (
                        <Grid item>
                          <LightTooltip title={t.pullParatextTip}>
                            <span>
                              <IconButton
                                id="transcriber.pullParatext"
                                onClick={handlePullParatext}
                                disabled={selected === ''}
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
                    <Grid item xs>
                      <Grid container justifyContent="center">
                        <WSAudioPlayer
                          id="audioPlayer"
                          allowRecord={false}
                          size={playerSize}
                          blob={audioBlob}
                          initialposition={defaultPosition}
                          segments={initialSegments}
                          isPlaying={playing}
                          loading={loading}
                          onBusy={onBusy}
                          onProgress={onProgress}
                          onSegmentChange={onSegmentChange}
                          onPlayStatus={onPlayStatus}
                          onDuration={onDuration}
                          onInteraction={onInteraction}
                          onSaveProgress={
                            selected === '' || role === 'view'
                              ? undefined
                              : onSaveProgress
                          }
                        />
                      </Grid>
                    </Grid>
                  </Grid>
                </Pane>
                <Pane className={classes.pane}>
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
                            className={classes.textarea}
                            autoFocus
                            id="transcriber.text"
                            value={textValue}
                            readOnly={selected === '' || role === 'view'}
                            style={textAreaStyle}
                            onChange={handleChange}
                            lang={projData?.langTag || 'en'}
                            spellCheck={projData?.spellCheck}
                          />
                        </WebFontLoader>
                      ) : (
                        <TextareaAutosize
                          className={classes.textarea}
                          autoFocus
                          id="transcriber.text"
                          value={textValue}
                          readOnly={selected === '' || role === 'view'}
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
                          boxHeight={boxHeight}
                        />
                      </Grid>
                    )}
                  </Grid>
                </Pane>
              </SplitPane>
            </Wrapper>

            <Grid container direction="row" className={classes.padRow}>
              <Grid item>
                <Button
                  id="transcriber.showNote"
                  variant="outlined"
                  color="primary"
                  className={classes.button}
                  onClick={handleShowAddNote}
                  disabled={selected === ''}
                >
                  {t.addNote}
                </Button>

                <LightTooltip
                  title={t.historyTip.replace(
                    '{0}',
                    localizeHotKey(HISTORY_KEY)
                  )}
                >
                  <span>
                    <IconButton
                      id="transcriber.showHistory"
                      onClick={handleShowHistory}
                    >
                      <>
                        <HistoryIcon />
                      </>
                    </IconButton>
                  </span>
                </LightTooltip>
                {isElectron && <Spelling />}
              </Grid>
              <Grid item xs>
                <Grid container justifyContent="flex-end">
                  <div>
                    <LastEdit when={lastSaved} t={sharedStr} />
                    {role !== 'view' ? (
                      <>
                        <Button
                          id="transcriber.reject"
                          variant="outlined"
                          color="primary"
                          className={classes.button}
                          onClick={handleReject}
                          disabled={selected === '' || playing}
                        >
                          {t.reject}
                        </Button>
                        <LightTooltip
                          title={transcribing ? t.saveTip : t.saveReviewTip}
                        >
                          <span>
                            <Button
                              id="transcriber.save"
                              variant={changed ? 'contained' : 'outlined'}
                              color="primary"
                              className={classes.button}
                              onClick={handleSaveButton}
                              disabled={selected === '' || playing}
                            >
                              {t.save}
                            </Button>
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
                            <Button
                              id="transcriber.submit"
                              variant="contained"
                              color="primary"
                              className={classes.button}
                              onClick={handleSubmit}
                              disabled={selected === '' || playing}
                            >
                              {t.submit}
                            </Button>
                          </span>
                        </LightTooltip>
                      </>
                    ) : (
                      <Button
                        id="transcriber.reopen"
                        variant="outlined"
                        color="primary"
                        className={classes.button}
                        onClick={handleReopen}
                        disabled={
                          selected === '' ||
                          !previous.hasOwnProperty(state) ||
                          playing ||
                          (user !== related(section, 'transcriber') &&
                            !/admin/i.test(projRole))
                        }
                      >
                        {t.reopen}
                      </Button>
                    )}
                  </div>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        )}
        <TranscribeReject
          visible={rejectVisible}
          passageIn={passage}
          editMethod={handleRejected}
          cancelMethod={handleRejectCancel}
        />
        <TranscribeAddNote
          visible={addNoteVisible}
          passageIn={passage}
          addMethod={handleAddNote}
          cancelMethod={handleAddNoteCancel}
        />
      </Paper>
    </div>
  );
}

export default withData(mapRecordsToProps)(
  connect(mapStateToProps, mapDispatchToProps)(Transcriber) as any
) as any;
