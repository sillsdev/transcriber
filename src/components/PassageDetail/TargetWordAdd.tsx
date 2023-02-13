import {
  useState,
  ChangeEvent,
  MouseEvent,
  useEffect,
  useContext,
  useRef,
} from 'react';
import {
  IconButton,
  OutlinedInput,
  OutlinedInputProps,
  InputLabel,
  InputAdornment,
  FormControl,
  Typography,
  TypographyProps,
} from '@mui/material';
// import SendIcon from '@mui/icons-material/Send';
import MicIcon from '@mui/icons-material/MicOutlined';
import CancelIcon from '@mui/icons-material/CancelOutlined';
import CheckIcon from '@mui/icons-material/Check';
import { styled } from '@mui/material';
import { useSelector, shallowEqual } from 'react-redux';
import { IKeyTermsStrings } from '../../model';
import { keyTermsSelector } from '../../selector';
import MediaRecord from '../MediaRecord';
import { waitForIt } from '../../utils';
import { UnsavedContext } from '../../context/UnsavedContext';
import { PassageDetailContext } from '../../context/PassageDetailContext';
import { IKeyTermRow } from './KeyTermTable';

const ColumnDiv = styled('div')(() => ({
  display: 'flex',
  flexDirection: 'column',
}));

const StyledInput = styled(OutlinedInput)<OutlinedInputProps>(() => ({
  '& input': {
    paddingTop: '1px',
    paddingBottom: '1px',
  },
}));

const StatusMessage = styled(Typography)<TypographyProps>(({ theme }) => ({
  marginRight: theme.spacing(2),
  alignSelf: 'center',
  color: theme.palette.primary.dark,
}));

interface IProps {
  toolId: string;
  word?: string;
  fileName: string;
  cancelOnlyIfChanged?: boolean;
  uploadMethod: (files: File[]) => Promise<void>;
  refresh?: number;
  row: IKeyTermRow;
  onOk: (row: IKeyTermRow) => void;
  onCancel: () => void;
  setCanSaveRecording: (canSave: boolean) => void;
  onTextChange: (txt: string) => void;
}

export default function TargetWordAdd(props: IProps) {
  const {
    toolId,
    row,
    word,
    fileName,
    uploadMethod,
    refresh,
    onOk,
    onCancel,
    setCanSaveRecording,
    onTextChange,
  } = props;
  const {
    playing,
    itemPlaying,
    setPlaying,
    setItemPlaying,
    commentPlaying,
    setCommentPlaying,
    commentRecording,
    setCommentRecording,
  } = useContext(PassageDetailContext).state;

  const [canSave, setCanSave] = useState(false);
  const [curText, setCurText] = useState(word ?? '');
  const [startRecord, setStartRecord] = useState(false);
  const [statusText, setStatusText] = useState('');
  const doRecordRef = useRef(false);
  const [recording, setRecording] = useState(false);
  // const [myChanged, setMyChanged] = useState(false);
  const {
    // toolsChanged,
    toolChanged,
    startSave,
    clearChanged,
    saveRequested,
    // isChanged,
  } = useContext(UnsavedContext).state;
  const t: IKeyTermsStrings = useSelector(keyTermsSelector, shallowEqual);

  const handleSetCanSave = (valid: boolean) => {
    if (valid !== canSave) {
      setCanSave(valid);
      setCanSaveRecording(valid);
      if (valid) toolChanged(toolId, true);
    }
  };

  const onRecording = (r: boolean) => {
    setRecording(r);
  };

  const handleTextChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCurText(e.target.value);
    onTextChange(e.target.value);
    toolChanged(toolId, true);
  };

  const handleRecord = () => {
    setPlaying(false);
    setItemPlaying(false);
    setCommentPlaying(false, true);
    setStartRecord(true);
    setCommentRecording(true);
  };

  const handleOk = () => {
    //start the passage recorder if it's going...
    if (!saveRequested(toolId)) {
      startSave(toolId);
    }
    onOk(row);
    setStatusText(t.saving);
    if (doRecordRef.current) setCommentRecording(false);
  };

  const reset = () => {
    if (doRecordRef.current) setCommentRecording(false);
    setStatusText('');
    setCurText('');
    doRecordRef.current = false;
    clearChanged(toolId);
  };

  const handleCancel = () => {
    onCancel();
    reset();
  };

  useEffect(() => {
    return () => {
      if (doRecordRef.current) setCommentRecording(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // WHen cancelling this logic tries to save
  // useEffect(() => {
  //   var changed = isChanged(toolId);
  //   if (myChanged !== changed) setMyChanged(changed);
  //   if (saveRequested(toolId)) handleOk();
  //   else if (changed) setStatusText(t.unsaved);
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [toolsChanged, toolId]);

  useEffect(() => {
    if (startRecord)
      try {
        waitForIt(
          'stop playing',
          () => !playing && !itemPlaying && !commentPlaying,
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
  }, [startRecord, playing, itemPlaying, commentPlaying]);

  useEffect(() => {
    if ((refresh ?? 0) > 0) {
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh]);

  const handleMouseDownSave = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  const hasContent = () => doRecordRef.current || Boolean(curText);

  return (
    <ColumnDiv>
      <FormControl sx={{ width: 'max-content' }} variant="outlined">
        <InputLabel htmlFor="outlined-adornment-term">{'\u200B'}</InputLabel>
        <StyledInput
          id="outlined-adornment-term"
          sx={{ borderRadius: '24px', py: 0 }}
          value={curText}
          onChange={handleTextChange}
          size="small"
          multiline
          placeholder={t.addTargetWord}
          startAdornment={
            <InputAdornment position="start">
              <IconButton
                aria-label="record target term"
                onClick={handleRecord}
                onMouseDown={handleMouseDownSave}
                disabled={commentRecording || recording}
                edge="start"
              >
                <MicIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          }
          endAdornment={
            <InputAdornment position="end">
              {hasContent() && (
                <>
                  <IconButton
                    aria-label="save target term"
                    onClick={handleOk}
                    onMouseDown={handleMouseDownSave}
                    edge="end"
                  >
                    <CheckIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    aria-label="save target term"
                    onClick={handleCancel}
                    onMouseDown={handleMouseDownSave}
                    edge="end"
                  >
                    <CancelIcon fontSize="small" />
                  </IconButton>
                </>
              )}
            </InputAdornment>
          }
        />
      </FormControl>
      {doRecordRef.current && (
        <MediaRecord
          toolId={toolId}
          onRecording={onRecording}
          uploadMethod={uploadMethod}
          defaultFilename={fileName}
          allowWave={false}
          showFilename={false}
          setCanSave={handleSetCanSave}
          setStatusText={setStatusText}
          size={200}
          autoStart={true}
        />
      )}
      <StatusMessage variant="caption">{statusText}</StatusMessage>
    </ColumnDiv>
  );
}