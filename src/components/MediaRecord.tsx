import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  useContext,
} from 'react';
import { useGlobal } from 'reactn';
import { connect } from 'react-redux';
import { IState, MediaFile, IPassageRecordStrings } from '../model';
import localStrings from '../selector/localize';
import * as actions from '../store';
import {
  Box,
  BoxProps,
  Button,
  FormControl,
  FormControlLabel,
  Paper,
  Radio,
  RadioGroup,
  styled,
  SxProps,
  TextField,
} from '@mui/material';
import WSAudioPlayer from './WSAudioPlayer';
import { QueryBuilder } from '@orbit/data';
import {
  generateUUID,
  loadBlob,
  removeExtension,
  waitForIt,
  cleanFileName,
} from '../utils';
import { MediaSt, useFetchMediaUrl } from '../crud';
import { useSnackBar } from '../hoc/SnackBar';
import { bindActionCreators } from 'redux';
import { UnsavedContext } from '../context/UnsavedContext';

const Row = styled(Box)<BoxProps>(() => ({
  display: 'flex',
}));

const controlProps = { m: 1 } as SxProps;

interface IDispatchProps {
  convertBlob: typeof actions.convertBlob;
  resetConvertBlob: typeof actions.resetConvertBlob;
}
interface IStateProps {
  t: IPassageRecordStrings;
  convert_status: string;
  convert_complete: boolean;
  convert_blob: Blob;
  convert_guid: string;
}

interface IProps extends IStateProps, IDispatchProps {
  toolId: string;
  onReady: () => void;
  onRecording: (r: boolean) => void;
  onPlayStatus: (p: boolean) => void;
  mediaId: string;
  metaData?: JSX.Element;
  defaultFilename?: string;
  startSave: boolean;
  setCanSave: (canSave: boolean) => void;
  setCanCancel?: (canCancel: boolean) => void;
  setStatusText: (status: string) => void;
  uploadMethod?: (files: File[]) => Promise<void>;
  cancelMethod?: () => void;
  allowRecord?: boolean;
  allowWave?: boolean;
  showFilename?: boolean;
  size?: number;
  doReset?: boolean;
  setDoReset?: (r: boolean) => void;
  preload?: boolean;
  autoStart: boolean;
}

