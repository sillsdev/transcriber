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
import { PassageDetailContext } from '../../context/PassageDetailContext';
import { related } from '../../crud';
import { Discussion, IDiscussionListStrings, IState } from '../../model';
import localStrings from '../../selector/localize';
import AddIcon from '@material-ui/icons/Add';
import HideIcon from '@material-ui/icons/ArrowDropUp';
import ShowIcon from '@material-ui/icons/ArrowDropDown';
import DiscussionCard from './DiscussionCard';
import { withData } from '../../mods/react-orbitjs';
import { useGlobal } from 'reactn';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
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
  const [changed, setChanged] = useGlobal('changed');
  const [displayDiscussions, setDisplayDiscussions] = useState<Discussion[]>(
    []
  );
  const [collapsed, setCollapsed] = useState(false);
  const [adding, setAdding] = useState(false);
  const ctx = useContext(PassageDetailContext);
  const { currentstep, rowData, discussionSize } = ctx.state;
  const [rootWidthStyle, setRootWidthStyle] = useState({
    width: `${discussionSize}px`,
  });
  const currentPassage = (d: Discussion) => {
    const mediaId = related(d, 'mediafile');
    return rowData.filter((r) => r.id === mediaId).length > 0;
  };

  useEffect(() => {
    setRootWidthStyle({
      width: `${discussionSize}px`,
    });
  }, [discussionSize]);

  useEffect(() => {
    if (currentstep !== '') {
      if (adding)
        setDisplayDiscussions([
          {
            type: 'discussion',
            attributes: {
              subject: '',
            },
          } as any as Discussion,
        ]);
      else
        setDisplayDiscussions(
          discussions
            .filter(
              (d) =>
                related(d, 'orgWorkflowStep') === currentstep &&
                currentPassage(d)
            )
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discussions, currentstep, adding]);

  useEffect(() => {
    if (changed) {
      setAdding(false);
      setChanged(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentstep]);

  const handleAddComplete = () => {
    setAdding(false);
    setChanged(false);
  };

  const handleAddDiscussion = async () => {
    setAdding(true);
    setChanged(true);
  };
  const handleToggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  const isMediaMissing = () => {
    return rowData.length === 0 || rowData[0].isResource;
  };

  return (
    <Paper id="DiscussionList" className={classes.root} style={rootWidthStyle}>
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
            disabled={adding || isMediaMissing()}
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
        {displayDiscussions.map((i, j) => (
          <DiscussionCard
            key={j}
            discussion={i}
            collapsed={collapsed}
            onAddComplete={adding ? handleAddComplete : undefined}
          />
        ))}
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
