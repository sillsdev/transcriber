import {
  Card,
  CardContent,
  createStyles,
  Grid,
  makeStyles,
  Theme,
} from '@material-ui/core';
import { connect } from 'react-redux';
import {
  Comment,
  Discussion,
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
import { AddRecord, UpdateRecord } from '../../model/baseModel';
import { memory } from '../../schema';
import plan from '../../model/plan';

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
    },
    column: {
      display: 'flex',
      flexDirection: 'column',
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
interface IStateProps {
  t: ICommentCardStrings;
  ts: ISharedStrings;
}
interface IProps extends IStateProps, IRecordProps {
  discussion: Discussion;
  firstComment: boolean;
  selected: boolean;
  selectComment: (commentId: string) => void;
}

export const ReplyCard = (props: IProps) => {
  const { t, ts, discussion, firstComment, selected, selectComment } = props;
  const classes = useStyles();
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');
  const [refresh, setRefresh] = useState(0);

  const handleSelect = () => () => {
    selectComment('reply');
  };
  const handleCommentChange = (commentText: string) => {
    console.log('save this comment!', commentText);
    const comment: Comment = {
      type: 'comment',
      attributes: {
        commentText,
      },
    } as any;
    memory.update((t: TransformBuilder) => [
      ...AddRecord(t, comment, user, memory),
      t.replaceRelatedRecord(comment, 'discussion', discussion),
    ]);
    setRefresh(refresh + 1);
  };
  const handleCancelEdit = () => {
    setRefresh(refresh + 1);
  };

  return (
    <div className={classes.root}>
      <Grid container className={classes.row}>
        <Grid className={classes.avatar} item xs={2}>
          <UserAvatar {...props} />
        </Grid>
        <Grid item>
          <CommentEditor
            comment={''}
            refresh={refresh}
            okStr={firstComment ? ts.save : t.reply}
            cancelStr={ts.cancel}
            onOk={handleCommentChange}
            onCancel={handleCancelEdit}
          />
        </Grid>
      </Grid>
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
  connect(mapStateToProps)(ReplyCard) as any
) as any;
