import React, { useEffect, useState } from 'react';
import { useGlobal } from 'reactn';
import { connect } from 'react-redux';
import ReactPlayer from 'react-player';
import WebFontLoader from '@dr-kobros/react-webfont-loader';
import keycode from 'keycode';
import moment from 'moment-timezone';
import {
  MediaFile,
  Project,
  ActivityStates,
  Passage,
  PassageStateChange,
  Section,
  Plan,
  PlanType,
  User,
  IState,
  Integration,
  ProjectIntegration,
} from '../model';
import { QueryBuilder, TransformBuilder, Operation } from '@orbit/data';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import {
  Grid,
  Paper,
  Typography,
  Button,
  IconButton,
  LinearProgress,
  TextareaAutosize,
  Tooltip,
  Checkbox,
  FormControlLabel,
  TextField,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@material-ui/core';
import useTodo from '../context/useTodo';
import PullIcon from '@material-ui/icons/GetAppOutlined';
import SkipBackIcon from '@material-ui/icons/FastRewind';
import PlayIcon from '@material-ui/icons/PlayArrow';
import PauseIcon from '@material-ui/icons/Pause';
import SkipAheadIcon from '@material-ui/icons/FastForward';
import HistoryIcon from '@material-ui/icons/History';
import TimerIcon from '@material-ui/icons/AccessTime';
import { FaAngleDoubleUp, FaAngleDoubleDown } from 'react-icons/fa';
import { Duration, formatTime } from '../control';
import UserAvatar from './UserAvatar';
import TranscribeReject from './TranscribeReject';
import { useSnackBar } from '../hoc/SnackBar';
import {
  sectionDescription,
  passageDescription,
  related,
  FontData,
  getFontData,
  UpdatePassageStateOps,
  remoteIdGuid,
  remoteIdNum,
} from '../crud';
import {
  relMouseCoords,
  insertAtCursor,
  useRemoteSave,
  logError,
  Severity,
  currentDateTime,
  getParatextDataPath,
} from '../utils';
import Auth from '../auth/Auth';
import { debounce } from 'lodash';
import { TaskItemWidth } from '../components/TaskTable';
import { LastEdit } from '../control';
import { UpdateRecord, UpdateRelatedRecord } from '../model/baseModel';
import { withData } from 'react-orbitjs';
import { IAxiosStatus } from '../store/AxiosStatus';
import * as action from '../store';
import { bindActionCreators } from 'redux';
import { translateParatextError } from '../utils/translateParatextError';

const MIN_SPEED = 0.5;
const MAX_SPEED = 2.0;
const SPEED_STEP = 0.1;
const PLAY_PAUSE_KEY = 'ESC';
const BACK_KEY = 'F2';
const AHEAD_KEY = 'F3';
const SLOWER_KEY = 'F4';
const FASTER_KEY = 'F5';
const HISTORY_KEY = 'F6';
const TIMER_KEY = 'F7';
const NON_BOX_HEIGHT = 304;

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
    progress: {
      flexGrow: 1,
      margin: theme.spacing(2),
      cursor: 'pointer',
    },
    row: {
      alignItems: 'center',
      whiteSpace: 'nowrap',
    },
    padRow: {
      paddingTop: '16px',
    },
    comment: {
      paddingTop: '16px',
      display: 'flex',
      flexDirection: 'column',
      flexGrow: 1,
      overflow: 'auto',
    },
    history: {
      overflow: 'auto',
    },
    button: {
      marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
    },
    player: {
      display: 'none',
    },
  })
);
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
    activityStateStr,
    sharedStr,
    mediaUrl,
    fetchMediaUrl,
    allBookData,
    selected,
    playing,
    setPlaying,
  } = useTodo();
  const {
    section,
    passage,
    duration,
    mediaRemoteId,
    mediaId,
    state,
    role,
  } = rowData[index] || {
    section: {} as Section,
    passage: {} as Passage,
    duration: 0,
    mediaRemoteId: '',
    mediaId: '',
    state: '',
    role: '',
  };
  const classes = useStyles();
  const [lang] = useGlobal('lang');
  const [memory] = useGlobal('memory');
  const [offline] = useGlobal('offline');
  const [project] = useGlobal('project');
  const [projType] = useGlobal('projType');
  const [plan] = useGlobal('plan');
  const [user] = useGlobal('user');
  const [projRole] = useGlobal('projRole');
  const [errorReporter] = useGlobal('errorReporter');
  const [busy] = useGlobal('remoteBusy');
  const [assigned, setAssigned] = useState('');
  const [changed, setChanged] = useGlobal('changed');
  const [doSave] = useGlobal('doSave');
  const [projData, setProjData] = useState<FontData>();
  const [fontStatus, setFontStatus] = useState<string>();
  const [playSpeed, setPlaySpeed] = useState(1);
  // playedSeconds is needed to update progress bar
  const [playedSeconds, setPlayedSeconds] = useState(0);
  // playedSecsRef is needed for autosave
  const playedSecsRef = React.useRef<number>(0);
  const stateRef = React.useRef<string>(state);
  const [totalSeconds, setTotalSeconds] = useState(duration);
  const [seeking, setSeeking] = useState(false);
  const [jump] = useState(2);
  const [transcribing] = useState(
    state === ActivityStates.Transcribing ||
      state === ActivityStates.TranscribeReady
  );
  const [height, setHeight] = useState(window.innerHeight);
  const [width, setWidth] = useState(window.innerWidth);
  const [boxHeight, setBoxHeight] = useState(height - NON_BOX_HEIGHT);
  const [textValue, setTextValue] = useState('');
  const [lastSaved, setLastSaved] = useState('');
  const [defaultPosition, setDefaultPosition] = useState(0.0);
  const { showMessage } = useSnackBar();
  const [makeComment, setMakeComment] = useState(false);
  const [comment, setComment] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [historyContent, setHistoryContent] = useState<any[]>();
  const [rejectVisible, setRejectVisible] = useState(false);
  const [hasParatextName, setHasParatextName] = useState(false);
  const [paratextProject, setParatextProject] = React.useState('');
  const [paratextIntegration, setParatextIntegration] = React.useState('');
  const transcriptionIn = React.useRef<string>();
  const saving = React.useRef(false);
  const [, saveCompleted] = useRemoteSave();

  const playerRef = React.useRef<any>();
  const progressRef = React.useRef<any>();
  const transcriptionRef = React.useRef<any>();
  const commentRef = React.useRef<any>();
  const autosaveTimer = React.useRef<NodeJS.Timeout>();
  const t = transcriberStr;
  const ta = activityStateStr;

  const getParatextIntegration = () => {
    const intfind = integrations.findIndex(
      (i) =>
        i.attributes &&
        i.attributes.name === (offline ? 'paratextLocal' : 'paratext')
    );
    if (intfind > -1) setParatextIntegration(integrations[intfind].id);
  };

  useEffect(() => {
    getParatextIntegration();

    setDimensions();
    const handleResize = debounce(() => {
      setDimensions();
    }, 100);

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  useEffect(() => {
    if (doSave) {
      handleSave();
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [doSave]);

  useEffect(() => {
    if (!makeComment) setComment('');
    const commentHeight =
      commentRef && commentRef.current ? commentRef.current.clientHeight : 0;
    const newBoxHeight = height - NON_BOX_HEIGHT - commentHeight;
    if (newBoxHeight !== boxHeight) setBoxHeight(newBoxHeight);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [height, makeComment, comment, commentRef.current]);

  useEffect(() => {
    showTranscription(getTranscription());
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
      save(passage.attributes.state, 0, t.pullParatextStatus);
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
    if (passage?.id && !saving.current) {
      loadHistory();
    }
    const newAssigned = rowData[index]?.assigned;
    if (newAssigned !== assigned) setAssigned(newAssigned);
    stateRef.current = rowData[index]?.state;
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [index, rowData]);

  useEffect(() => {
    if (totalSeconds && (!duration || duration !== Math.ceil(totalSeconds))) {
      const mediaRecs = memory.cache.query((q: QueryBuilder) =>
        q.findRecords('mediafile')
      ) as MediaFile[];
      const oldRec = mediaRecs.filter((m) => m.id === mediaId);
      if (oldRec.length > 0)
        memory.update((t: TransformBuilder) =>
          t.replaceAttribute(oldRec[0], 'duration', Math.ceil(totalSeconds))
        );
      console.log(`update duration to ${Math.ceil(totalSeconds)}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration, totalSeconds]);

  useEffect(() => {
    if (!offline) {
      if (!paratext_usernameStatus && projType === 'Scripture') {
        getUserName(auth, errorReporter, '');
      }
      setHasParatextName(paratext_username !== '');
    } else setHasParatextName(true);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [paratext_username, paratext_usernameStatus]);

  const handleChange = (e: any) => {
    setTextValue(e.target.value);
    if (!changed) setChanged(true);
  };
  const handlePlayStatus = (status: boolean) => () => setPlaying(status);
  const loadStatus = (status: string) => {
    setFontStatus(status);
  };
  const handleReady = () => {
    if (defaultPosition > 0) {
      playerRef.current.seekTo(defaultPosition);
      setDefaultPosition(0);
    }
  };
  const handleProgress = (ctrl: any) => {
    if (!seeking) {
      if (!totalSeconds || totalSeconds < ctrl.loadedSeconds) {
        setTotalSeconds(ctrl.loadedSeconds);
      } else {
        setTotalSeconds(duration);
      }
      setPlayedSeconds(ctrl.playedSeconds);
      playedSecsRef.current = ctrl.playedSeconds;
    }
  };
  const handleMouseDown = () => {
    setSeeking(true);
  };
  const handleMouseUp = (e: React.MouseEvent) => {
    setSeeking(false);
    if (progressRef.current && playerRef.current) {
      const clientWidth = progressRef.current.clientWidth;
      const { x } = relMouseCoords(e, progressRef.current);
      playerRef.current.seekTo(x / clientWidth);
    }
  };
  const handleJumpFn = (amount: number) => {
    if (!playerRef.current) return;
    if (amount > 0) {
      playerRef.current.seekTo(Math.min(playedSeconds + amount, totalSeconds));
    } else {
      playerRef.current.seekTo(Math.max(playedSeconds + amount, 0));
    }
  };
  const handleJumpEv = (amount: number) => () => handleJumpFn(amount);
  const rnd1 = (val: number) => Math.round(val * 10) / 10;
  const handleSlower = () => {
    if (playSpeed > MIN_SPEED) setPlaySpeed(rnd1(playSpeed - SPEED_STEP));
  };
  const handleFaster = () => {
    if (playSpeed < MAX_SPEED) setPlaySpeed(rnd1(playSpeed + SPEED_STEP));
  };
  const handleMakeComment = () => setMakeComment(!makeComment);
  const handleCommentChange = (e: any) => {
    setComment(e.target.value);
  };
  const handleShowHistory = () => setShowHistory(!showHistory);
  const handleTimer = () => {
    if (transcriptionRef.current) {
      transcriptionRef.current.firstChild.focus();
      const timeStamp = '(' + formatTime(playedSeconds) + ')';
      const textArea = transcriptionRef.current
        .firstChild as HTMLTextAreaElement;
      insertAtCursor(textArea, timeStamp);
    }
  };
  const handlePullParatext = () => {
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

  const handleReject = () => {
    if (busy) {
      showMessage(t.saving);
      return;
    }
    setMakeComment(true);
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

  const next: { [key: string]: string } = {
    incomplete: ActivityStates.Transcribed,
    transcribing: ActivityStates.Transcribed,
    reviewing: ActivityStates.Approved,
    transcribeReady: ActivityStates.Transcribed,
    transcribed: ActivityStates.Approved,
    needsNewTranscription: ActivityStates.Transcribed,
  };
  const getType = () => {
    const planRec = memory.cache.query((q: QueryBuilder) =>
      q.findRecord({ type: 'plan', id: plan })
    ) as Plan;
    const planTypeId = related(planRec, 'plantype');
    if (!planTypeId) return null;
    const planTypeRec = memory.cache.query((q: QueryBuilder) =>
      q.findRecord({ type: 'plantype', id: planTypeId })
    ) as PlanType;
    const planType =
      planTypeRec &&
      planTypeRec.attributes &&
      planTypeRec.attributes.name &&
      planTypeRec.attributes.name.toLowerCase();
    return planType;
  };
  const handleSubmit = async () => {
    if (next.hasOwnProperty(state)) {
      let nextState = next[state];
      if (nextState === ActivityStates.Approved && getType() !== 'scripture')
        nextState = ActivityStates.Done;
      await save(nextState, 0, comment);
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

  const handleAssign = async () => {
    const secRec = memory.cache.query((q: QueryBuilder) =>
      q.findRecord(section)
    );
    const role = stateRole[stateRef.current];
    if (role) {
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

  const handleSave = async (postComment: boolean = false) => {
    //this needs to use the refs because it is called from a timer, which
    //apparently remembers the values when it is kicked off...not when it is run
    await save(
      nextOnSave[stateRef.current] ?? stateRef.current,
      playedSecsRef.current,
      postComment ? comment : undefined
    );
  };

  const save = async (
    nextState: string,
    newPosition: number,
    thiscomment: string | undefined
  ) => {
    if (transcriptionRef.current) {
      saving.current = true;
      let transcription = transcriptionRef.current.firstChild.value;
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
        memory
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
            },
          } as MediaFile,
          user
        )
      );
      //have to do this before the mediafiles useEffect kicks in
      transcriptionIn.current = transcription;
      await memory
        .update(ops)
        .then(() => {
          //we come here before we get an error because we're non-blocking
          if (thiscomment) setComment('');
          loadHistory();
          saveCompleted('');
          setLastSaved(currentDateTime());
          saving.current = false;
          handleAssign();
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
    handleSave(true);
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

  const handleReopen = async () => {
    if (busy) {
      showMessage(t.saving);
      return;
    }
    if (previous.hasOwnProperty(state)) {
      await memory.update(
        UpdatePassageStateOps(
          passage.id,
          section.id,
          plan,
          previous[state],
          comment,
          user,
          new TransformBuilder(),
          [],
          memory
        )
      );
      setComment('');
      setLastSaved(currentDateTime());
    }
  };
  const handleKey = (e: React.KeyboardEvent) => {
    const PlayPauseKey = keycode(PLAY_PAUSE_KEY);
    const JumpBackKey = keycode(BACK_KEY);
    const JumpAheadKey = keycode(AHEAD_KEY);
    const SlowerKey = keycode(SLOWER_KEY);
    const FasterKey = keycode(FASTER_KEY);
    const HistoryKey = keycode(HISTORY_KEY);
    const TimerKey = keycode(TIMER_KEY);
    switch (e.keyCode) {
      case PlayPauseKey:
        setPlaying(!playing);
        e.preventDefault();
        return;
      case JumpBackKey:
        handleJumpFn(-1 * jump);
        e.preventDefault();
        return;
      case JumpAheadKey:
        handleJumpFn(jump);
        e.preventDefault();
        return;
      case SlowerKey:
        handleSlower();
        e.preventDefault();
        return;
      case FasterKey:
        handleFaster();
        e.preventDefault();
        return;
      case HistoryKey:
        handleShowHistory();
        e.preventDefault();
        return;
      case TimerKey:
        handleTimer();
        e.preventDefault();
    }
  };

  const setDimensions = () => {
    setHeight(window.innerHeight);
    setWidth(window.innerWidth - TaskItemWidth - 16);
  };

  const getTranscription = () => {
    const mediaRec = mediafiles.filter((m) => m.id === mediaId);
    if (mediaRec.length > 0 && mediaRec[0] && mediaRec[0].attributes) {
      const attr = mediaRec[0].attributes;
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
    if (transcriptionRef.current) transcriptionRef.current.firstChild.focus();
    setLastSaved(passage.attributes?.dateUpdated || '');
    setComment(passage.attributes?.lastComment || '');
    setTotalSeconds(duration);
    if (mediaRemoteId && mediaRemoteId !== '') {
      fetchMediaUrl(mediaRemoteId, memory, offline, auth);
    }
  };

  const handleAutosave = async () => {
    if (
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
  const historyStyle = { height: boxHeight };

  moment.locale(lang);
  const curZone = moment.tz.guess();
  const userFromId = (psc: PassageStateChange): User => {
    var id = related(psc, 'lastModifiedByUser');
    if (!id) {
      id = remoteIdGuid(
        'user',
        psc.attributes.lastModifiedBy.toString(),
        memory.keyMap
      );
    }
    if (!id) {
      return {
        id: '',
        attributes: { avatarUrl: null, name: 'Unknown', familyName: '' },
      } as any;
    }
    const user = memory.cache.query((q: QueryBuilder) =>
      q.findRecord({ type: 'user', id })
    ) as User;
    return user;
  };
  const nameFromId = (psc: PassageStateChange) => {
    const user = userFromId(psc);
    return user ? user.attributes.name : '';
  };
  const historyItem = (
    psc: PassageStateChange,
    comment: JSX.Element | string
  ) => {
    return (
      <ListItem key={`${psc.id}-${comment}`}>
        <ListItemIcon>
          <UserAvatar {...props} userRec={userFromId(psc)} />
        </ListItemIcon>
        <ListItemText
          primary={
            <>
              <Typography variant="h6" component="span">
                {nameFromId(psc)}
              </Typography>
              {'\u00A0\u00A0 '}
              <Typography component="span">
                {moment
                  .tz(moment.tz(psc.attributes.dateCreated, 'utc'), curZone)
                  .calendar()}
              </Typography>
            </>
          }
          secondary={comment}
        />
      </ListItem>
    );
  };

  const historyList = (passageStateChanges: PassageStateChange[]) => {
    const results: Array<JSX.Element> = [];
    let curState: ActivityStates;
    let curComment = '';
    passageStateChanges
      .sort((i, j) =>
        i.attributes.dateCreated < j.attributes.dateCreated ? -1 : 1
      )
      .forEach((psc) => {
        const comment = psc.attributes.comments;
        if (comment && comment !== '' && comment !== curComment) {
          curComment = comment;
          results.push(
            historyItem(psc, <span style={{ color: 'black' }}>{comment}</span>)
          );
        }
        if (psc.attributes.state !== curState) {
          curState = psc.attributes.state;
          results.push(historyItem(psc, ta.getString(curState)));
        }
      });
    return results;
  };

  const loadHistory = async () => {
    const recs = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('passagestatechange')
    ) as PassageStateChange[];
    if (recs && passage?.id) {
      const curStateChanges = recs.filter(
        (r) => related(r, 'passage') === passage.id
      );
      setHistoryContent(historyList(curStateChanges));
    }
  };
  return (
    <div className={classes.root}>
      <Paper className={classes.paper} onKeyDown={handleKey} style={paperStyle}>
        <Grid container direction="column">
          <Grid container direction="row" className={classes.row}>
            <Grid item xs={9} className={classes.description}>
              {sectionDescription(section)}
            </Grid>
            <Grid item>{passageDescription(passage, allBookData)}</Grid>
          </Grid>
          <Grid container direction="row" className={classes.row}>
            <Grid item>
              <Typography>
                <Duration seconds={playedSeconds} /> {' / '}
                <Duration seconds={totalSeconds} />
              </Typography>
            </Grid>
            <Grid item xs>
              <div className={classes.progress}>
                <LinearProgress
                  ref={progressRef}
                  variant="determinate"
                  value={Math.min((playedSeconds * 100) / totalSeconds, 100)}
                  onMouseDown={handleMouseDown}
                  onMouseUp={handleMouseUp}
                />
              </div>
            </Grid>
          </Grid>
          <Grid container direction="row" className={classes.row}>
            {role === 'transcriber' && hasParatextName && paratextProject && (
              <Grid item>
                <Tooltip title={t.pullParatextTip}>
                  <span>
                    <IconButton
                      onClick={handlePullParatext}
                      disabled={selected === ''}
                    >
                      <>
                        <PullIcon />{' '}
                        <Typography>{t.pullParatextCaption}</Typography>
                      </>
                    </IconButton>
                  </span>
                </Tooltip>
              </Grid>
            )}
            <Grid item xs>
              <Grid container justify="center">
                <Tooltip title={t.backTip.replace('{0}', BACK_KEY)}>
                  <span>
                    <IconButton
                      onClick={handleJumpEv(-1 * jump)}
                      disabled={selected === ''}
                    >
                      <>
                        <SkipBackIcon /> <Typography>{BACK_KEY}</Typography>
                      </>
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip
                  title={(playing ? t.playTip : t.pauseTip).replace(
                    '{0}',
                    PLAY_PAUSE_KEY
                  )}
                >
                  <span>
                    <IconButton
                      onClick={handlePlayStatus(!playing)}
                      disabled={selected === ''}
                    >
                      <>
                        {playing ? <PauseIcon /> : <PlayIcon />}{' '}
                        <Typography>{PLAY_PAUSE_KEY}</Typography>
                      </>
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title={t.aheadTip.replace('{0}', AHEAD_KEY)}>
                  <span>
                    <IconButton
                      onClick={handleJumpEv(jump)}
                      disabled={selected === ''}
                    >
                      <>
                        <SkipAheadIcon /> <Typography>{AHEAD_KEY}</Typography>
                      </>
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title={t.slowerTip.replace('{0}', SLOWER_KEY)}>
                  <span>
                    <IconButton
                      onClick={handleSlower}
                      disabled={selected === ''}
                    >
                      <>
                        <FaAngleDoubleDown />{' '}
                        <Typography>{SLOWER_KEY}</Typography>
                      </>
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title={t.fasterTip.replace('{0}', FASTER_KEY)}>
                  <span>
                    <IconButton
                      onClick={handleFaster}
                      disabled={selected === ''}
                    >
                      <>
                        <FaAngleDoubleUp />{' '}
                        <Typography>{FASTER_KEY}</Typography>
                      </>
                    </IconButton>
                  </span>
                </Tooltip>
              </Grid>
            </Grid>
            <Grid item>
              <Tooltip title={t.historyTip.replace('{0}', HISTORY_KEY)}>
                <span>
                  <IconButton
                    onClick={handleShowHistory}
                    disabled={historyContent === undefined}
                  >
                    <>
                      <HistoryIcon /> <Typography>{HISTORY_KEY}</Typography>
                    </>
                  </IconButton>
                </span>
              </Tooltip>

              <Tooltip title={t.timerTip.replace('{0}', TIMER_KEY)}>
                <span>
                  <IconButton
                    onClick={handleTimer}
                    disabled={selected === '' || role === 'view' || playing}
                  >
                    <>
                      <TimerIcon /> <Typography>{TIMER_KEY}</Typography>
                    </>
                  </IconButton>
                </span>
              </Tooltip>
            </Grid>
          </Grid>
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
                    value={textValue}
                    readOnly={selected === '' || role === 'view'}
                    style={textAreaStyle}
                    onChange={handleChange}
                  />
                </WebFontLoader>
              ) : (
                <TextareaAutosize
                  value={textValue}
                  readOnly={selected === '' || role === 'view'}
                  style={textAreaStyle}
                  onChange={handleChange}
                />
              )}
            </Grid>
            {showHistory && (
              <Grid item xs={6} container direction="column">
                <List style={historyStyle} className={classes.history}>
                  {historyContent}
                </List>
              </Grid>
            )}
          </Grid>
          <Grid container direction="row">
            {makeComment && (
              <TextField
                ref={commentRef}
                label={t.comment}
                variant="filled"
                multiline
                rowsMax={5}
                className={classes.comment}
                value={comment}
                onChange={handleCommentChange}
              />
            )}
          </Grid>
          <Grid container direction="row" className={classes.padRow}>
            <Grid item>
              <FormControlLabel
                control={
                  <Checkbox
                    value={makeComment}
                    onChange={handleMakeComment}
                    disabled={selected === ''}
                    color="primary"
                  />
                }
                label={t.makeComment}
              />
            </Grid>
            <Grid item xs>
              <Grid container justify="flex-end">
                <div>
                  <LastEdit when={lastSaved} t={sharedStr} />
                  {role !== 'view' ? (
                    <>
                      <Button
                        variant="outlined"
                        color="primary"
                        className={classes.button}
                        onClick={handleReject}
                        disabled={selected === '' || playing}
                      >
                        {t.reject}
                      </Button>
                      <Tooltip
                        title={transcribing ? t.saveTip : t.saveReviewTip}
                      >
                        <span>
                          <Button
                            variant="outlined"
                            color="primary"
                            className={classes.button}
                            onClick={handleSaveButton}
                            disabled={selected === '' || playing}
                          >
                            {t.save}
                          </Button>
                        </span>
                      </Tooltip>
                      <Tooltip
                        title={
                          transcribing
                            ? t.submitTranscriptionTip
                            : t.submitReviewTip
                        }
                      >
                        <span>
                          <Button
                            variant="contained"
                            color="primary"
                            className={classes.button}
                            onClick={handleSubmit}
                            disabled={selected === '' || playing}
                          >
                            {t.submit}
                          </Button>
                        </span>
                      </Tooltip>
                    </>
                  ) : (
                    <Button
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
        <TranscribeReject
          visible={rejectVisible}
          passageIn={passage}
          editMethod={handleRejected}
          cancelMethod={handleRejectCancel}
        />
      </Paper>
      <div className={classes.player}>
        <ReactPlayer
          ref={playerRef}
          url={mediaUrl}
          controls={true}
          onEnded={handlePlayStatus(false)}
          playbackRate={playSpeed}
          playing={playing}
          onProgress={handleProgress}
          onReady={handleReady}
        />
      </div>
    </div>
  );
}

export default withData(mapRecordsToProps)(
  connect(mapStateToProps, mapDispatchToProps)(Transcriber) as any
) as any;
