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
import { IState, IPassageRecordStrings } from '../model';
import localStrings from '../selector/localize';
import * as actions from '../store';
import {
  Stack,
  Button,
  Checkbox,
  FormControlLabel,
  Paper,
  SxProps,
  TextField,
  Typography,
} from '@mui/material';
import WSAudioPlayer from './WSAudioPlayer';
import { generateUUID, loadBlob, waitForIt, cleanFileName } from '../utils';
import { IMediaState, MediaSt, useFetchMediaUrl } from '../crud';
import { useSnackBar } from '../hoc/SnackBar';
import { bindActionCreators } from 'redux';
import { UnsavedContext } from '../context/UnsavedContext';
import { UploadType, SIZELIMIT } from './MediaUpload';

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

interface IProps {
  toolId: string;
  onReady?: () => void;
  onSaving?: () => void;
  onRecording?: (r: boolean) => void;
  onPlayStatus?: (p: boolean) => void;
  mediaId?: string;
  metaData?: JSX.Element;
  defaultFilename?: string;
  startSave?: boolean;
  setCanSave: (canSave: boolean) => void;
  setCanCancel?: (canCancel: boolean) => void;
  setStatusText: (status: string) => void;
  uploadMethod?: (files: File[]) => Promise<void>;
  cancelMethod?: () => void;
  allowRecord?: boolean;
  oneTryOnly?: boolean;
  allowWave?: boolean;
  showFilename?: boolean;
  size?: number;
  doReset?: boolean;
  setDoReset?: (r: boolean) => void;
  preload?: boolean;
  autoStart?: boolean;
  trackState?: (mediaState: IMediaState) => void;
}

function MediaRecord(props: IProps & IStateProps & IDispatchProps) {
  const {
    t,
    toolId,
    onReady,
    onSaving,
    onRecording,
    onPlayStatus,
    mediaId,
    defaultFilename,
    uploadMethod,
    setCanSave,
    setCanCancel,
    setStatusText,
    allowRecord,
    oneTryOnly,
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
    trackState,
  } = props;
  const WARNINGLIMIT = 1;
  const [reporter] = useGlobal('errorReporter');
  const { fetchMediaUrl, mediaState } = useFetchMediaUrl(reporter);
  const [name, setName] = useState(t.defaultFilename);
  const [userHasSetName, setUserHasSetName] = useState(false);
  const [filetype, setFiletype] = useState('');
  const [originalBlob, setOriginalBlob] = useState<Blob>();
  const [audioBlob, setAudioBlob] = useState<Blob>();
  const [loading, setLoading] = useState(false);
  const [filechanged, setFilechanged] = useState(false);
  const [recording, setRecording] = useState(false);
  const [blobReady, setBlobReady] = useState(true);
  const [mimeType, setMimeType] = useState('audio/ogg;codecs=opus');
  const [compression, setCompression] = useState(20);
  const [warning, setWarning] = useState('');
  const [tooBig, setTooBig] = useState(false);
  const { showMessage } = useSnackBar();
  const [converting, setConverting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toolsChanged, saveRequested, saveCompleted } =
    useContext(UnsavedContext).state;
  const saveRef = useRef(false);
  const guidRef = useRef('');
  const extensions = useMemo(
    () => ['mp3', 'mp3', 'webm', 'mka', 'm4a', 'wav', 'ogg'],
    []
  );
  const sizeLimit = SIZELIMIT(UploadType.Media);

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
    if (mediaId !== mediaState.id) fetchMediaUrl({ id: mediaId ?? '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaId]);

  useEffect(() => {
    trackState && trackState(mediaState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaState]);

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
        !tooBig &&
        name !== '' &&
        filechanged &&
        !converting &&
        !uploading &&
        !recording &&
        !saveRef.current
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blobReady, tooBig, name, filechanged, converting, uploading, recording]);

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
            convertComplete();
          });
        else {
          convertComplete();
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [convert_status, convert_complete, convert_blob]);

  const convertComplete = () => {
    resetConvertBlob();
    setConverting(false);
    saveCompleted(toolId, '');
    if (onReady) onReady();
  };
  useEffect(() => {
    var limit = sizeLimit * compression;
    var big = (audioBlob?.size ?? 0) > limit * 1000000;
    setTooBig(big);
    if (audioBlob && audioBlob.size > (limit - WARNINGLIMIT) * 1000000)
      setWarning(
        (big ? t.toobig : t.toobigwarn).replace('{1}', limit.toString())
      );
    else setWarning('');
    if (saveRequested(toolId) && !saveRef.current) {
      if (audioBlob) {
        onSaving && onSaving();
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
          doUpload(audioBlob).then(() => {
            saveCompleted(toolId, '');
            onReady && onReady();
          });
        }
        return;
      }
    } else if (!saveRequested(toolId) && saveRef.current)
      saveRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioBlob, toolsChanged, mimeType, convert_guid, toolId]);

  const setExtension = (mimeType: string) => {
    if (mimeType) {
      var i = mimes.findIndex((m) => m === mimeType);
      if (i >= 0) setFiletype(extensions[i]);
    }
  };

  function onBlobReady(blob: Blob | undefined) {
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
    setCompression(20);
    setUserHasSetName(false);
    setFilechanged(false);
    setOriginalBlob(undefined);
    setAudioBlob(undefined);
  };

  const handleCompressChanged = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.currentTarget.checked) {
      setMimeType('audio/ogg;codecs=opus');
      setCompression(20);
    } else {
      setMimeType('audio/wav');
      setCompression(1);
    }
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
        fetchMediaUrl({ id: mediaId ?? '' });
        setLoading(false);
      }
    });
    if (defaultFilename) setName(defaultFilename);
    else setName(t.defaultFilename);

    if (!mediaId) {
      setDoReset && setDoReset(true);
      return;
    }
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
      {preload === false &&
        mediaId &&
        mediaState.status === MediaSt.FETCHED &&
        mediaState.id === mediaId && (
          <Button id="rec-load" variant="contained" onClick={handleLoadAudio}>
            {t.loadfile}
          </Button>
        )}
      <WSAudioPlayer
        allowRecord={allowRecord !== false}
        allowSilence={allowWave}
        oneTryOnly={oneTryOnly}
        size={size || 300}
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
      {warning && (
        <Typography sx={{ m: 2, color: 'warning.dark' }} id="warning">
          {warning}
        </Typography>
      )}
      <Stack direction="row" sx={{ alignItems: 'center' }}>
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
        <Typography sx={{ mr: 3 }} id="size">
          {`${((audioBlob?.size ?? 0) / 1000000 / compression).toFixed(2)}MB`}
        </Typography>
        {allowWave && (
          <FormControlLabel
            control={
              <Checkbox
                defaultChecked
                size="small"
                onChange={handleCompressChanged}
              />
            }
            label={t.compressed}
          />
        )}
        {metaData}
      </Stack>
    </Paper>
  );
}
const mapDispatchToProps = (dispatch: any) => ({
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

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MediaRecord as any) as any as (props: IProps) => JSX.Element;
