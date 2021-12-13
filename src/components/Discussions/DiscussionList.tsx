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
import { useContext, useEffect, useMemo, useState } from 'react';
import { connect } from 'react-redux';
import { PassageDetailContext } from '../../context/PassageDetailContext';
import { getMediaInPlans, related, useArtifactType, useRole } from '../../crud';
import {
  Discussion,
  IDiscussionListStrings,
  IState,
  MediaFile,
} from '../../model';
import localStrings from '../../selector/localize';
import AddIcon from '@material-ui/icons/Add';
import HideIcon from '@material-ui/icons/ArrowDropUp';
import ShowIcon from '@material-ui/icons/ArrowDropDown';
import DiscussionCard from './DiscussionCard';
import { withData } from '../../mods/react-orbitjs';
import { useGlobal } from 'reactn';
import FilterMenu, { IFilterState } from './FilterMenu';

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
  mediafiles: MediaFile[];
}
interface IProps extends IStateProps, IRecordProps {}

export function DiscussionList(props: IProps) {
  const { t, discussions, mediafiles } = props;
  const classes = useStyles();
  const [changed, setChanged] = useGlobal('changed');
  const [projRole] = useGlobal('projRole');
  const [planId] = useGlobal('plan');
  const [userId] = useGlobal('user');
  const [displayDiscussions, setDisplayDiscussions] = useState<Discussion[]>(
    []
  );
  const [collapsed, setCollapsed] = useState(false);
  const [adding, setAdding] = useState(false);
  const ctx = useContext(PassageDetailContext);
  const { currentstep, rowData, discussionSize, passage } = ctx.state;
  const { getRoleRec } = useRole();
  const { vernacularId } = useArtifactType();
  const [rootWidthStyle, setRootWidthStyle] = useState({
    width: `${discussionSize}px`,
  });
  const [filterState, setFilterState] = useState<IFilterState>({
    forYou: false,
    resolved: false,
    latestVersion: false,
    allPassages: false,
    allSteps: false,
  });
  const { forYou, resolved, latestVersion, allPassages, allSteps } =
    filterState;

  // All passages is currently giving all passages in all projects.
  // we would need this if we only wanted the passages of this project.
  // const planMedia = useMemo(
  //   () =>
  //     mediafiles.filter((m) => related(m, 'plan') === planId) as MediaFile[],
  //   [mediafiles, planId]
  // );

  const currentPassage = (d: Discussion) => {
    const mediaId = related(d, 'mediafile');
    const mediaRec = mediafiles.find((m) => m.id === mediaId);
    return mediaRec && passage && related(mediaRec, 'passage') === passage.id;
  };

  const projRoleId = useMemo(
    () => {
      if (!projRole) return '';
      const roleRec = getRoleRec(projRole, false);
      return roleRec.length > 0 ? roleRec[0].id : '';
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [projRole]
  );

  const latestMedia: string[] = useMemo(() => {
    return getMediaInPlans([planId], mediafiles, vernacularId, true).map(
      (r) => r.id
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId, mediafiles]);

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
                (!forYou ||
                  related(d, 'user') === userId ||
                  related(d, 'role') === projRoleId) &&
                resolved === Boolean(d.attributes?.resolved) &&
                (!latestVersion ||
                  latestMedia.indexOf(related(d, 'mediafile')) >= 0) &&
                (allPassages || currentPassage(d)) &&
                (allSteps || related(d, 'orgWorkflowStep') === currentstep)
            )
            .sort((x, y) =>
              x.attributes.dateCreated < y.attributes.dateCreated ? -1 : 1
            )
        );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discussions, currentstep, adding, filterState]);

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

  const handleFilterAction = (what: string) => {
    if (what === 'Close') {
    } else if (Object.keys(filterState).includes(what)) {
      setFilterState({ ...filterState, [what]: !filterState[what] });
    }
  };

  const isMediaMissing = () => {
    return rowData.length === 0 || rowData[0].isResource;
  };

  const filterStatus = useMemo(
    () =>
      t.filterStatus
        .replace('{0}', displayDiscussions.length.toString())
        .replace('{1}', discussions.length.toString()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [displayDiscussions, discussions]
  );

  return (
    <Paper id="DiscussionList" className={classes.root} style={rootWidthStyle}>
      <div className={classes.discussionHead}>
        <div>
          <Typography variant="h6" className={classes.name}>
            {t.title}
          </Typography>
          <Typography>{filterStatus}</Typography>
        </div>
        <div>
          <FilterMenu state={filterState} action={handleFilterAction} />
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
  mediafiles: (q: QueryBuilder) => q.findRecords('mediafile'),
};

export default withData(mapRecordsToProps)(
  connect(mapStateToProps)(DiscussionList) as any as any
) as any;
