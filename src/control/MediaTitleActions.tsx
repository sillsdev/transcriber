import React, { useRef, useState } from 'react';
import { IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/LibraryAddOutlined';
import MicIcon from '@mui/icons-material/Mic';
import PlayIcon from '@mui/icons-material/PlayArrow';
import Uploader from '../components/Uploader';
import { useSnackBar } from '../hoc/SnackBar';
import MediaPlayer from '../components/MediaPlayer';

interface IProps {
  mediaId: string | undefined;
  setMediaId: (mediaId: string) => void;
  defaultFilename: string;
}
export default function MediaTitleActions(props: IProps) {
  const { mediaId, setMediaId, defaultFilename } = props;
  const [uploadVisible, setUploadVisible] = useState(false);
  const [recordAudio, setRecordAudio] = useState(true);
  const [speaker, setSpeaker] = useState('');
  const [playing, setPlaying] = useState(false);
  const cancelled = useRef(false);
  const isReady = () => true;
  const { showMessage } = useSnackBar();

  const handlePlay = () => {
    setPlaying(true);
  };
  const playEnded = () => {
    setPlaying(false);
  };
  const handleUpload = () => {
    showUpload(false);
    var m = 'newmedia';
    setMediaId(m);
  };
  const handleUploadVisible = (v: boolean) => {
    setUploadVisible(v);
  };
  const showUpload = (record: boolean) => {
    //wait for save?
    setRecordAudio(record);
    //setImportList(list);
    setUploadVisible(true);
  };
  const afterUpload = async (planId: string, mediaRemoteIds?: string[]) => {
    setUploadVisible(false);
  };
  const handleRecord = () => {
    showUpload(true);
    var m = 'newmedia';
    setMediaId(m);
  };
  const handleNameChange = (name: string) => {
    setSpeaker(name);
  };
  return (
    <div>
      <IconButton
        id="langplay"
        aria-label="language play"
        color="default"
        disabled={mediaId === undefined}
        onClick={handlePlay}
      >
        <PlayIcon />
      </IconButton>
      <IconButton
        id="langupload"
        aria-label="language upload"
        color="default"
        onClick={handleUpload}
      >
        <AddIcon />
      </IconButton>
      <IconButton
        id="langrecord"
        aria-label="language record"
        color="default"
        onClick={handleRecord}
      >
        <MicIcon />
      </IconButton>

      <Uploader
        recordAudio={recordAudio}
        allowWave={true}
        defaultFilename={defaultFilename}
        mediaId={mediaId || ''}
        //importList={importList}
        isOpen={uploadVisible}
        onOpen={handleUploadVisible}
        showMessage={showMessage}
        multiple={false}
        finish={afterUpload}
        cancelled={cancelled}
        performedBy={speaker}
        onSpeakerChange={handleNameChange}
        ready={isReady}
      />
      <MediaPlayer
        srcMediaId={mediaId || ''}
        requestPlay={playing}
        onEnded={playEnded}
      />
    </div>
  );
}
