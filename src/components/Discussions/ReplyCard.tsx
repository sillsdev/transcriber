import { useContext, useEffect, useRef, useState } from 'react';
import { DiscussionD } from '../../model';
import { CommentEditor } from './CommentEditor';
import { useRecordComment } from './useRecordComment';
import { useSaveComment } from '../../crud/useSaveComment';
import { useMounted } from '../../utils';
import { UnsavedContext } from '../../context/UnsavedContext';
import { Box } from '@mui/material';
import { related } from '../../crud';
import { shallowEqual, useSelector } from 'react-redux';
import { sharedSelector } from '../../selector';

interface IProps {
  discussion: DiscussionD;
  commentNumber: number;
}

export const ReplyCard = (props: IProps) => {
  const { discussion, commentNumber } = props;
  const [refresh, setRefresh] = useState(0);
  const isMounted = useMounted('replycard');
  const {
    toolChanged,
    saveCompleted,
    toolsChanged,
    saveRequested,
    clearRequested,
    clearCompleted,
  } = useContext(UnsavedContext).state;
  const ts = useSelector(sharedSelector, shallowEqual);
  const myToolId = discussion.id + 'reply';
  const reset = () => {
    savingRef.current = false;
    saveCompleted(myToolId);
    commentText.current = '';
    if (isMounted()) {
      setChanged(false);
      setRefresh(refresh + 1);
    }
  };
  const resetAfterError = () => {
    savingRef.current = false;
    saveCompleted(myToolId, ts.NoSaveOffline);
  };
  const commentText = useRef('');
  const saveComment = useSaveComment();
  const doSaveComment = async (mediaId: string | undefined) => {
    await saveComment(
      discussion.id,
      '',
      commentText.current,
      mediaId,
      undefined
    );
    reset();
  };
  const afterUploadCb = async (mediaId: string | undefined) => {
    if (mediaId) doSaveComment(mediaId);
    else resetAfterError();
  };

  const { passageId, fileName } = useRecordComment({
    mediafileId: related(discussion, 'mediafile'),
    commentNumber,
  });

  const savingRef = useRef(false);
  const [canSaveRecording, setCanSaveRecording] = useState(false);

  const handleSaveEdit = () => {
    if (!savingRef.current) {
      savingRef.current = true;
      //if we're recording and can save, the comment will save after upload
      if (!canSaveRecording) {
        if (commentText.current.length > 0) doSaveComment('');
        else saveCompleted(myToolId);
      }
    }
  };
  const handleCancelEdit = () => {
    setRefresh(refresh + 1);
    commentText.current = '';
    clearCompleted(myToolId);
  };

  useEffect(() => {
    if (saveRequested(myToolId)) {
      handleSaveEdit();
    } else {
      savingRef.current = false;
      if (clearRequested(myToolId)) handleCancelEdit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolsChanged]);

  const setChanged = (changed: boolean) => {
    const valid = commentText.current !== '' || canSaveRecording;
    toolChanged(myToolId, changed && valid);
  };

  const handleTextChange = (newText: string) => {
    commentText.current = newText;
    setChanged(true);
  };

  useEffect(() => {
    if (canSaveRecording) {
      setChanged(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSaveRecording]);

  return (
    <Box sx={{ display: 'flex', flexFlow: 'column', flexGrow: 1 }}>
      <CommentEditor
        toolId={myToolId}
        passageId={passageId}
        comment={commentText.current}
        refresh={refresh}
        onOk={handleSaveEdit}
        onCancel={handleCancelEdit}
        setCanSaveRecording={setCanSaveRecording}
        fileName={fileName(discussion.attributes.subject, discussion.id)}
        afterUploadCb={afterUploadCb}
        onTextChange={handleTextChange}
        cancelOnlyIfChanged={true}
      />
    </Box>
  );
};

export default ReplyCard;
