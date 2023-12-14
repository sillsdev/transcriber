import React, { useEffect, useState } from 'react';
import { IResourceState } from '.';
import MediaTitle from '../../control/MediaTitle';
import { useGlobal } from 'reactn';
import { getDefaultName } from '../Sheet/getDefaultName';

export const NoteTitle = (props: IResourceState) => {
  const { state, setState } = props;
  const { title, ws } = state;
  const [planId] = useGlobal('plan');
  const [memory] = useGlobal('memory');
  const [titlex, setTitle] = useState(title || '');
  const [titleMediafile, setTitleMediafile] = useState(state.mediaId);

  useEffect(() => {
    setTitle(title);
  }, [title]);

  useEffect(() => {
    setTitleMediafile(state.mediaId);
  }, [state]);

  const handleChangeTitle = (title: string) => {
    setState && setState((state) => ({ ...state, title, changed: true }));
    setTitle(title);
    return '';
  };
  const onRecording = (recording: boolean) => {
    if (recording) {
      state.onRecording(true);
    }
  };

  const handleChangeTitleMedia = (mediaId: string) => {
    setTitleMediafile(mediaId);
    setState && setState((state) => ({ ...state, mediaId, changed: true }));
    state.onRecording(false);
  };

  return (
    <MediaTitle
      titlekey={`note-${ws?.passage?.id}`}
      label={'\u200B'} // zero-width space
      mediaId={titleMediafile}
      title={titlex}
      defaultFilename={getDefaultName(ws, 'note', memory)}
      onTextChange={handleChangeTitle}
      onRecording={onRecording}
      useplan={planId}
      onMediaIdChange={handleChangeTitleMedia}
    />
  );
};
