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
import { useContext, useEffect, useMemo, useState } from 'react';
import { related } from '../../crud';
import PlayIcon from '@material-ui/icons/PlayArrow';
import UserAvatar from '../UserAvatar';
import { dateOrTime } from '../../utils';
import { useGlobal } from 'reactn';
import { CommentEditor } from './CommentEditor';
import { UpdateRecord } from '../../model/baseModel';
import DiscussionMenu from './DiscussionMenu';
import { useRecordComment } from './useRecordComment';
import { bindActionCreators } from 'redux';
import { PassageDetailContext } from '../../context/PassageDetailContext';

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
        borderBottom: 'none',
      },
      '& .MuiInput-underline:after': {
        borderBottom: 'none',
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
  doOrbitError: typeof actions.doOrbitError;
}

interface IProps extends IStateProps, IRecordProps, IDispatchProps {
  comment: Comment;
  number: number;
  onEditing: (val: boolean) => void;
}

export const CommentCard = (props: IProps) => {
  const { t, comment, number, users, onEditing, doOrbitError } = props;
  const classes = useStyles();
  const [author, setAuthor] = useState<User>();
  const [lang] = useGlobal('lang');
  const [user] = useGlobal('user');
  const [memory] = useGlobal('memory');
  const { setSelected } = useContext(PassageDetailContext).state;
  const [editing, setEditing] = useState(false);
  const [confirmAction, setConfirmAction] = useState('');
  const recordComment = useRecordComment({ doOrbitError });
  const text = comment.attributes?.commentText;

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

  const handleCommentChange = (newComment: string) => {
    comment.attributes.commentText = newComment;
    memory.update((t: TransformBuilder) => UpdateRecord(t, comment, user));
    setEditing(false);
    onEditing(false);
  };
  const handleCancelEdit = () => {
    setEditing(false);
    onEditing(false);
  };
  const handleRecord = () => {
    const discussion = memory.cache.query((q: QueryBuilder) =>
      q.findRecord({ type: 'discussion', id: related(comment, 'discussion') })
    ) as Discussion;
    recordComment(discussion, number, comment);
  };

  const media = useMemo(() => {
    const id = related(comment, 'mediafile');
    if (!id || id === '') return null;
    const recId = { type: 'mediafile', id };
    return memory.cache.query((q: QueryBuilder) => q.findRecord(recId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comment]);

  const handlePlayComment = () => {
    const mediaId = related(comment, 'mediafile');
    setSelected(mediaId);
  };

  useEffect(() => {
    if (users) {
      var u = users.filter(
        (u) => u.id === related(comment, 'lastModifiedByUser')
      );
      if (u.length > 0) setAuthor(u[0]);
    }
  }, [comment, users]);

  return (
    <div className={classes.root}>
      <Grid container className={classes.row}>
        <Grid container className={classes.spreadIt}>
          <Grid item className={classes.row}>
            <Grid item className={classes.avatar}>
              <UserAvatar {...props} userRec={author} />
            </Grid>
            {media && (
              <IconButton onClick={handlePlayComment}>
                <PlayIcon />
              </IconButton>
            )}
            <Grid item className={classes.column}>
              <Grid item>{author?.attributes?.name}</Grid>
              <Grid item>
                {dateOrTime(comment.attributes.dateUpdated, lang)}
              </Grid>
            </Grid>
          </Grid>
          {author?.id === user && (
            <Grid item>
              <DiscussionMenu action={handleCommentAction} />
            </Grid>
          )}
        </Grid>
        <Grid item xs={12}>
          {editing ? (
            <CommentEditor
              refresh={0}
              comment={comment.attributes?.commentText}
              onOk={handleCommentChange}
              onCancel={handleCancelEdit}
              onRecord={handleRecord}
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
