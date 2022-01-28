import { createStyles, makeStyles, Theme } from '@material-ui/core';
import { Discussion, MediaFile, User } from '../../model';
import { QueryBuilder } from '@orbit/data';
import { withData } from '../../mods/react-orbitjs';
import { useEffect, useGlobal, useRef, useState, useContext } from 'reactn';
import { CommentEditor } from './CommentEditor';
import * as actions from '../../store';
import { useRecordComment } from './useRecordComment';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Auth from '../../auth/Auth';
import { useSaveComment } from '../../crud/useSaveComment';
import { useMounted } from '../../utils';
import { PassageDetailContext } from '../../context/PassageDetailContext';

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
  const { auth, discussion, number } = props;
  const { uploadFiles, nextUpload, uploadComplete, doOrbitError } = props;
  const classes = useStyles();
  const [refresh, setRefresh] = useState(0);
  const isMounted = useMounted('replycard');
  const { toolChanged, toolSaveCompleted } =
    useContext(PassageDetailContext).state;
  const myId = discussion.id + 'r';
  const afterSavecb = () => {
    savingRef.current = false;
    toolSaveCompleted(myId, '');
    if (isMounted()) {
      setMyChanged(false);
      setRefresh(refresh + 1);
    }
  };
  const saveComment = useSaveComment({
    discussion: discussion.id,
    cb: afterSavecb,
    doOrbitError,
  });
  const afterUploadcb = (mediaId: string) => {
    saveComment('', commentText, mediaId);
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
  const [doSave] = useGlobal('doSave');
  const savingRef = useRef(false);
  const [commentText, setCommentText] = useState('');
  const [canSaveRecording, setCanSaveRecording] = useState(false);
  const [myChanged, setMyChanged] = useState(false);

  const handleSaveEdit = () => {
    savingRef.current = true;
    //if we're recording and can save, the comment will save after upload
    if (!canSaveRecording) {
      afterUploadcb('');
    }
    setCommentText('');
  };
  const handleCancelEdit = () => {
    setRefresh(refresh + 1);
    setCommentText('');
  };

  useEffect(() => {
    if (myChanged && doSave && !savingRef.current) {
      handleSaveEdit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doSave, myChanged]);

  const handleTextChange = (newText: string) => {
    setCommentText(newText);
    if (!myChanged) {
      setMyChanged(true);
      const valid = newText !== '' || canSaveRecording;
      if (valid) toolChanged(myId);
    }
  };

  useEffect(() => {
    if (canSaveRecording && !myChanged) {
      setMyChanged(true);
      toolChanged(myId);
    }
  }, [canSaveRecording, myChanged, myId, toolChanged]);

  return (
    <div className={classes.root}>
      <CommentEditor
        comment={commentText}
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
