import {
  createStyles,
  Grid,
  IconButton,
  makeStyles,
  Paper,
  Theme,
  Typography,
  useTheme,
} from '@material-ui/core';
import QueryBuilder from '@orbit/data/dist/types/query-builder';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { connect } from 'react-redux';
import { PassageDetailContext } from '../../context/PassageDetailContext';
import {
  findRecord,
  getMediaInPlans,
  related,
  useTeamUpdate,
  VernacularTag,
} from '../../crud';
import {
  Discussion,
  IDiscussionListStrings,
  IState,
  MediaFile,
  Group,
  User,
  GroupMembership,
  RoleNames,
  Organization,
} from '../../model';
import localStrings from '../../selector/localize';
import AddIcon from '@mui/icons-material/Add';
import HideIcon from '@mui/icons-material/ArrowDropUp';
import ShowIcon from '@mui/icons-material/ArrowDropDown';
import DiscussionCard, { DiscussionRegion } from './DiscussionCard';
import BigDialog from '../../hoc/BigDialog';
import CategoryList, { CatData } from './CategoryList';
import { withData } from '../../mods/react-orbitjs';
import { useGlobal } from 'reactn';
import { useDiscussionOrg } from '../../crud';
import FilterMenu, { IFilterState } from './FilterMenu';
import Confirm from '../AlertDialog';
import { onlyUnique, waitForIt } from '../../utils';
import { UnsavedContext } from '../../context/UnsavedContext';
import SortMenu, { ISortState } from './SortMenu';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      backgroundColor: theme.palette.background.default,
      marginBottom: theme.spacing(1),
      '& .MuiPaper-rounded': {
        borderRadius: '8px',
      },
      overflow: 'auto',
    },
    discussionHead: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: theme.spacing(1),
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
    cardFlow: {},
  })
);
interface IStateProps {
  t: IDiscussionListStrings;
}
interface IRecordProps {
  discussions: Discussion[];
  mediafiles: MediaFile[];
  users: User[];
  groups: Group[];
  groupMemberships: GroupMembership[];
}
interface IProps extends IStateProps, IRecordProps {}
export const NewDiscussionToolId = 'newDiscussion';

