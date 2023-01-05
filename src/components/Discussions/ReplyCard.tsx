import { useContext, useEffect, useRef, useState } from 'react';
import {
  Discussion,
  Group,
  GroupMembership,
  MediaFile,
  User,
} from '../../model';
import { QueryBuilder } from '@orbit/data';
import { withData } from 'react-orbitjs';
import { CommentEditor } from './CommentEditor';
import { useRecordComment } from './useRecordComment';
import { useSaveComment } from '../../crud/useSaveComment';
import { useMounted } from '../../utils';
import { UnsavedContext } from '../../context/UnsavedContext';
import { Box } from '@mui/material';

interface IRecordProps {
  mediafiles: Array<MediaFile>;
  users: Array<User>;
  groups: Array<Group>;
  memberships: Array<GroupMembership>;
}
interface IProps {
  discussion: Discussion;
  number: number;
}

export const ReplyCard = (props: IProps & IRecordProps) => {
  const { discussion, number, users, groups, memberships } = props;
  const [refresh, setRefresh] = useState(0);
  const isMounted = useMounted('replycard');
  const {
    toolChanged,
    saveCompleted,
    toolsChanged,
    saveRequested,
    clearRequested,
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
  const saveComment = useSaveComment({
    discussion: discussion.id,
    cb: afterSavecb,
    users,
    groups,
    memberships,
  });
  const commentText = useRef('');
  const afterUploadcb = (mediaId: string) => {
    saveComment('', commentText.current, mediaId, undefined);
    commentText.current = '';
  };
  const { uploadMedia, fileName } = useRecordComment({
    discussion,
    number,
    afterUploadcb,
  });
  const savingRef = useRef(false);
  const [canSaveRecording, setCanSaveRecording] = useState(false);

  const handleSaveEdit = () => {
    savingRef.current = true;
    //if we're recording and can save, the comment will save after upload
    if (!canSaveRecording) {
      if (commentText.current.length > 0) afterUploadcb('');
      else saveCompleted(myToolId);
    }
  };
  const handleCancelEdit = () => {
    setRefresh(refresh + 1);
    commentText.current = '';
    toolChanged(myToolId, false);
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
        fileName={fileName}
        uploadMethod={uploadMedia}
        onTextChange={handleTextChange}
        cancelOnlyIfChanged={true}
      />
    </Box>
  );
};
const mapRecordsToProps = {
  mediafiles: (q: QueryBuilder) => q.findRecords('mediafile'),
  users: (q: QueryBuilder) => q.findRecords('user'),
  groups: (q: QueryBuilder) => q.findRecords('group'),
  memberships: (q: QueryBuilder) => q.findRecords('groupmembership'),
};

export default withData(mapRecordsToProps)(ReplyCard) as any as (
  props: IProps
) => JSX.Element;
