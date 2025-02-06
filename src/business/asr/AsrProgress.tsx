import * as React from 'react';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import { orgDefaultAsr, useOrgDefaults } from '../../crud/useOrgDefaults';
import { TokenContext } from '../../context/TokenProvider';
import { IAsrState } from './AsrAlphabet';
import { axiosGet, axiosPost } from '../../utils/axios';
import { HttpStatusCode } from 'axios';
import { useSnackBar } from '../../hoc/SnackBar';
import { remoteId } from '../../crud/remoteId';
import { RecordKeyMap } from '@orbit/records';
import { useGlobal } from '../../context/GlobalContext';
import { ActionRow, AltButton } from '../../control';
import { ISharedStrings, MediaFileD } from '../../model';
import { getSegments, NamedRegions } from '../../utils/namedSegments';
import { shallowEqual, useSelector } from 'react-redux';
import { sharedSelector } from '../../selector';

interface AsrProgressProps {
  mediaId: string;
  phonetic?: boolean;
  setMessage?: (message: string) => void;
  setTranscription?: (transcription: string) => void;
  onClose?: () => void;
}

export default function AsrProgress({
  mediaId,
  phonetic,
  setMessage,
  setTranscription,
  onClose,
}: AsrProgressProps) {
  const [, setAddingx] = React.useState(false);
  const addingRef = React.useRef(false);
  const { getOrgDefault } = useOrgDefaults();
  const [memory] = useGlobal('memory');
  const token = React.useContext(TokenContext).state.accessToken ?? '';
  const { showMessage } = useSnackBar();
  const [taskId, setTaskId] = React.useState('');
  const taskTimer = React.useRef<NodeJS.Timeout>();
  const timerDelay = 5000; //5 seconds
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);

  const setTranscribing = (adding: boolean) => {
    setAddingx(adding);
    addingRef.current = adding;
  };

  const status = (message: string) => {
    setMessage && setMessage(message);
    showMessage(message);
    console.log(message);
  };

  const checkTask = async () => {
    console.log(`checking task: ${taskId}`);
    var response = await axiosGet(`aero/transcription/${taskId}`);
    if (response?.transcription) {
      //Do something with the transcription here
      console.log(response);
      setMessage && setMessage('');
      setTranscription &&
        setTranscription(
          phonetic ? response?.phonetic : response?.transcription
        );
      setTaskId('');
    } else if (response?.transcription === '') {
      status('no transcription');
      setTaskId('');
    } else {
      console.log('not done', response);
    }
    return undefined;
  };

  const launchTimer = () => {
    taskTimer.current = setInterval(() => {
      checkTask();
    }, timerDelay);
  };

  const closing = () => {
    setTranscribing(false);
    onClose && onClose();
  };

  const PostTranscribe = async (remoteId: string) => {
    const asr = getOrgDefault(orgDefaultAsr) as IAsrState | undefined;
    const iso = asr?.dialect ?? asr?.mmsIso ?? 'eng';
    const romanize = asr?.selectRoman ?? false;

    const response = await axiosPost(
      `mediafiles/${remoteId}/transcription/${iso}/${romanize}`,
      undefined,
      token
    );

    if (response.status === HttpStatusCode.Ok) {
      var mediaRec = response?.data.data as MediaFileD;
      var regionstr = getSegments(
        NamedRegions.TRTask,
        mediaRec?.attributes?.segments ?? '{}'
      );
      var segs = JSON.parse(regionstr);
      if (segs.regions[0]?.label) {
        setTaskId(segs.regions[0].label);
      } else {
        status('AI transcription failed');
        closing();
      }
    } else {
      status('AI transcription failed');
      closing();
    }
  };
  /*
  const PostTranscribeUrl = async (fileUrl: string) => {
    const asr = getOrgDefault(orgDefaultAsr) as IAsrState | undefined;
    const postdata: {
      fileUrl: string;
      iso: string;
      romanize: boolean;
    } = {
      fileUrl,
      iso: asr?.dialect ?? asr?.mmsIso ?? 'eng',
      romanize: asr?.selectRoman ?? false,
    };
    const response = await axiosPost(
      'Aero/transcription/fromfile',
      postdata,
      token
    );

    if (response.status === HttpStatusCode.Ok) {
      console.log(`launching ${response?.data}`);
      setTaskId(response?.data ?? '');
    } else {
      status('AI transcription failed');
      closing();
    }
  };
*/
  React.useEffect(() => {
    if (taskId) {
      if (!taskTimer.current) launchTimer();
    } else if (taskTimer.current) {
      clearInterval(taskTimer.current);
      taskTimer.current = undefined;
      closing();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  const handleTranscribe = (remId: string) => {
    if (addingRef.current) return;
    setTranscribing(true);
    PostTranscribe(remId);
  };

  React.useEffect(() => {
    const remId =
      remoteId('mediafile', mediaId, memory?.keyMap as RecordKeyMap) ?? mediaId;
    handleTranscribe(remId);
    /*
    fetchUrl({ id: remId, cancelled: () => false, noDownload: true }).then(
      (url) => {
        if (url === ts.expiredToken) {
          status(ts.expiredToken);
          onClose && onClose();
        } else if (url) {
          handleTranscribe(url);
        }
      }
    );
    */

    return () => {
      if (taskTimer.current) {
        clearInterval(taskTimer.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box sx={{ width: '100%' }}>
      <LinearProgress />
      <ActionRow>
        <AltButton onClick={onClose}>{ts.cancel}</AltButton>
      </ActionRow>
    </Box>
  );
}
