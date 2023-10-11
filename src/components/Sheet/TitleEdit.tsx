import { useEffect, useState } from 'react';
import MediaTitle from '../../control/MediaTitle';
import { useGlobal } from 'reactn';
import { ISheet } from '../../model';
import { getDefaultName } from './getDefaultName';

interface IProps {
  title: string;
  onChanged: (changed: boolean) => void;
  ws: ISheet;
}

export function TitleEdit({ title, onChanged, ws }: IProps) {
  const [planId] = useGlobal('plan');
  const [memory] = useGlobal('memory');
  const [titlex, setTitle] = useState(title || '');
  const [titleMediafile, setTitleMediafile] = useState('');

  useEffect(() => {
    setTitle(title);
  }, [title]);

  const handleChangeTitle = (value: string) => {
    setTitle(value);
    return '';
  };
  const onRecording = (recording: boolean) => {
    if (recording) {
      onChanged(true);
    }
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
      onMediaIdChange={(mediaId: string) => setTitleMediafile(mediaId)}
    />
  );
}
