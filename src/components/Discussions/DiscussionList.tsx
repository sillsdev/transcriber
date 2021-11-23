import {
  createStyles,
  Grid,
  IconButton,
  makeStyles,
  Paper,
  Theme,
  Typography,
} from '@material-ui/core';
import QueryBuilder from '@orbit/data/dist/types/query-builder';
import { useContext, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { useGlobal } from 'reactn';
import { PassageDetailContext } from '../../context/PassageDetailContext';
import { related } from '../../crud';
import { Discussion, IDiscussionListStrings, IState } from '../../model';
import localStrings from '../../selector/localize';
import AddIcon from '@material-ui/icons/Add';
import HideIcon from '@material-ui/icons/ArrowDropUp';
import ShowIcon from '@material-ui/icons/ArrowDropDown';
import DiscussionCard from './DiscussionCard';
import { TransformBuilder } from '@orbit/data';
import { AddRecord, UpdateRelatedRecord } from '../../model/baseModel';
import { withData } from '../../mods/react-orbitjs';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
      backgroundColor: theme.palette.background.default,
      marginBottom: theme.spacing(2),
      '& .MuiPaper-rounded': {
        borderRadius: '8px',
      },
    },
    discussionHead: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: theme.spacing(2),
    },
    name: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
    },
    icon: {
      paddingRight: theme.spacing(1),
    },
    actionButton: {
      color: theme.palette.primary.light,
    },
    cardFlow: {
      paddingLeft: theme.spacing(2),
      paddingRight: theme.spacing(2),
    },
  })
);
interface IStateProps {
  t: IDiscussionListStrings;
}
interface IRecordProps {
  discussions: Discussion[];
}
interface IProps extends IStateProps, IRecordProps {}

export function DiscussionList(props: IProps) {
  const { t, discussions } = props;
  const classes = useStyles();
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');
  const [displayDiscussions, setDisplayDiscussions] = useState<Discussion[]>(
    []
  );
  const [collapsed, setCollapsed] = useState(false);
  const [addingId, setAddingId] = useState('');
  const ctx = useContext(PassageDetailContext);
  const { currentstep, mediafileId } = ctx.state;

  useEffect(() => {
    // will I have a mediafileId here???
    if (currentstep !== '') {
      if (addingId !== '')
        setDisplayDiscussions(discussions.filter((d) => d.id === addingId));
      else
        setDisplayDiscussions(
          discussions

            .filter((d) => related(d, 'orgWorkflowStep') === currentstep)
            .sort((x, y) =>
              x.attributes.resolved === y.attributes.resolved
                ? x.attributes.dateCreated < y.attributes.dateCreated
                  ? -1
                  : 1
                : x.attributes.resolved
                ? 1
                : -1
            )
        );
    }
  }, [discussions, currentstep, addingId]);

  const handleAddComplete = () => {
    setAddingId('');
  };
  const handleAddCanceled = () => {
    memory.update((t: TransformBuilder) =>
      t.removeRecord({ type: 'discussion', id: addingId })
    );
    setAddingId('');
  };

  const handleAddDiscussion = async () => {
    const discussion: Discussion = {
      type: 'discussion',
      attributes: {
        subject: '',
      },
    } as any;
    const t = new TransformBuilder();
    var ops = [
      ...AddRecord(t, discussion, user, memory),
      ...UpdateRelatedRecord(
        t,
        discussion,
        'orgWorkflowStep',
        'orgworkflowstep',
        currentstep,
        user
      ),
    ];
    if (mediafileId)
      ops.push(
        ...UpdateRelatedRecord(
          t,
          discussion,
          'mediafile',
          'mediafile',
          mediafileId,
          user
        )
      );
    memory.update(ops);
    setAddingId(discussion.id);

    return discussion.id;
  };
  const handleToggleCollapse = () => {
    setCollapsed(!collapsed);
  };
  return (
    <Paper id="DiscussionList" className={classes.root}>
      <div className={classes.discussionHead}>
        <Typography variant="h6" className={classes.name}>
          {t.title}
        </Typography>
        <div>
          <IconButton
            id="addDiscussion"
            className={classes.actionButton}
            title={t.add}
            onClick={handleAddDiscussion}
          >
            <AddIcon />
          </IconButton>
          <IconButton
            id="collapseDiscussion"
            className={classes.actionButton}
            title={t.collapse}
            onClick={handleToggleCollapse}
          >
            {collapsed ? <ShowIcon /> : <HideIcon />}
          </IconButton>
        </div>
      </div>
      <Grid container className={classes.cardFlow}>
        {displayDiscussions.map((i) => {
          return (
            <DiscussionCard
              key={i.id}
              discussion={i}
              collapsed={collapsed}
              onAddCancelled={addingId ? handleAddCanceled : undefined}
              onAddComplete={addingId ? handleAddComplete : undefined}
            />
          );
        })}
      </Grid>
    </Paper>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'discussionList' }),
});
const mapRecordsToProps = {
  discussions: (q: QueryBuilder) => q.findRecords('discussion'),
};

export default withData(mapRecordsToProps)(
  connect(mapStateToProps)(DiscussionList) as any as any
) as any;
