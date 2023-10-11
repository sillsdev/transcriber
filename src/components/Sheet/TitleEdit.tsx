import { useEffect, useState } from 'react';
import MediaTitle from '../../control/MediaTitle';
import { useGlobal } from 'reactn';
import { ISheet } from '../../model';
import { getDefaultName } from './getDefaultName';

interface IProps {
  title: string;
  mediaId: string;
  ws: ISheet;
  onStartRecording: (changed: boolean) => void;
  onTextChange: (value: string) => void;
  onMediaIdChange: (mediaId: string) => void;
}

export function TitleEdit({
  title,
  mediaId,
  ws,
  onStartRecording,
  onTextChange,
  onMediaIdChange,
}: IProps) {
  const [planId] = useGlobal('plan');
  const [memory] = useGlobal('memory');
  const [titlex, setTitle] = useState(title || '');
  const [titleMediafile, setTitleMediafile] = useState('');

  useEffect(() => {
    setTitle(title);
  }, [title]);

  useEffect(() => {
    setTitleMediafile(mediaId);
  }, [mediaId]);

  const handleChangeTitle = (value: string) => {
    onTextChange(value);
    setTitle(value);
    return '';
  };
  const onRecording = (recording: boolean) => {
    if (recording) {
      onStartRecording(true);
    }
  };

  const handleChangeTitleMedia = (mediaId: string) => {
    setTitleMediafile(mediaId);
    onMediaIdChange(mediaId);
  };

  return (
    <MediaTitle
      titlekey={`title-${ws.sectionSeq}`}
      label={'\u200B'} // zero-width space
      mediaId={titleMediafile}
      title={titlex}
      defaultFilename={getDefaultName(ws, 'title', memory)}
      onTextChange={handleChangeTitle}
      onRecording={onRecording}
      useplan={planId}
      onMediaIdChange={handleChangeTitleMedia}
    />
  );
}
