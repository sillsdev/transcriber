import {
  createStyles,
  Grid,
  IconButton,
  makeStyles,
  TextField,
  Theme,
} from '@material-ui/core';
import { connect } from 'react-redux';
import {
  Comment,
  Discussion,
  ICommentCardStrings,
  IState,
  MediaFile,
  User,
} from '../../model';
import * as actions from '../../store';
import Confirm from '../AlertDialog';
import localStrings from '../../selector/localize';
import { QueryBuilder, TransformBuilder } from '@orbit/data';
import { withData } from '../../mods/react-orbitjs';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { findRecord, related } from '../../crud';
import PlayIcon from '@material-ui/icons/PlayArrow';
import UserAvatar from '../UserAvatar';
import { dateOrTime } from '../../utils';
import { useGlobal } from 'reactn';
import { CommentEditor } from './CommentEditor';
import DiscussionMenu from './DiscussionMenu';
import { useRecordComment } from './useRecordComment';
import { bindActionCreators } from 'redux';
import { PassageDetailContext } from '../../context/PassageDetailContext';
import Auth from '../../auth/Auth';
import { useSaveComment } from '../../crud/useSaveComment';
import { UnsavedContext } from '../../context/UnsavedContext';
import MediaPlayer from '../MediaPlayer';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
      flexGrow: 1,
      '&:hover button': {
        color: 'primary',
      },
      '& .MuiTypography-root': {
        cursor: 'default ',
      },
    },
    card: {
      // minWidth: 275,
      margin: theme.spacing(1),
      backgroundColor: theme.palette.secondary.light,
    },
    selectedcard: {
      // minWidth: 275,
      margin: theme.spacing(1),
      backgroundColor: theme.palette.secondary.dark,
    },
    spreadIt: {
      display: 'flex',
      justifyContent: 'space-between',
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
    },
    column: {
      display: 'flex',
      flexDirection: 'column',
      color: theme.palette.primary.dark,
    },
    avatar: {
      margin: theme.spacing(1),
    },
    text: {
      color: theme.palette.primary.dark,
      wordBreak: 'break-word',
      '& .MuiInput-underline:before': {
        content: 'none',
      },
    },
    button: {
      color: theme.palette.background.paper,
    },
  })
);
interface IRecordProps {
  mediafiles: Array<MediaFile>;
  users: Array<User>;
}
interface IStateProps {
  t: ICommentCardStrings;
}
interface IDispatchProps {
  uploadFiles: typeof actions.uploadFiles;
  nextUpload: typeof actions.nextUpload;
  uploadComplete: typeof actions.uploadComplete;
  doOrbitError: typeof actions.doOrbitError;
}

interface IProps extends IStateProps, IRecordProps, IDispatchProps {
  auth: Auth;
  comment: Comment;
  discussion: Discussion;
  number: number;
  onEditing: (val: boolean) => void;
}

