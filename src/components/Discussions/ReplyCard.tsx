import { createStyles, makeStyles, Theme } from '@material-ui/core';
import { Comment, Discussion, MediaFile, User } from '../../model';
import { QueryBuilder, TransformBuilder } from '@orbit/data';
import { withData } from '../../mods/react-orbitjs';
import { useGlobal, useState } from 'reactn';
import { CommentEditor } from './CommentEditor';
import { AddRecord } from '../../model/baseModel';
import * as actions from '../../store';
import { useRecordComment } from './useRecordComment';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

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
interface IDispatchProps {
  doOrbitError: typeof actions.doOrbitError;
}
interface IProps extends IRecordProps, IDispatchProps {
  discussion: Discussion;
  number: number;
}

export const ReplyCard = (props: IProps) => {
  const { discussion, number, doOrbitError } = props;
  const classes = useStyles();
  const recordComment = useRecordComment({ doOrbitError });
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');
  const [refresh, setRefresh] = useState(0);

  const handleCommentChange = (commentText: string) => {
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
  const handleRecord = () => {
    recordComment(discussion, number, () => {
      setRefresh(refresh + 1);
    });
  };

  return (
    <div className={classes.root}>
      <CommentEditor
        comment={''}
        refresh={refresh}
        onOk={handleCommentChange}
        onCancel={handleCancelEdit}
        onRecord={handleRecord}
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
      doOrbitError: actions.doOrbitError,
      resetOrbitError: actions.resetOrbitError,
    },
    dispatch
  ),
});
export default withData(mapRecordsToProps)(
  connect(mapStateToProps, mapDispatchToProps)(ReplyCard) as any
) as any;
