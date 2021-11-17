import { createStyles, Grid, makeStyles, Theme } from '@material-ui/core';
import { connect } from 'react-redux';
import {
  Comment,
  ICommentCardStrings,
  ISharedStrings,
  IState,
  MediaFile,
  User,
} from '../../model';
import Confirm from '../AlertDialog';
import localStrings from '../../selector/localize';
import { QueryBuilder, TransformBuilder } from '@orbit/data';
import { withData } from '../../mods/react-orbitjs';
import { useEffect, useState } from 'react';
import { related } from '../../crud';
import UserAvatar from '../UserAvatar';
import { dateOrTime } from '../../utils';
import { useGlobal } from 'reactn';
import CommentMenu from './CommentMenu';
import { CommentEditor } from './CommentEditor';
import { UpdateRecord } from '../../model/baseModel';
import { memory } from '../../schema';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
      '&:hover button': {
        color: 'grey',
      },
      '& .MuiTypography-root': {
        cursor: 'default ',
      },
    },
    card: {
      minWidth: 275,
      margin: theme.spacing(1),
      backgroundColor: theme.palette.secondary.light,
    },
    selectedcard: {
      minWidth: 275,
      margin: theme.spacing(1),
      backgroundColor: theme.palette.secondary.dark,
    },
    spreadIt: {
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
      overflow: 'auto',
      color: theme.palette.primary.dark,
    },
  })
);
interface IRecordProps {
  mediafiles: Array<MediaFile>;
  users: Array<User>;
}
interface IStateProps {
  t: ICommentCardStrings;
  ts: ISharedStrings;
}
interface IProps extends IStateProps, IRecordProps {
  comment: Comment;
  selected: boolean;
  selectComment: (commentId: string) => void;
}

export const CommentCard = (props: IProps) => {
  const { t, ts, comment, selected, selectComment, mediafiles, users } = props;
  const classes = useStyles();
  const [author, setAuthor] = useState<User>();
  const [lang] = useGlobal('lang');
  const [user] = useGlobal('user');
  const [editing, setEditing] = useState(false);
  const [confirmAction, setConfirmAction] = useState('');

  const handleSelect = (comment: Comment) => () => {
    selectComment(comment.id);
  };
  const handleCommentAction = (what: string) => {
    if (what === 'edit') {
      setEditing(true);
    } else if ((what = 'delete')) {
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
  };
  const handleCancelEdit = () => {
    setEditing(false);
  };

  useEffect(() => {
    if (users) {
      var u = users.filter(
        (u) => (u.id = related(comment, 'lastModifiedByUser'))
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
            <Grid item className={classes.column}>
              <Grid item>{author?.attributes?.name}</Grid>
              <Grid item>
                {dateOrTime(comment.attributes.dateUpdated, lang)}
              </Grid>
            </Grid>
          </Grid>
          {author?.id === user && (
            <Grid item>
              <CommentMenu action={handleCommentAction} />
            </Grid>
          )}
        </Grid>
        <Grid item>
          {editing ? (
            <CommentEditor
              refresh={0}
              comment={comment.attributes?.commentText}
              okStr={ts.save}
              cancelStr={ts.cancel}
              onOk={handleCommentChange}
              onCancel={handleCancelEdit}
            />
          ) : (
            <div className={classes.text}>
              {comment.attributes?.commentText}
            </div>
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
const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'commentCard' }),
  ts: localStrings(state, { layout: 'shared' }),
});
export default withData(mapRecordsToProps)(
  connect(mapStateToProps)(CommentCard) as any
) as any;
