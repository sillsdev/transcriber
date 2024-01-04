import {
  useState,
  ChangeEvent,
  MouseEvent,
  useEffect,
  useRef,
  useContext,
  useMemo,
} from 'react';
import {
  IconButton,
  InputLabel,
  InputAdornment,
  FormControl,
  Typography,
  TypographyProps,
  Tooltip,
  TextField,
  FormControlLabel,
} from '@mui/material';
// import SendIcon from '@mui/icons-material/Send';
import MicIcon from '@mui/icons-material/MicOutlined';
import PlayIcon from '@mui/icons-material/PlayArrow';
import CancelIcon from '@mui/icons-material/CancelOutlined';
import CheckIcon from '@mui/icons-material/Check';
import { styled } from '@mui/material';
import { useSelector, shallowEqual, useDispatch } from 'react-redux';
import * as actions from '../store';
import { IMediaTitleStrings } from '../model';
import { useSnackBar } from '../hoc/SnackBar';
import { mediaTitleSelector, pickerSelector } from '../selector';
import { waitForIt } from '../utils';
import MediaRecord from '../components/MediaRecord';
import MediaPlayer from '../components/MediaPlayer';
import {
  ArtifactTypeSlug,
  pullTableList,
  remoteId,
  remoteIdGuid,
  remoteIdNum,
  useArtifactType,
  useOfflnMediafileCreate,
} from '../crud';
import { useGlobal } from 'reactn';
import { TokenContext } from '../context/TokenProvider';
import { UploadType } from '../components/MediaUpload';
import { LanguagePicker } from 'mui-language-picker';
import { ILanguage } from './Language';
import { UnsavedContext } from '../context/UnsavedContext';
import JSONAPISource from '@orbit/jsonapi';
import IndexedDBSource from '@orbit/indexeddb';
import { RecordKeyMap } from '@orbit/records';

const ColumnDiv = styled('div')(() => ({
  display: 'flex',
  flexDirection: 'column',
}));

const StatusMessage = styled(Typography)<TypographyProps>(({ theme }) => ({
  marginRight: theme.spacing(2),
  alignSelf: 'center',
  color: theme.palette.primary.dark,
}));

interface IProps {
  titlekey: string;
  label: string;
  mediaId: string;
  title: string;
  defaultFilename: string;
  language?: ILanguage;
  onTextChange?: (txt: string) => string;
  onLangChange?: (lang: ILanguage) => void;
  useplan?: string;
  helper?: string;
  /*
  canRecord: () => boolean;
  onOk: (row: ITitle) => void;
  onCancel: () => void;
  setCanSaveRecording: (canSave: boolean) => void;
  onSetRecordRow: (row: ITitle | undefined) => void;
  */
  onRecording?: (recording: boolean) => void;
  onMediaIdChange: (mediaId: string) => void;
  disabled?: boolean;
}