export const CommentCard = (props: IProps) => {
  const { t, auth, comment, discussion, number, users, onEditing } = props;
  const { uploadFiles, nextUpload, uploadComplete, doOrbitError } = props;
  const classes = useStyles();
  const [author, setAuthor] = useState<User>();
  const [lang] = useGlobal('lang');
  const [user] = useGlobal('user');
  const [memory] = useGlobal('memory');
  const savingRef = useRef(false);
  const {
    setSelected,
    commentPlaying,
    setCommentPlaying,
    commentPlayId,
    handleCommentPlayEnd,
    handleCommentTogglePlay,
  } = useContext(PassageDetailContext).state;
  const {
    toolChanged,
    toolsChanged,
    saveCompleted,
    saveRequested,
    clearRequested,
  } = useContext(UnsavedContext).state;
  const [editing, setEditing] = useState(false);
  const [canSaveRecording, setCanSaveRecording] = useState(false);
  const [editComment, setEditComment] = useState('');
  const [confirmAction, setConfirmAction] = useState('');

  const reset = () => {
    setEditing(false);
    onEditing(false);
    setChanged(false);
    savingRef.current = false;
  };
  const setChanged = (changed: boolean) => {
    const valid = editComment !== '' || canSaveRecording;
    toolChanged(comment.id, changed && valid);
  };

  const saveComment = useSaveComment({
    discussion: discussion.id,
    cb: reset,
    doOrbitError,
  });
  const afterUploadcb = (mediaId: string) => {
    saveComment(comment.id, editComment, mediaId);
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
  const text = comment.attributes?.commentText;
  const [mediaId, setMediaId] = useState('');

  useEffect(() => {
    setEditComment(comment.attributes.commentText);
  }, [comment]);

  useEffect(() => {
    if (saveRequested(comment.id) && !savingRef.current) {
      handleSaveEdit();
    } else if (clearRequested(comment.id)) handleCancelEdit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolsChanged]);

  useEffect(() => {
    if (canSaveRecording) {
      setChanged(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSaveRecording]);

  const handleCommentAction = (what: string) => {
    if (what === 'edit') {
      setEditing(true);
      onEditing(true);
    } else if (what === 'delete') {
      setConfirmAction(what);
    }
  };
  const handleDelete = () => {
    memory.update((t: TransformBuilder) =>
      t.removeRecord({
        type: 'comment',
        id: comment.id,
      })
    );
    reset();
  };

  const handleActionConfirmed = () => {
    if (confirmAction === 'delete') {
      handleDelete();
    }
    setConfirmAction('');
  };

  const handleActionRefused = () => {
    setConfirmAction('');
  };

  const handleSaveEdit = () => {
    savingRef.current = true;
    //if we're recording and can save, the comment will save after upload
    if (!canSaveRecording) {
      if (editComment.length > 0) afterUploadcb('');
      else saveCompleted(comment.id);
    }
  };
  const handleCancelEdit = () => {
    reset();
  };

  const handleTextChange = (newText: string) => {
    setEditComment(newText);
    setChanged(true);
  };

  const media = useMemo(() => {
    if (!mediaId || mediaId === '') return null;
    return findRecord(memory, 'mediafile', mediaId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comment, mediaId]);

  const handlePlayComment = () => {
    if (mediaId === commentPlayId) setCommentPlaying(!commentPlaying);
    else setSelected(mediaId);
  };

  useEffect(() => {
    if (users) {
      var u = users.filter(
        (u) => u.id === related(comment, 'lastModifiedByUser')
      );
      if (u.length > 0) setAuthor(u[0]);
    }
    setMediaId(related(comment, 'mediafile'));
  }, [comment, users]);

  return (
    <div className={classes.root}>
      <Grid container className={classes.row}>
        <Grid container className={classes.spreadIt}>
          <Grid item className={classes.row}>
            <Grid item id="user" className={classes.avatar}>
              <UserAvatar {...props} userRec={author} />
            </Grid>
            {mediaId === commentPlayId ? (
              <Grid item className={classes.column}>
                <MediaPlayer
                  auth={auth}
                  srcMediaId={mediaId === commentPlayId ? commentPlayId : ''}
                  requestPlay={commentPlaying}
                  onEnded={handleCommentPlayEnd}
                  onTogglePlay={handleCommentTogglePlay}
                  controls={mediaId === commentPlayId}
                />
              </Grid>
            ) : (
              <>
                {media && (
                  <IconButton onClick={handlePlayComment}>
                    <PlayIcon />
                  </IconButton>
                )}
                <Grid container className={classes.column}>
                  <Grid item>{author?.attributes?.name}</Grid>
                  <Grid item>
                    {dateOrTime(comment.attributes.dateUpdated, lang)}
                  </Grid>
                </Grid>
              </>
            )}
            <Grid item className={classes.column}>
              <Grid item id="author">
                {author?.attributes?.name}
              </Grid>
              <Grid item id="dateupdated">
                {dateOrTime(comment.attributes.dateUpdated, lang)}
              </Grid>
            </Grid>
          </Grid>
          {mediaId !== commentPlayId && author?.id === user && (
            <Grid item>
              <DiscussionMenu action={handleCommentAction} />
            </Grid>
          )}
        </Grid>
        <Grid item xs={12}>
          {editing ? (
            <CommentEditor
              toolId={comment.id}
              refresh={0}
              comment={comment.attributes?.commentText}
              onCancel={handleCancelEdit}
              onOk={handleSaveEdit}
              setCanSaveRecording={setCanSaveRecording}
              onTextChange={handleTextChange}
              fileName={fileName}
              uploadMethod={uploadMedia}
            />
          ) : text ? (
            <TextField
              className={classes.text}
              id="outlined-textarea"
              value={text}
              multiline
              fullWidth
            />
          ) : (
            <></>
          )}
        </Grid>
      </Grid>

      {confirmAction === '' || (
        <Confirm
          text={t.confirmDelete}
          yesResponse={handleActionConfirmed}
          noResponse={handleActionRefused}
        />
      )}
    </div>
  );
};
const mapRecordsToProps = {
  mediafiles: (q: QueryBuilder) => q.findRecords('mediafile'),
  users: (q: QueryBuilder) => q.findRecords('user'),
};
const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
  ...bindActionCreators(
    {
      uploadFiles: actions.uploadFiles,
      nextUpload: actions.nextUpload,
      uploadComplete: actions.uploadComplete,
      doOrbitError: actions.doOrbitError,
    },
    dispatch
  ),
});
const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'commentCard' }),
});
export default withData(mapRecordsToProps)(
  connect(mapStateToProps, mapDispatchToProps)(CommentCard) as any
) as any;