function MediaRecord(props: IProps) {
  const {
    t,
    toolId,
    onReady,
    onRecording,
    onPlayStatus,
    mediaId,
    defaultFilename,
    uploadMethod,
    setCanSave,
    setCanCancel,
    setStatusText,
    allowRecord,
    allowWave,
    showFilename,
    autoStart,
    doReset,
    setDoReset,
    convert_status,
    convert_complete,
    convert_blob,
    convert_guid,
    convertBlob,
    resetConvertBlob,
    size,
    metaData,
    preload,
  } = props;
  const [reporter] = useGlobal('errorReporter');
  const { fetchMediaUrl, mediaState } = useFetchMediaUrl(reporter);
  const [name, setName] = useState(t.defaultFilename);
  const [userHasSetName, setUserHasSetName] = useState(false);
  const [filetype, setFiletype] = useState('');
  const [originalBlob, setOriginalBlob] = useState<Blob>();
  const [audioBlob, setAudioBlob] = useState<Blob>();
  const [loading, setLoading] = useState(false);
  const [memory] = useGlobal('memory');
  const [filechanged, setFilechanged] = useState(false);
  const [recording, setRecording] = useState(false);
  const [blobReady, setBlobReady] = useState(true);
  const [mimeType, setMimeType] = useState('audio/ogg;codecs=opus');
  const { showMessage } = useSnackBar();
  const [converting, setConverting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toolsChanged, saveRequested } = useContext(UnsavedContext).state;
  const saveRef = useRef(false);
  const guidRef = useRef('');
  const extensions = useMemo(
    () => ['mp3', 'mp3', 'webm', 'mka', 'm4a', 'wav', 'ogg'],
    []
  );
  const mimes = useMemo(
    () => [
      'audio/mpeg',
      'audio/mp3',
      'audio/webm;codecs=opus',
      'audio/webm;codecs=pcm',
      'audio/x-m4a',
      'audio/wav',
      'audio/ogg;codecs=opus',
    ],
    []
  );

  useEffect(() => {
    setConverting(false);
    setUploading(false);
    saveRef.current = false;
    setAudioBlob(undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (mediaId !== mediaState.id) fetchMediaUrl({ id: mediaId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaId]);

  useEffect(() => {
    setExtension(mimeType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mimeType, extensions, mimes]);

  useEffect(() => {
    if (!userHasSetName) {
      if (defaultFilename) setName(defaultFilename);
      else setName(t.defaultFilename);
    }
  }, [userHasSetName, defaultFilename, t.defaultFilename]);

  useEffect(() => {
    setCanSave(
      blobReady &&
        name !== '' &&
        filechanged &&
        !converting &&
        !uploading &&
        !recording &&
        !saveRef.current
    );
  }, [
    blobReady,
    name,
    filechanged,
    converting,
    uploading,
    recording,
    setCanSave,
  ]);

  useEffect(() => {
    if (setCanCancel) setCanCancel(!converting && !uploading);
  }, [converting, uploading, setCanCancel]);

  const doUpload = useCallback(
    async (blob: Blob) => {
      setUploading(true);
      setStatusText(t.saving);
      var files = [
        new File([blob], name + '.' + filetype, {
          type: mimeType,
        }),
      ];
      if (uploadMethod && files) {
        await uploadMethod(files);
      }
      setUploading(false);
      setFilechanged(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [name, filetype, mimeType]
  );

  useEffect(() => {
    //was it me who asked for this?
    if (convert_guid === guidRef.current) {
      if (convert_status) {
        var progress = parseInt(convert_status);
        if (isNaN(progress)) {
          showMessage(convert_status);
        } else {
          setStatusText(t.compressing.replace('{0}', progress.toString()));
        }
      }
      if (convert_complete) {
        if (convert_blob)
          doUpload(convert_blob).then(() => {
            resetConvertBlob();
            setConverting(false);
            if (onReady) onReady();
          });
        else {
          resetConvertBlob();
          setConverting(false);
          if (onReady) onReady();
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [convert_status, convert_complete, convert_blob]);

  useEffect(() => {
    if (saveRequested(toolId) && !saveRef.current) {
      if (audioBlob) {
        saveRef.current = true;
        if (mimeType !== 'audio/wav') {
          setConverting(true);
          guidRef.current = generateUUID();
          waitForIt(
            'previous convert',
            () => convert_guid === '',
            () => false,
            300
          ).then(() => convertBlob(audioBlob, mimeType, guidRef.current));
        } else {
          doUpload(audioBlob).then(() => onReady());
        }
        return;
      }
    } else if (!saveRequested(toolId) && saveRef.current)
      saveRef.current = false;
  }, [
    audioBlob,
    toolsChanged,
    mimeType,
    doUpload,
    convertBlob,
    onReady,
    saveRequested,
    convert_guid,
    toolId,
  ]);

  const setExtension = (mimeType: string) => {
    if (mimeType) {
      var i = mimes.findIndex((m) => m === mimeType);
      if (i >= 0) setFiletype(extensions[i]);
    }
  };

  function onBlobReady(blob: Blob) {
    setAudioBlob(blob);
    setFilechanged(true);
  }
  function myOnRecording(r: boolean) {
    setRecording(r);
    if (onRecording) onRecording(r);
  }
  useEffect(() => {
    if (doReset) {
      reset();
      setDoReset && setDoReset(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doReset]);

  const reset = () => {
    setMimeType('audio/ogg;codecs=opus');
    setUserHasSetName(false);
    setFilechanged(false);
    setOriginalBlob(undefined);
    setAudioBlob(undefined);
  };

  const handleChangeMime = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMimeType((event.target as HTMLInputElement).value);
  };

  const handleChangeFileName = (e: any) => {
    e.persist();
    setName(cleanFileName(e.target.value));
    setUserHasSetName(true);
  };

  const handleLoadAudio = () => {
    showMessage(t.loading);
    if (loading) return;
    setLoading(true);
    reset();
    loadBlob(mediaState.url, (urlorError, b) => {
      if (b) {
        setOriginalBlob(b);
        setLoading(false);
        setAudioBlob(b);
      } else {
        showMessage(urlorError);
        //force it to go get another (unexpired) s3 url
        fetchMediaUrl({ id: mediaId });
        setLoading(false);
      }
    });
    if (!mediaId) {
      if (defaultFilename) setName(defaultFilename);
      else setName(t.defaultFilename);
      setDoReset && setDoReset(true);
      return;
    }
    const mediaRec = memory.cache.query((q: QueryBuilder) =>
      q.findRecord({ type: 'mediafile', id: mediaId })
    ) as MediaFile;
    setName(removeExtension(mediaRec.attributes.originalFile).name);
  };

  useEffect(() => {
    if (preload && !loading) {
      handleLoadAudio();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preload]);

  const segments = '{}';

  return (
    <Paper id="mediaRecord">
      {mediaState.status === MediaSt.FETCHED && mediaState.id === mediaId && (
        <Button id="rec-load" variant="contained" onClick={handleLoadAudio}>
          {t.loadfile}
        </Button>
      )}
      <WSAudioPlayer
        allowRecord={allowRecord !== false}
        allowSilence={allowWave}
        size={size || 350}
        blob={originalBlob}
        onBlobReady={onBlobReady}
        setChanged={setFilechanged}
        setBlobReady={setBlobReady}
        onRecording={myOnRecording}
        onPlayStatus={onPlayStatus}
        doReset={doReset}
        autoStart={autoStart}
        segments={segments}
      />
      <Row>
        {showFilename && (
          <TextField
            sx={controlProps}
            id="filename"
            label={t.fileName}
            value={name}
            onChange={handleChangeFileName}
            required={true}
            fullWidth={true}
          />
        )}
        {allowWave && (
          <FormControl component="fieldset" sx={controlProps}>
            <RadioGroup
              row={true}
              id="filetype"
              aria-label="filetype"
              name="filetype"
              value={mimeType}
              onChange={handleChangeMime}
            >
              <FormControlLabel
                id="compressed"
                value={'audio/ogg;codecs=opus'}
                control={<Radio />}
                label={t.compressed}
              />
              <FormControlLabel
                id="uncompressed"
                value={'audio/wav'}
                control={<Radio />}
                label={t.uncompressed}
              />
            </RadioGroup>
          </FormControl>
        )}
        {metaData}
      </Row>
    </Paper>
  );
}
const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
  ...bindActionCreators(
    {
      convertBlob: actions.convertBlob,
      resetConvertBlob: actions.resetConvertBlob,
    },
    dispatch
  ),
});
const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'passageRecord' }),
  convert_status: state.convertBlob.statusmsg,
  convert_complete: state.convertBlob.complete,
  convert_blob: state.convertBlob.blob,
  convert_guid: state.convertBlob.guid,
});
export default connect(mapStateToProps, mapDispatchToProps)(MediaRecord) as any;
