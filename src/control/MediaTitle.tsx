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
  idPrefix?: string;
  titlekey: string;
  label: string;
  mediaId: string;
  title: string;
  defaultFilename: string;
  language?: ILanguage;
  onTextChange?: (txt: string) => string;
  onLangChange?: (lang: ILanguage) => void;
  useplan?: string;
  /*
  canRecord: () => boolean;
  onOk: (row: ITitle) => void;
  onCancel: () => void;
  setCanSaveRecording: (canSave: boolean) => void;
  onSetRecordRow: (row: ITitle | undefined) => void;
  */
  onRecording: (recording: boolean) => void;
  onMediaIdChange: (mediaId: string) => void;
}

export default function MediaTitle(props: IProps) {
  const {
    idPrefix,
    titlekey,
    label,
    mediaId,
    title,
    defaultFilename,
    language,
    onTextChange,
    onLangChange,
    onRecording,
    onMediaIdChange,
    useplan,
  } = props;
  const dispatch = useDispatch();
  const uploadFiles = (files: File[]) => dispatch(actions.uploadFiles(files));
  const nextUpload = (props: actions.NextUploadProps) =>
    dispatch(actions.nextUpload(props));
  const uploadComplete = () => {
    doRecordRef.current = false;
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
  const [curText, setCurText] = useState(title ?? '');
  const [startRecord, setStartRecord] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [helperText, setHelperText] = useState('');
  const fileList = useRef<File[]>();
  const doRecordRef = useRef(false);
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
    clearRequested,
    clearCompleted,
    // isChanged,
  } = useContext(UnsavedContext).state;
  const mediaIdRef = useRef<string>();
  const { createMedia } = useOfflnMediafileCreate();

  useEffect(() => {
    if (saveRequested(toolId) && canSaveRecording) handleOk();
    else if (clearRequested(toolId)) {
      reset();
      clearCompleted(toolId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolsChanged, canSaveRecording]);

  const getPlanId = () => {
    if (useplan) return remoteIdNum('plan', useplan, memory.keyMap) || useplan;
    return remoteIdNum('plan', plan, memory.keyMap) || plan;
  };
  const TitleId = useMemo(() => {
    var id = getTypeId(ArtifactTypeSlug.Title) as string;
    return remoteId('artifacttype', id, memory.keyMap) || id;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offlineOnly]);

  const toolId = useMemo(() => 'MediaTitle' + titlekey, [titlekey]);
  const recToolId = useMemo(() => toolId + 'rec', [toolId]);

  useEffect(() => {
    setCurText(title ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  const handleSetCanSave = (valid: boolean) => {
    if (valid !== canSaveRecording) {
      setCanSaveRecording(valid);
      //if (valid) onChanged(true);
    }
  };

  const afterUploadCb = async (mediaId: string) => {
    console.log('afterUploadCb', toolId, mediaId);
    if (mediaId) {
      waitForIt(
        'mediaId',
        () =>
          offlineOnly ||
          remoteIdGuid('mediafile', mediaId, memory.keyMap) !== undefined,
        () => false,
        100
      ).then(() => {
        onMediaIdChange(
          remoteIdGuid('mediafile', mediaId, memory.keyMap) ?? mediaId
        );
        toolChanged(toolId, false);
        reset();
      });
    }
  };
  const onMyRecording = (r: boolean) => {
    if (doRecordRef.current) setRecording(false);
    if (r) {
      toolChanged(toolId, true);
      toolChanged(recToolId, true);
    }
    setRecording(r);
    onRecording(r);
  };

  const handleTextChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (recording) {
      showMessage(t.recording);
      return;
    }
    setCurText(e.target.value);
    if (language) return;
    if (onTextChange) {
      var err = onTextChange(e.target.value);
      console.log('text change', err);
      setHelperText(err);
    }
  };

  const handlePlay = (e: any) => {
    e.stopPropagation();
    setPlaying(true);
  };
  const handleRecord = (e: any) => {
    e.stopPropagation();
    if (getPlanId() === '') {
      showMessage(t.noplan);
      return;
    }
    setPlaying(false);
    setStartRecord(true);
  };
  const setCode = (bcp47: string) => {
    setCurText(bcp47);
    if (langRef.current) {
      langRef.current = { ...langRef.current, bcp47 };
      onLangChange && onLangChange(langRef.current);
    }
  };
  const setLangname = (languageName: string) => {
    if (langRef.current) {
      langRef.current = { ...langRef.current, languageName };
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
    if (!saveRequested(recToolId)) {
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
    setStatusText('');
    doRecordRef.current = false;
    saving.current = false;
    onMyRecording(false);
  };

  const handleCancel = (e: any) => {
    e.stopPropagation();
    toolChanged(recToolId, false);
    reset();
  };
  const getUserId = () =>
    remoteIdNum('user', user || '', memory.keyMap) || user;

  const itemComplete = async (n: number, success: boolean, data?: any) => {
    console.log('itemComplete', n, success, data);
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
      try {
        waitForIt(
          'stop playing',
          () => true, //canRecord(),
          () => false,
          100
        ).then(() => {
          doRecordRef.current = true;
          setStartRecord(false);
        });
      } catch {
        //do it anyway...
        doRecordRef.current = true;
        setStartRecord(false);
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startRecord, playing]);

  const handleMouseDownSave = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  const hasContent = () => doRecordRef.current || Boolean(curText);
  const playEnded = () => {
    setPlaying(false);
  };
  return (
    <ColumnDiv>
      <FormControl sx={{ width: 'max-content', py: 1 }} variant="outlined">
        <InputLabel htmlFor={`${idPrefix}-adornment`}>{'\u200B'}</InputLabel>
        <TextField
          id={`${idPrefix}-adornment`}
          label={label}
          value={curText}
          onClick={language ? handleLangPick : undefined}
          onKeyDown={language ? handleLangPick : undefined}
          onChange={handleTextChange}
          helperText={helperText}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <>
                  {mediaId && (
                    <IconButton
                      id={`${idPrefix}-play`}
                      aria-label="play"
                      onClick={handlePlay}
                      onMouseDown={handleMouseDownSave}
                      disabled={recording}
                      edge="start"
                    >
                      <PlayIcon fontSize="small" />
                    </IconButton>
                  )}
                  <Tooltip title={t.record}>
                    <IconButton
                      id={`${idPrefix}-record`}
                      aria-label="record"
                      onClick={handleRecord}
                      onMouseDown={handleMouseDownSave}
                      disabled={recording}
                      edge="start"
                    >
                      <MicIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </>
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                {hasContent() && canSaveRecording && (
                  <>
                    <Tooltip title={t.save}>
                      <span>
                        <IconButton
                          id={`${idPrefix}-save`}
                          aria-label="save target term"
                          onClick={handleOk}
                          onMouseDown={handleMouseDownSave}
                          disabled={recording}
                          edge="end"
                        >
                          <CheckIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title={t.cancel}>
                      <span>
                        <IconButton
                          id={`${idPrefix}-cancel`}
                          aria-label="save target term"
                          onClick={handleCancel}
                          onMouseDown={handleMouseDownSave}
                          disabled={recording}
                          edge="end"
                        >
                          <CancelIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </>
                )}
              </InputAdornment>
            ),
          }}
        />
        {language && (
          <FormControlLabel
            sx={{ display: 'none' }}
            id={`${idPrefix}-language`}
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
      {doRecordRef.current && (
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
