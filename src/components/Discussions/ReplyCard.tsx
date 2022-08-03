import { createStyles, makeStyles, Theme } from '@material-ui/core';
import {
  Discussion,
  Group,
  GroupMembership,
  MediaFile,
  User,
} from '../../model';
import { QueryBuilder } from '@orbit/data';
import { withData } from '../../mods/react-orbitjs';
import { useContext, useEffect, useRef, useState } from 'reactn';
import { CommentEditor } from './CommentEditor';
import * as actions from '../../store';
import { useRecordComment } from './useRecordComment';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Auth from '../../auth/Auth';
import { useSaveComment } from '../../crud/useSaveComment';
import { useMounted } from '../../utils';
import { UnsavedContext } from '../../context/UnsavedContext';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
      flexFlow: 'column',
      flexGrow: 1,
    },

    commentLine: {
      width: '100%',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    content: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      color: theme.palette.primary.contrastText,
    },
    name: {
      display: 'flex',
      alignItems: 'center',
    },
    container: {
      display: 'flex',
    },
    row: {
      display: 'flex',
      flexDirection: 'row',
      flexGrow: 1,
    },
    column: {
      display: 'flex',
      flexDirection: 'column',
      flexGrow: 'inherit',
    },
    avatar: {
      margin: theme.spacing(1),
    },
  })
);
interface IRecordProps {
  mediafiles: Array<MediaFile>;
  users: Array<User>;
  groups: Array<Group>;
  memberships: Array<GroupMembership>;
}
interface IStateProps {}
interface IDispatchProps {
  uploadFiles: typeof actions.uploadFiles;
  nextUpload: typeof actions.nextUpload;
  uploadComplete: typeof actions.uploadComplete;
  doOrbitError: typeof actions.doOrbitError;
}

interface IProps extends IRecordProps, IStateProps, IDispatchProps {
  auth: Auth;
  discussion: Discussion;
  number: number;
}

export const ReplyCard = (props: IProps) => {
  const { auth, discussion, number, users, groups, memberships } = props;
  const { uploadFiles, nextUpload, uploadComplete, doOrbitError } = props;
  const classes = useStyles();
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
    doOrbitError,
    users,
    groups,
    memberships,
  });
  const commentText = useRef('');
  const afterUploadcb = (mediaId: string) => {
    saveComment('', commentText.current, mediaId, false);
    commentText.current = '';
  };
  const { uploadMedia, fileName } = useRecordComment({
    auth,
    discussion,
    number,
    afterUploadcb,
    uploadFiles,
    nextUpload,
    uploadComplete,
    doOrbitError,
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
    <div className={classes.root}>
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
    </div>
  );
};
const mapRecordsToProps = {
  mediafiles: (q: QueryBuilder) => q.findRecords('mediafile'),
  users: (q: QueryBuilder) => q.findRecords('user'),
  groups: (q: QueryBuilder) => q.findRecords('group'),
  memberships: (q: QueryBuilder) => q.findRecords('groupmembership'),
};
const mapStateToProps = () => ({});
const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
  ...bindActionCreators(
    {
      fetchBooks: actions.fetchBooks,
      uploadFiles: actions.uploadFiles,
      nextUpload: actions.nextUpload,
      uploadComplete: actions.uploadComplete,
      doOrbitError: actions.doOrbitError,
      resetOrbitError: actions.resetOrbitError,
    },
    dispatch
  ),
});
export default withData(mapRecordsToProps)(
  connect(mapStateToProps, mapDispatchToProps)(ReplyCard) as any
) as any;
