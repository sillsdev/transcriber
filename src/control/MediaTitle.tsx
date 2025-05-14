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
  Box,
  BoxProps,
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
import PauseIcon from '@mui/icons-material/Pause';
import ChangeIcon from '@mui/icons-material/ChangeHistory';
import { styled } from '@mui/material';
import { useSelector, shallowEqual } from 'react-redux';
import { IMediaTitleStrings } from '../model';
import { useSnackBar } from '../hoc/SnackBar';
import { mediaTitleSelector, pickerSelector } from '../selector';
import { waitForIt } from '../utils';
import MediaPlayer from '../components/MediaPlayer';
import { LangTag, LanguagePicker } from 'mui-language-picker';
import { ILanguage } from './Language';
import { UnsavedContext } from '../context/UnsavedContext';
import TitleTabs from '../components/TitleTabs';
import BigDialog from '../hoc/BigDialog';

interface IStartProps {
  titlekey: string;
  mediaId: string;
  handlePlay: (e: any) => void;
  handleMouseDownSave: (event: MouseEvent<HTMLButtonElement>) => void;
  recording: boolean;
  disabled: boolean | undefined;
  playing: boolean;
  handleRecord: (e: any) => void;
  onRecording?: (recording: boolean) => void;
}
const TitleStart = ({
  titlekey,
  mediaId,
  handlePlay,
  handleMouseDownSave,
  recording,
  disabled,
  playing,
  handleRecord,
  onRecording,
}: IStartProps) => {
  const t: IMediaTitleStrings = useSelector(mediaTitleSelector, shallowEqual);

  return (
    <InputAdornment position="start">
      <>
        {mediaId && (
          <Tooltip title={t.playPause}>
            <IconButton
              id={`${titlekey}play`}
              aria-label="play"
              onClick={handlePlay}
              onMouseDown={handleMouseDownSave}
              disabled={false}
              edge="start"
            >
              {playing ? (
                <PauseIcon fontSize="small" />
              ) : (
                <PlayIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
        )}
        {onRecording && !disabled && (
          <Tooltip title={t.recordOrUpload}>
            <IconButton
              id={`${titlekey}record`}
              aria-label="record"
              onClick={handleRecord}
              onMouseDown={handleMouseDownSave}
              disabled={recording}
              edge="start"
            >
              {mediaId ? (
                <ChangeIcon fontSize="small" />
              ) : (
                <MicIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
        )}
      </>
    </InputAdornment>
  );
};

// see: https://mui.com/material-ui/customization/how-to-customize/
export interface ColumnDivProps extends BoxProps {
  noLabel?: boolean;
}
export const ColumnDiv = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'noLabel',
})<ColumnDivProps>(({ noLabel }) => ({
  display: 'flex',
  flexDirection: 'column',
  ...(noLabel
    ? {
        '& legend': { display: 'none' },
      }
    : {}),
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
  canRecord?: () => boolean;
  onRecording?: (recording: boolean) => void;
  onMediaIdChange: (mediaId: string) => void;
  disabled?: boolean;
  required?: boolean;
  passageId?: string;
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
    canRecord,
    onTextChange,
    onLangChange,
    onRecording,
    onMediaIdChange,
    useplan,
    disabled,
    required,
    passageId,
  } = props;
  const [canSaveRecording, setCanSaveRecording] = useState(false);
  const canSaveRef = useRef(false);
  const [curText, setCurText] = useState(title ?? '');
  const [startRecord, setStartRecord] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [helperText, setHelperText] = useState('');
  const [showRecorder, setShowRecorder] = useState(false);
  const langRef = useRef(language);
  const [recording, setRecording] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [srcMediaId, setSrcMediaId] = useState('');
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

  const handlePlay = (e: any) => {
    e.stopPropagation();
    //on first play...tell the media player to download the media
    if (!playing && mediaId && srcMediaId !== mediaId) {
      setSrcMediaId(mediaId);
    }
    setPlaying(!playing);
  };
  const handleRecord = (e: any) => {
    e.stopPropagation();
    if (canRecord && !canRecord()) {
      return;
    }
    setPlaying(false);
    setStartRecord(true);
  };
  const setLanguageTitle = (lang: ILanguage) =>
    setCurText(lang?.bcp47 ? `${lang.languageName} (${lang?.bcp47})` : '');

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

  const setInfo = (info: LangTag) => {
    if (langRef.current) {
      langRef.current = { ...langRef.current, info };
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter' && e.key !== 'TAB') e.stopPropagation();
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
        onKeyDown={handleKeyDown}
        helperText={helperText}
        size="small"
        multiline
        disabled={disabled}
        required={required}
        InputProps={{
          startAdornment: (
            <TitleStart
              titlekey={titlekey}
              mediaId={mediaId}
              handlePlay={handlePlay}
              handleMouseDownSave={handleMouseDownSave}
              recording={recording}
              disabled={disabled}
              playing={playing}
              handleRecord={handleRecord}
              onRecording={onRecording}
            />
          ),
        }}
      />
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      curText,
      recording,
      mediaId,
      canSaveRecording,
      disabled,
      helperText,
      playing,
    ]
  );

  return (
    <ColumnDiv noLabel={label === '\uFEFF'}>
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
                value={language?.bcp47 ?? 'und'}
                name={language.languageName}
                font={language.font}
                setCode={setCode}
                setName={setLangname}
                setFont={setFont}
                setInfo={setInfo}
                t={lt}
              />
            }
            label=""
          />
        )}
      </FormControl>
      {showRecorder && (
        <BigDialog
          title={t.supplyAudio.replace('{0}', curText)}
          isOpen={showRecorder}
          onOpen={setShowRecorder}
        >
          <TitleTabs
            onRecording={onMyRecording}
            defaultFilename={defaultFilename}
            titlekey={titlekey}
            onMediaIdChange={onMediaIdChange}
            onDialogVisible={() => setShowRecorder(false)}
            myPlanId={useplan}
            passageId={passageId}
            playing={playing}
          />
        </BigDialog>
      )}
      <MediaPlayer
        srcMediaId={srcMediaId}
        requestPlay={playing}
        onEnded={playEnded}
        onCancel={playEnded}
      />
      <StatusMessage variant="caption">{statusText}</StatusMessage>
    </ColumnDiv>
  );
}
