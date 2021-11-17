import {
  createStyles,
  Grid,
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
import { related, remoteIdGuid } from '../../crud';
import { Discussion, IDiscussionListStrings, IState } from '../../model';
import localStrings from '../../selector/localize';
import PersonIcon from '@material-ui/icons/Person';
import DiscussionCard from './DiscussionCard';

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
    cardFlow: {
      paddingLeft: theme.spacing(2),
      paddingRight: theme.spacing(2),
    },
  })
);
interface IStateProps {
  t: IDiscussionListStrings;
}

interface IProps extends IStateProps {}

export function DiscussionList(props: IProps) {
  const { t } = props;
  const classes = useStyles();
  const [memory] = useGlobal('memory');
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const ctx = useContext(PassageDetailContext);
  const { orgWorkflowSteps, currentstep, selected } = ctx.state;

  useEffect(() => {
    /* TEMP!! */
    var xx = remoteIdGuid('mediafile', '5001', memory.keyMap);
    if (xx !== '' && currentstep !== '') {
      var dis = (
        memory.cache.query((q: QueryBuilder) =>
          q.findRecords('discussion')
        ) as Discussion[]
      ).filter(
        (d) =>
          related(d, 'orgWorkflowStep') === currentstep &&
          related(d, 'mediafile') === xx
      );
      setDiscussions(dis);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgWorkflowSteps, currentstep, selected]);
  console.log(discussions);
  return (
    <Paper id="PersonalItem" className={classes.root}>
      <div className={classes.discussionHead}>
        <Typography variant="h5" className={classes.name}>
          <PersonIcon className={classes.icon} />
          {t.title}
        </Typography>
      </div>
      <Grid container className={classes.cardFlow}>
        {discussions.map((i) => {
          return <DiscussionCard discussion={i} />;
        })}
      </Grid>
    </Paper>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'discussionList' }),
});

export default connect(mapStateToProps)(DiscussionList) as any as any;