export default function MediaTitle(props: IProps) {
  const {
    titlekey,
    label,
    mediaId,
    title,
    defaultFilename,
    language,
    helper,
    onTextChange,
    onLangChange,
    onRecording,
    onMediaIdChange,
    useplan,
    disabled,
  } = props;
  const dispatch = useDispatch();
  const uploadFiles = (files: File[]) => dispatch(actions.uploadFiles(files));
  const nextUpload = (props: actions.NextUploadProps) =>
    dispatch(actions.nextUpload(props));
  const uploadComplete = () => {
    setShowRecorder(false);
    dispatch(actions.uploadComplete);
  };
  const [plan] = useGlobal('plan');
  const [memory] = useGlobal('memory');
  const [reporter] = useGlobal('errorReporter');
  const [coordinator] = useGlobal('coordinator');
  const remote = coordinator.getSource('remote') as JSONAPISource;
  const backup = coordinator.getSource('backup') as IndexedDBSource;
  const [user] = useGlobal('user');
  const [offline] = useGlobal('offline');
  const [offlineOnly] = useGlobal('offlineOnly');
  const [canSaveRecording, setCanSaveRecording] = useState(false);
  const canSaveRef = useRef(false);
  const [curText, setCurText] = useState(title ?? '');
  const [startRecord, setStartRecord] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [helperText, setHelperText] = useState('');
  const fileList = useRef<File[]>();
  const [showRecorder, setShowRecorder] = useState(false);
  const langRef = useRef(language);
  const [recording, setRecording] = useState(false);
  const [playing, setPlaying] = useState(false);
  // const [myChanged, setMyChanged] = useState(false);
  const { getTypeId } = useArtifactType();
  const tokenCtx = useContext(TokenContext);
  const { accessToken } = tokenCtx.state;
  const langEl = useRef<any>();
  const t: IMediaTitleStrings = useSelector(mediaTitleSelector, shallowEqual);
  const saving = useRef(false);
  const lt = useSelector(pickerSelector, shallowEqual);
  const { showMessage } = useSnackBar();
  const {
    toolChanged,
    toolsChanged,
    startSave,
    saveRequested,
    saveCompleted,
    clearRequested,
    clearCompleted,
    // isChanged,
  } = useContext(UnsavedContext).state;
  const mediaIdRef = useRef<string>();
  const { createMedia } = useOfflnMediafileCreate();

  useEffect(() => setHelperText(helper ?? ''), [helper]);
  useEffect(() => {
    if (saveRequested(toolId) && !saving.current) {
      if (canSaveRef.current) handleOk();
      else {
        saveCompleted(toolId);
      }
    } else if (clearRequested(toolId)) {
      reset();
      clearCompleted(toolId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolsChanged, canSaveRecording]);

  const getPlanId = () => {
    if (useplan)
      return (
        remoteIdNum('plan', useplan, memory.keyMap as RecordKeyMap) || useplan
      );
    return remoteIdNum('plan', plan, memory.keyMap as RecordKeyMap) || plan;
  };
  const TitleId = useMemo(() => {
    var id = getTypeId(ArtifactTypeSlug.Title) as string;
    return remoteId('artifacttype', id, memory.keyMap as RecordKeyMap) || id;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offlineOnly]);

  const toolId = useMemo(() => 'MediaTitle-' + titlekey, [titlekey]);
  const recToolId = useMemo(() => toolId + 'rec', [toolId]);

  useEffect(() => {
    setCurText(title ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  useEffect(() => {
    langRef.current = language;
    if (language) setLanguageTitle(language);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  const handleSetCanSave = (valid: boolean) => {
    if (valid !== canSaveRef.current) {
      canSaveRef.current = valid;
      setCanSaveRecording(valid);
      //if (valid) onChanged(true);
    }
  };

  const afterUploadCb = async (mediaId: string) => {
    if (mediaId) {
      waitForIt(
        'mediaId',
        () =>
          offlineOnly ||
          remoteIdGuid('mediafile', mediaId, memory.keyMap as RecordKeyMap) !==
            undefined,
        () => false,
        100
      ).then(() => {
        onMediaIdChange(
          remoteIdGuid('mediafile', mediaId, memory.keyMap as RecordKeyMap) ??
            mediaId
        );
        reset();
      });
    } else reset();
  };
  const onMyRecording = (r: boolean) => {
    if (r) {
      toolChanged(toolId, true);
      toolChanged(recToolId, true);
    }
    setRecording(r);
    onRecording && onRecording(r);
  };

  const handleTextChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (recording) {
      showMessage(t.recording);
      return;
    }
    setCurText(e.target.value);
    if (onTextChange && e.target.value !== title) {
      var err = onTextChange(e.target.value);
      setHelperText(err);
    }
  };
  const onBlur = () => {
    if (language) return;
    if (onTextChange && curText !== title) {
      var err = onTextChange(curText);
      setHelperText(err);
    }
  };

  const handlePlay = (e: any) => {
    e.stopPropagation();
    setPlaying(true);
  };
  const handleRecord = (e: any) => {
    e.stopPropagation();
    setPlaying(false);
    setStartRecord(true);
  };
  const setLanguageTitle = (lang: ILanguage) =>
    setCurText(lang.bcp47 ? `${lang.languageName} (${lang.bcp47})` : '');

  const setCode = (bcp47: string) => {
    if (langRef.current) {
      langRef.current = { ...langRef.current, bcp47 };
      setLanguageTitle(langRef.current);
      onLangChange && onLangChange(langRef.current);
    }
  };
  const setLangname = (languageName: string) => {
    if (langRef.current) {
      langRef.current = { ...langRef.current, languageName };
      setLanguageTitle(langRef.current);
      onLangChange && onLangChange(langRef.current);
    }
  };
  const setFont = (font: string) => {
    if (langRef.current) {
      langRef.current = { ...langRef.current, font };
      onLangChange && onLangChange(langRef.current);
    }
  };
  const handleOk = (e?: any) => {
    e?.stopPropagation();
    if (saving.current) {
      showMessage(t.saving);
      return;
    }
    saving.current = true;
    if (onRecording && !saveRequested(recToolId)) {
      startSave(recToolId);
    }
    setStatusText(t.saving);
    onMyRecording(false);
  };

  const handleLangPick = (e: any) => {
    langEl.current?.click();
    e.stopPropagation();
  };

  const reset = () => {
    setRecording(false);
    setShowRecorder(false);
    setStatusText('');
    saving.current = false;
    setCanSaveRecording(false);
    onMyRecording(false);
    toolChanged(toolId, false);
    toolChanged(recToolId, false);
  };

  const handleCancel = (e: any) => {
    onMediaIdChange(mediaId);
    e.stopPropagation();
    reset();
  };
  const getUserId = () =>
    remoteIdNum('user', user || '', memory.keyMap as RecordKeyMap) || user;

  const itemComplete = async (n: number, success: boolean, data?: any) => {
    const uploadList = fileList.current;
    if (!uploadList) return; // This should never happen
    if (data?.stringId) {
      mediaIdRef.current = data?.stringId;
    } else if (success && data) {
      // offlineOnly
      var num = 1;
      mediaIdRef.current = (
        await createMedia(data, num, uploadList[n].size, '', TitleId, '', user)
      ).id;
    }
    if (!offline && mediaIdRef.current) {
      pullTableList(
        'mediafile',
        Array(mediaIdRef.current),
        memory,
        remote,
        backup,
        reporter
      ).then(() => {
        uploadComplete();
        afterUploadCb(mediaIdRef.current ?? '');
      });
    } else {
      uploadComplete();
      afterUploadCb(mediaIdRef.current ?? '');
    }
  };

  const uploadMedia = async (files: File[]) => {
    uploadFiles(files);
    fileList.current = files;
    const mediaFile = {
      planId: getPlanId(),
      versionNumber: 1,
      originalFile: files[0].name,
      contentType: files[0].type,
      artifactTypeId: TitleId,
      recordedByUserId: getUserId(),
      userId: getUserId(),
    };
    nextUpload({
      record: mediaFile,
      files,
      n: 0,
      token: accessToken || '',
      offline: offline,
      errorReporter: undefined, //TODO
      uploadType: UploadType.Media,
      cb: itemComplete,
    });
  };
  useEffect(() => {
    if (startRecord)
      waitForIt(
        'stop playing',
        () => !playing, //canRecord(),
        () => false,
        100
      ).finally(() => {
        setStartRecord(false);
        setShowRecorder(true);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startRecord, playing]);

  const handleMouseDownSave = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  const playEnded = () => {
    setPlaying(false);
  };
  const TitleText = useMemo(
    () => (
      <TextField
        id={`${titlekey}adornment`}
        label={label}
        value={curText}
        onClick={language ? handleLangPick : undefined}
        onChange={handleTextChange}
        onBlur={onBlur}
        helperText={helperText}
        size="small"
        multiline
        disabled={disabled}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <>
                {mediaId && (
                  <IconButton
                    id={`${titlekey}play`}
                    aria-label="play"
                    onClick={handlePlay}
                    onMouseDown={handleMouseDownSave}
                    disabled={recording}
                    edge="start"
                  >
                    <PlayIcon fontSize="small" />
                  </IconButton>
                )}
                {onRecording && !disabled && (
                  <Tooltip title={t.record}>
                    <IconButton
                      id={`${titlekey}record`}
                      aria-label="record"
                      onClick={handleRecord}
                      onMouseDown={handleMouseDownSave}
                      disabled={recording}
                      edge="start"
                    >
                      <MicIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </>
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <>
                {canSaveRecording && (
                  <Tooltip title={t.save}>
                    <span>
                      <IconButton
                        id={`${titlekey}save`}
                        aria-label="save title"
                        onClick={handleOk}
                        onMouseDown={handleMouseDownSave}
                        disabled={recording}
                        edge="end"
                      >
                        <CheckIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                )}
                {showRecorder && (
                  <Tooltip title={t.cancel}>
                    <span>
                      <IconButton
                        id={`${titlekey}cancel`}
                        aria-label="cancel title"
                        onClick={handleCancel}
                        onMouseDown={handleMouseDownSave}
                        disabled={recording}
                        edge="end"
                      >
                        <CancelIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                )}
              </>
            </InputAdornment>
          ),
        }}
      />
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [curText, recording, mediaId, canSaveRecording, disabled, helperText]
  );

  return (
    <ColumnDiv>
      <FormControl
        sx={{ width: 'max-content', py: 1 }}
        variant="outlined"
        disabled={disabled}
      >
        <InputLabel htmlFor={`${titlekey}adornment`}>{'\u200B'}</InputLabel>
        {TitleText}
        {language && (
          <FormControlLabel
            sx={{ display: 'none' }}
            id={`${titlekey}language`}
            ref={langEl}
            control={
              <LanguagePicker
                value={language.bcp47}
                name={language.languageName}
                font={language.font}
                setCode={setCode}
                setName={setLangname}
                setFont={setFont}
                t={lt}
              />
            }
            label=""
          />
        )}
      </FormControl>
      {showRecorder && (
        <MediaRecord
          toolId={recToolId}
          onRecording={onMyRecording}
          uploadMethod={uploadMedia}
          defaultFilename={defaultFilename}
          allowWave={false}
          showFilename={false}
          setCanSave={handleSetCanSave}
          setStatusText={setStatusText}
          size={200}
          autoStart={true}
        />
      )}
      <MediaPlayer
        srcMediaId={mediaId || ''}
        requestPlay={playing}
        onEnded={playEnded}
      />
      <StatusMessage variant="caption">{statusText}</StatusMessage>
    </ColumnDiv>
  );
}
