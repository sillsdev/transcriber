import { useContext, useEffect, useRef, useState } from 'react';
import { DiscussionD } from '../../model';
import { CommentEditor } from './CommentEditor';
import { useRecordComment } from './useRecordComment';
import { useSaveComment } from '../../crud/useSaveComment';
import { useMounted } from '../../utils';
import { UnsavedContext } from '../../context/UnsavedContext';
import { Box } from '@mui/material';
import { related } from '../../crud';

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
  const myToolId = discussion.id + 'reply';
  const afterSavecb = () => {
    savingRef.current = false;
    saveCompleted(myToolId);
    if (isMounted()) {
      setChanged(false);
      setRefresh(refresh + 1);
    }
  };
  const saveComment = useSaveComment({ cb: afterSavecb });
  const commentText = useRef('');
  const afterUploadCb = async (mediaId: string) => {
    saveComment(discussion.id, '', commentText.current, mediaId, undefined);
    commentText.current = '';
  };
  const { uploadMedia, fileName, uploadSuccess } = useRecordComment({
    mediafileId: related(discussion, 'mediafile'),
    commentNumber,
    afterUploadCb,
  });
  const savingRef = useRef(false);
  const [canSaveRecording, setCanSaveRecording] = useState(false);

  const handleSaveEdit = () => {
    savingRef.current = true;
    //if we're recording and can save, the comment will save after upload
    if (!canSaveRecording) {
      if (commentText.current.length > 0) afterUploadCb('');
      else saveCompleted(myToolId);
    }
  };
  const handleCancelEdit = () => {
    setRefresh(refresh + 1);
    commentText.current = '';
    clearCompleted(myToolId);
  };

  useEffect(() => {
    if (saveRequested(myToolId) && !savingRef.current) {
      handleSaveEdit();
    } else if (clearRequested(myToolId)) handleCancelEdit();
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
        comment={commentText.current}
        refresh={refresh}
        onOk={handleSaveEdit}
        onCancel={handleCancelEdit}
        setCanSaveRecording={setCanSaveRecording}
        fileName={fileName(discussion.attributes.subject, discussion.id)}
        uploadMethod={uploadMedia}
        onTextChange={handleTextChange}
        cancelOnlyIfChanged={true}
        uploadSuccess={uploadSuccess}
      />
    </Box>
  );
};

export default ReplyCard;