export function DiscussionList(props: IProps) {
  const { t, discussions, mediafiles, users, groups, groupMemberships } = props;
  const classes = useStyles();
  const theme = useTheme();
  const [planId] = useGlobal('plan');
  const [userId] = useGlobal('user');
  const [organization] = useGlobal('organization');
  const [memory] = useGlobal('memory');
  const [projRole] = useGlobal('projRole');
  const [isOffline] = useGlobal('offline');
  const [displayDiscussions, setDisplayDiscussions] = useState<Discussion[]>(
    []
  );
  const [collapsed, setCollapsed] = useState(false);
  const [adding, setAdding] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const ctx = useContext(PassageDetailContext);
  const {
    currentstep,
    rowData,
    discussionSize,
    passage,
    currentSegment,
    mediafileId,
    setDiscussionMarkers,
  } = ctx.state;
  const { toolsChanged } = useContext(UnsavedContext).state;

  const [rootWidthStyle, setRootWidthStyle] = useState({
    width: `${discussionSize.width - 30}px`, //leave room for scroll bar
    maxHeight: discussionSize.height,
  });
  const [filterState, setFilterStatex] = useState<IFilterState>({
    forYou: false,
    resolved: false,
    latestVersion: false,
    allPassages: false,
    allSteps: false,
  });
  const { forYou, resolved, latestVersion, allPassages, allSteps } =
    filterState;
  const [sortState, setSortState] = useState<ISortState>({
    topic: true,
    assignedTo: false,
    lastUpdated: false,
  });
  const [catFilter, setCatFilter] = useState<CatData[]>([]);
  const [catSelect, setCatSelect] = useState<string[]>([]);
  const [confirmFilterSave, setConfirmFilterSave] = useState(false);
  const [confirmAction, setConfirmAction] = useState<string>('');
  const [startSave, setStartSave] = useState(false);
  const [clearSave, setClearSave] = useState(false);
  const discussionOrg = useDiscussionOrg();
  const orgUpdate = useTeamUpdate();
  const anyChangedRef = useRef(false);
  const enum WaitSave {
    add = 'add',
    collapse = 'collapse',
    category = 'category',
    filter = 'filter:',
    sort = 'sort',
    changePassage = 'leave passage',
  }
  const formRef = useRef<any>();
  const [highlightedRef, setHighlightedRef] = useState<any>();
  const [highlightNew, setHighlightNew] = useState('');

  const projGroups = useMemo(() => {
    const mygroups = groupMemberships.filter(
      (gm) => related(gm, 'user') === userId
    );
    return mygroups.map((g) => related(g, 'group'));
  }, [groupMemberships, userId]);

  useEffect(() => {
    const org = findRecord(
      memory,
      'organization',
      organization
    ) as Organization;
    const json = JSON.parse(org.attributes.defaultParams ?? '{}');
    if (json.discussionFilter) {
      setFilterStatex(json.discussionFilter);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization]);

  const setFilterState = (filter: IFilterState) => {
    setFilterStatex(filter);
    if (projRole === RoleNames.Admin && !isOffline) {
      //see if this is the new org default
      setConfirmFilterSave(true);
    }
  };
  // All passages is currently giving all passages in all projects.
  // we would need this if we only wanted the passages of this project.
  // const planMedia = useMemo(
  //   () =>
  //     mediafiles.filter((m) => related(m, 'plan') === planId) as MediaFile[],
  //   [mediafiles, planId]
  // );

  const handleCategory = () => {
    setCategoryOpen(!categoryOpen);
  };

  const handleCatFilter = (catData: CatData[]) => {
    setCatFilter(catData);
    setCatSelect(
      catData.reduce((p, v) => {
        return v.selected ? p.concat(v.id) : p;
      }, Array<string>())
    );
  };

  const currentPassage = (d: Discussion) => {
    const mediaId = related(d, 'mediafile');
    const mediaRec = mediafiles.find((m) => m.id === mediaId);
    return mediaRec && passage && related(mediaRec, 'passage') === passage.id;
  };

  const latestMedia: string[] = useMemo(() => {
    if (!planId) return [];
    return getMediaInPlans([planId], mediafiles, VernacularTag, true).map(
      (r) => r.id
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId, mediafiles]);

  useEffect(() => {
    setRootWidthStyle({
      width: `${discussionSize.width - 30}px`,
      maxHeight: discussionSize.height,
    });
  }, [discussionSize]);

  const discussionSort = (x: Discussion, y: Discussion) => {
    const topicSort = () => {
      var xreg = DiscussionRegion(x);
      var yreg = DiscussionRegion(y);
      return xreg && yreg
        ? xreg.start - yreg.start
        : xreg
        ? -1
        : yreg
        ? 1
        : x.attributes.subject <= y.attributes.subject
        ? -1
        : 1;
    };
    if (sortState.lastUpdated)
      return x.attributes.dateUpdated > y.attributes.dateUpdated ? -1 : 1;
    else if (sortState.assignedTo) {
      var xat =
        users.find((u) => u.id === related(x, 'user'))?.attributes?.name ||
        groups.find((g) => g.id === related(x, 'group'))?.attributes?.name;
      var yat =
        users.find((u) => u.id === related(y, 'user'))?.attributes?.name ||
        groups.find((g) => g.id === related(y, 'group'))?.attributes?.name;
      return (!xat && !yat) || xat === yat
        ? topicSort()
        : xat && yat
        ? xat <= yat
          ? -1
          : 1
        : xat
        ? -1
        : 1;
    }
    //topic
    else {
      return topicSort();
    }
  };
  useEffect(() => {
    if (currentstep !== '') {
      if (adding) {
        setDisplayDiscussions([
          {
            type: 'discussion',
            attributes: {
              subject: currentSegment || '',
            },
          } as any as Discussion,
        ]);
      } else {
        setDisplayDiscussions(
          discussions
            .filter(
              (d) =>
                (!forYou ||
                  related(d, 'user') === userId ||
                  projGroups?.includes(related(d, 'group'))) &&
                resolved === Boolean(d.attributes?.resolved) &&
                (!latestVersion ||
                  latestMedia.indexOf(related(d, 'mediafile')) >= 0) &&
                (allPassages || currentPassage(d)) &&
                (allSteps
                  ? discussionOrg(d) === organization
                  : related(d, 'orgWorkflowStep') === currentstep) &&
                (catSelect.length === 0 ||
                  catSelect.includes(related(d, 'artifactCategory')))
            )
            .sort((x, y) => discussionSort(x, y))
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    discussions,
    currentstep,
    adding,
    filterState,
    sortState,
    catFilter,
    passage,
  ]);

  useEffect(() => {
    if (formRef.current && highlightedRef?.current) {
      formRef.current.scrollTo(
        0,
        Math.max(0, highlightedRef.current.offsetTop - 80)
      );
    }
  }, [highlightedRef]);

  useEffect(() => {
    var markers = displayDiscussions
      .filter(
        (d) =>
          !Boolean(d.attributes?.resolved) &&
          DiscussionRegion(d) &&
          related(d, 'mediafile') === mediafileId
      )
      .map((d) => DiscussionRegion(d)?.start || 0)
      .filter(onlyUnique)
      .map((t) => {
        return {
          time: t,
          color: theme.palette.secondary.light,
        };
      });
    setDiscussionMarkers(markers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayDiscussions, mediafileId]);

  useEffect(() => {
    setAdding(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentstep, passage]);

  const doTheThing = () => {
    switch (confirmAction) {
      case WaitSave.add:
        setAdding(true);
        break;
      case WaitSave.collapse:
        setCollapsed(true);
        break;
      case WaitSave.category:
        setCategoryOpen(true);
        break;
    }
    if (confirmAction.startsWith(WaitSave.filter)) {
      var what = confirmAction.substring(WaitSave.filter.length);
      setFilterState({ ...filterState, [what]: !filterState[what] });
    }
    setConfirmAction('');
  };

  const waitSaveOrClear = () => {
    waitForIt(
      'discussions all saved',
      () => !anyChangedRef.current,
      () => false,
      300
    ).then(() => {
      setStartSave(false);
      setClearSave(false);
      doTheThing();
    });
  };
  const handleSaveFilterConfirmed = () => {
    var org = findRecord(memory, 'organization', organization) as Organization;
    var json = JSON.parse(org.attributes.defaultParams ?? '{}');
    json.discussionFilter = filterState;
    org.attributes.defaultParams = JSON.stringify(json);
    orgUpdate(org);
    setConfirmFilterSave(false);
  };
  const handleSaveFilterRefused = () => {
    setConfirmFilterSave(false);
  };
  const handleSaveFirstConfirmed = () => {
    setStartSave(true);
    waitSaveOrClear();
  };

  const handleSaveFirstRefused = () => {
    setClearSave(true);
    waitSaveOrClear();
  };

  useEffect(() => {
    var myIds = displayDiscussions.map((d) => d.id);
    myIds.push(NewDiscussionToolId);
    anyChangedRef.current = Object.keys(toolsChanged).some((t) =>
      myIds.includes(t)
    );
  }, [toolsChanged, displayDiscussions]);

  const checkChanged = (whatNext: string) => {
    if (anyChangedRef.current) {
      setConfirmAction(whatNext);
      return true;
    }
    return false;
  };

  const handleAddComplete = (id: string) => {
    setAdding(false);
    setHighlightNew(id);
  };

  const handleAddDiscussion = async () => {
    if (!checkChanged(WaitSave.add)) setAdding(true);
  };

  const handleToggleCollapse = () => {
    if (collapsed || !checkChanged(WaitSave.collapse)) setCollapsed(!collapsed);
  };

  const handleFilterAction = (what: string) => {
    if (what === 'Close') {
    } else if (Object.keys(filterState).includes(what)) {
      if (!checkChanged(WaitSave.filter + what))
        setFilterState({ ...filterState, [what]: !filterState[what] });
    } else {
      if (!checkChanged(WaitSave.category)) setCategoryOpen(true);
    }
  };
  const handleSortAction = (what: string) => {
    if (what === 'Close') {
    } else if (!checkChanged(WaitSave.sort + what)) {
      var newSort = { ...sortState };
      Object.keys(sortState).forEach((key) => (newSort[key] = key === what));
      setSortState(newSort);
    }
  };
  const isMediaMissing = () => {
    return rowData.length === 0 || !rowData[0].isVernacular;
  };

  const filterStatus = useMemo(
    () =>
      t.filterStatus
        .replace('{0}', displayDiscussions.length.toString())
        .replace(
          '{1}',
          discussions
            .filter((d) => discussionOrg(d) === organization)
            .length.toString()
        ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [displayDiscussions, discussions]
  );

  return (
    <Paper id="DiscussionListHeader" className={classes.root}>
      <>
        <div className={classes.discussionHead}>
          <div>
            <Typography variant="h6" className={classes.name}>
              {t.title}
            </Typography>
            <Typography>{filterStatus}</Typography>
          </div>
          <div>
            <SortMenu
              state={sortState}
              action={handleSortAction}
              disabled={adding || isMediaMissing()}
            />
            <FilterMenu
              state={filterState}
              action={handleFilterAction}
              cats={catSelect.length}
              disabled={adding || isMediaMissing()}
            />
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
        <Paper
          ref={formRef}
          id="DiscussionList"
          className={classes.root}
          style={rootWidthStyle}
        >
          <Grid container className={classes.cardFlow}>
            {displayDiscussions.map((i, j) => (
              <DiscussionCard
                id={`card-${j}`}
                key={j}
                discussion={i}
                collapsed={collapsed}
                onAddComplete={adding ? handleAddComplete : undefined}
                showStep={allSteps}
                showReference={allPassages}
                startSave={startSave}
                clearSave={clearSave}
                setRef={setHighlightedRef}
                requestHighlight={highlightNew}
              />
            ))}
          </Grid>
        </Paper>
        <BigDialog
          title={t.categoryList}
          isOpen={categoryOpen}
          onOpen={handleCategory}
        >
          <CategoryList catFilter={catFilter} onCatFilter={handleCatFilter} />
        </BigDialog>
        {confirmAction === '' || (
          <Confirm
            jsx={<span></span>}
            text={t.saveFirst}
            yesResponse={handleSaveFirstConfirmed}
            noResponse={handleSaveFirstRefused}
          />
        )}
        {confirmFilterSave && (
          <Confirm
            jsx={<span></span>}
            text={t.saveFilter}
            yesResponse={handleSaveFilterConfirmed}
            noResponse={handleSaveFilterRefused}
          />
        )}
      </>
    </Paper>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'discussionList' }),
});
const mapRecordsToProps = {
  discussions: (q: QueryBuilder) => q.findRecords('discussion'),
  mediafiles: (q: QueryBuilder) => q.findRecords('mediafile'),
  users: (q: QueryBuilder) => q.findRecords('user'),
  groups: (q: QueryBuilder) => q.findRecords('group'),
  groupMemberships: (q: QueryBuilder) => q.findRecords('groupmembership'),
};

export default withData(mapRecordsToProps)(
  connect(mapStateToProps)(DiscussionList) as any as any
) as any;
