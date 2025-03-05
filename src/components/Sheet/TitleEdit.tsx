import { useEffect, useState } from 'react';
import MediaTitle from '../../control/MediaTitle';
import { useGlobal } from '../../context/GlobalContext';
import { ISheet } from '../../model';
import { getDefaultName } from './getDefaultName';

interface IProps {
  title: string;
  mediaId: string;
  ws: ISheet;
  anyRecording: boolean;
  passageId?: string;
  onRecording: (recording: boolean) => void;
  onTextChange: (value: string) => void;
  onMediaIdChange: (mediaId: string) => void;
}

export function TitleEdit({
  title,
  mediaId,
  ws,
  anyRecording,
  passageId,
  onRecording,
  onTextChange,
  onMediaIdChange,
}: IProps) {
  const [planId] = useGlobal('plan'); //will be constant here
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

  const handleChangeTitleMedia = (mediaId: string) => {
    setTitleMediafile(mediaId);
    onMediaIdChange(mediaId);
  };

  return (
    <MediaTitle
      titlekey={`title-${ws.sectionSeq}_${ws.passageSeq}`}
      label={'\u200B'} // zero-width space
      mediaId={titleMediafile}
      title={titlex}
      defaultFilename={getDefaultName(ws, 'title', memory, planId)}
      onTextChange={handleChangeTitle}
      onRecording={onRecording}
      useplan={planId}
      onMediaIdChange={handleChangeTitleMedia}
      disabled={anyRecording}
      passageId={passageId}
    />
  );
}
