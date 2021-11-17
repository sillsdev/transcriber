import React, { useState } from 'react';
import { useGlobal, useEffect } from 'reactn';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import {
  Card,
  CardActions,
  CardContent,
  Grid,
  Typography,
} from '@material-ui/core';
import moment from 'moment';
import {
  Discussion,
  Comment,
  IDiscussionCardStrings,
  IState,
} from '../../model';
import ResolvedIcon from '@material-ui/icons/Check';
import { connect } from 'react-redux';
import localStrings from '../../selector/localize';
import { QueryBuilder } from '@orbit/data';
import { withData } from '../../mods/react-orbitjs';
import { related } from '../../crud';
import CommentCard from './CommentCard';
import ReplyCard from './ReplyCard';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
      '&:hover button': {
        color: 'white',
      },
      '& .MuiTypography-root': {
        cursor: 'default ',
      },
    },
    card: {
      minWidth: 275,
      margin: theme.spacing(1),
      backgroundColor: theme.palette.primary.light,
    },
    rootLoaded: {
      backgroundColor: theme.palette.primary.dark,
    },
    content: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      color: theme.palette.primary.contrastText,
    },
    firstLine: {
      width: '100%',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    name: {
      display: 'flex',
      alignItems: 'center',
    },
    button: {
      textTransform: 'none',
    },
    pos: {
      marginBottom: 12,
    },
    cardFlow: {
      paddingLeft: theme.spacing(2),
      paddingRight: theme.spacing(2),
      backgroundColor: theme.palette.background.paper,
    },
  })
);
interface IRecordProps {
  comments: Array<Comment>;
}
interface IStateProps {
  t: IDiscussionCardStrings;
}
interface IProps extends IRecordProps, IStateProps {
  discussion: Discussion;
}

export const DiscussionCard = (props: IProps) => {
  const classes = useStyles();
  const { t, discussion, comments } = props;
  const [selectedComment, setSelectedComment] = useState('');
  const [myComments, setMyComments] = useState<Comment[]>([]);

  const handleSelect = (discussion: Discussion) => () => {
    selectDiscussion(discussion);
  };
  const commentSelected = (commentId: string) => {
    setSelectedComment(commentId);
  };
  useEffect(() => {
    setMyComments(
      comments
        .filter((c) => related(c, 'discussion') === discussion.id)
        .sort((a, b) =>
          a.attributes.dateCreated < b.attributes.dateCreated ? -1 : 1
        )
    );
  }, [comments, discussion.id]);

  function selectDiscussion(discussion: Discussion) {}
  function discussionDescription(discussion: Discussion): React.ReactNode {
    return discussion.attributes.subject;
  }

  return (
    <div className={classes.root}>
      <Card
        id={`card-${discussion.id}`}
        className={classes.card}
        onClick={handleSelect(discussion)}
      >
        <CardContent className={classes.content}>
          <div className={classes.firstLine}>
            <Typography variant="h6" component="h2" className={classes.name}>
              {discussion.attributes?.subject}
            </Typography>
            {false && <ResolvedIcon />}
          </div>
          <Typography className={classes.pos}>
            {discussionDescription(discussion)}
          </Typography>
          <Typography variant="body2" component="p">
            {t.comments.replace('{0}', myComments.length.toString())}
          </Typography>
          <Grid container className={classes.cardFlow}>
            {myComments.map((i) => {
              return (
                <CommentCard
                  comment={i}
                  selected={i.id === selectedComment}
                  selectComment={commentSelected}
                />
              );
            })}
            <ReplyCard
              discussion={discussion}
              firstComment={myComments.length === 0}
              selected={'reply' === selectedComment}
              selectComment={commentSelected}
            />
          </Grid>
        </CardContent>
      </Card>
    </div>
  );
};
const mapRecordsToProps = {
  comments: (q: QueryBuilder) => q.findRecords('comment'),
};
const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'discussionCard' }),
});
export default withData(mapRecordsToProps)(
  connect(mapStateToProps)(DiscussionCard) as any
) as any;
