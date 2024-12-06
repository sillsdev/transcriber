import {
  Box,
  Grid,
  IconButton,
  Paper,
  PaperProps,
  styled,
  SxProps,
  Typography,
  TypographyProps,
  useTheme,
} from '@mui/material';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import { PassageDetailContext } from '../../context/PassageDetailContext';
import {
  getMediaInPlans,
  orgDefaultDiscussionFilter,
  related,
  useRole,
  VernacularTag,
} from '../../crud';
import {
  Discussion,
  DiscussionD,
  IDiscussionListStrings,
  MediaFileD,
  Group,
  User,
  GroupMembership,
} from '../../model';
import AddIcon from '@mui/icons-material/Add';
import HideIcon from '@mui/icons-material/ArrowDropUp';
import ShowIcon from '@mui/icons-material/ArrowDropDown';
import DiscussionCard, { DiscussionRegion } from './DiscussionCard';
import BigDialog from '../../hoc/BigDialog';
import CategoryList, { CatData } from './CategoryList';
import { useGlobal } from 'reactn';
import { useDiscussionOrg, useOrgDefaults } from '../../crud';
import FilterMenu, { IFilterState, Resolved } from './FilterMenu';
import Confirm from '../AlertDialog';
import { onlyUnique, prettySegment, waitForIt } from '../../utils';
import { UnsavedContext } from '../../context/UnsavedContext';
import SortMenu, { ISortState } from './SortMenu';
import { discussionListSelector } from '../../selector';
import { useOrbitData } from '../../hoc/useOrbitData';

const StyledPaper = styled(Paper)<PaperProps>(({ theme }) => ({
  backgroundColor: theme.palette.secondary.light,
  marginBottom: theme.spacing(1),
  '& .MuiPaper-rounded': {
    borderRadius: '8px',
  },
  overflow: 'auto',
}));

const Title = styled(Typography)<TypographyProps>(() => ({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
}));

const actionButtonProps = { color: 'primary.light' } as SxProps;

export const NewDiscussionToolId = 'newDiscussion';
export const NewCommentToolId = NewDiscussionToolId + 'comment';

export function DiscussionList() {
  const discussions = useOrbitData<DiscussionD[]>('discussion');
  const mediafiles = useOrbitData<MediaFileD[]>('mediafile');
  const users = useOrbitData<User[]>('user');
  const groups = useOrbitData<Group[]>('group');
  const groupMemberships = useOrbitData<GroupMembership[]>('groupmembership');
  const theme = useTheme();
  const [planId] = useGlobal('plan');
  const [userId] = useGlobal('user');
  const [organization] = useGlobal('organization');
  const [isOffline] = useGlobal('offline');
  const [displayDiscussions, setDisplayDiscussions] = useState<DiscussionD[]>(
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
    playerMediafile,
    setDiscussionMarkers,
  } = ctx.state;
  const discussionSizeRef = useRef(discussionSize);
  const { toolsChanged, isChanged, startSave, startClear, clearCompleted } =
    useContext(UnsavedContext).state;
  const t: IDiscussionListStrings = useSelector(
    discussionListSelector,
    shallowEqual
  );
  const mediafileId = useMemo(() => {
    return playerMediafile?.id ?? '';
  }, [playerMediafile]);

  const [rootWidthStyle, setRootWidthStyle] = useState({
    width: `${discussionSizeRef.current?.width - 64}px`, //leave room for scroll bar
    maxHeight: `${discussionSizeRef.current?.height}px`,
  });
  const { userIsAdmin } = useRole();
  const defaultFilterState: IFilterState = {
    forYou: false,
    resolved: Resolved.No,
    latestVersion: false,
    allPassages: false,
    allSteps: false,
  };
  const [canSetTeamDefault, setCanSetTeamDefault] = useState(
    userIsAdmin && !isOffline
  );
  const [teamDefault, setTeamDefault] = useState(false);
  const [filterState, setFilterStatex] =
    useState<IFilterState>(defaultFilterState);
  const [orgFilterState, setOrgFilterState] = useState(defaultFilterState);
  const { forYou, resolved, latestVersion, allPassages, allSteps } =
    filterState;
  const [sortState, setSortState] = useState<ISortState>({
    topic: true,
    assignedTo: false,
    lastUpdated: false,
  });
  const [catFilter, setCatFilter] = useState<CatData[]>([]);
  const [catSelect, setCatSelect] = useState<string[]>([]);
  const [confirmAction, setConfirmAction] = useState<string>('');
  const discussionOrg = useDiscussionOrg();
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
  const { getOrgDefault, setOrgDefault } = useOrgDefaults();

  const projGroups = useMemo(() => {
    const mygroups = groupMemberships.filter(
      (gm) => related(gm, 'user') === userId
    );
    return mygroups.map((g) => related(g, 'group'));
  }, [groupMemberships, userId]);

  useEffect(() => {
    discussionSizeRef.current = discussionSize;
    setRootWidthStyle({
      width: `${discussionSizeRef.current?.width - 64}px`, // space for scroll bar
      maxHeight: `${discussionSizeRef.current?.height}px`,
    });
  }, [discussionSize]);

  useEffect(
    () => setCanSetTeamDefault(userIsAdmin && !isOffline),
    [userIsAdmin, isOffline]
  );

  useEffect(() => {
    if (teamDefault && filterState !== orgFilterState) {
      setOrgFilterState(filterState);
      setOrgDefault(orgDefaultDiscussionFilter, filterState);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamDefault, filterState]);

  useEffect(() => {
    var def = getOrgDefault(orgDefaultDiscussionFilter);
    if (def) {
      setFilterStatex(def);
      setOrgFilterState(def);
      setTeamDefault(true);
    } else setFilterStatex(defaultFilterState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization]);

  const setFilterState = (filter: IFilterState) => {
    setFilterStatex(filter);
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
  const resetDiscussionList = () => {
    if (adding) {
      const whole = prettySegment({
        start: 0,
        end: playerMediafile?.attributes?.duration || 0,
      });
      const lastDot = whole.lastIndexOf('.');
      const topic =
        currentSegment.slice(0, lastDot) !== whole.slice(0, lastDot)
          ? currentSegment ?? ''
          : '';
      setDisplayDiscussions([
        {
          type: 'discussion',
          attributes: {
            subject: topic,
          },
        } as DiscussionD,
      ]);
    } else {
      setDisplayDiscussions(
        discussions
          .filter(
            (d) =>
              (!forYou ||
                related(d, 'user') === userId ||
                projGroups?.includes(related(d, 'group'))) &&
              (resolved === Resolved.Both ||
                (resolved === Resolved.Yes) ===
                  Boolean(d.attributes?.resolved)) &&
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
  };
  useEffect(() => {
    if (currentstep !== '' && (!isChanged(NewCommentToolId) || !adding)) {
      resetDiscussionList();
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

  const nextState = (what: string) => {
    const cur = filterState[what];
    if (what === 'resolved') {
      return cur === Resolved.No
        ? Resolved.Yes
        : cur === Resolved.Yes
        ? Resolved.Both
        : Resolved.No;
    } else {
      return !cur;
    }
  };

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
      setFilterState({ ...filterState, [what]: nextState(what) });
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
      doTheThing();
    });
  };

  const handleSaveFirstConfirmed = () => {
    var myIds = displayDiscussions.map((d) => d.id);
    if (adding) myIds.push(NewDiscussionToolId);
    myIds.forEach((id) => startSave(id));
    waitSaveOrClear();
  };

  const handleSaveFirstRefused = () => {
    var myIds = displayDiscussions.map((d) => d.id);
    if (adding) myIds.push(NewDiscussionToolId);
    myIds.forEach((id) => startClear(id));
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
    clearCompleted(NewDiscussionToolId);
    clearCompleted(NewCommentToolId);
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
        setFilterState({ ...filterState, [what]: nextState(what) });
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
    return rowData.length === 0 || !mediafileId;
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
    <StyledPaper id="DiscussionListHeader">
      <>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1 }}>
          <div>
            <Title variant="h6">{t.title}</Title>
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
              teamDefault={teamDefault}
              setTeamDefault={canSetTeamDefault ? setTeamDefault : undefined}
            />
            <IconButton
              id="addDiscussion"
              sx={actionButtonProps}
              title={t.add}
              onClick={handleAddDiscussion}
              disabled={adding || isMediaMissing()}
            >
              <AddIcon />
            </IconButton>
            <IconButton
              id="collapseDiscussion"
              sx={actionButtonProps}
              title={t.collapse}
              onClick={handleToggleCollapse}
            >
              {collapsed ? <ShowIcon /> : <HideIcon />}
            </IconButton>
          </div>
        </Box>
        <StyledPaper ref={formRef} id="DiscussionList" style={rootWidthStyle}>
          <Grid container>
            {displayDiscussions.map((i, j) => (
              <DiscussionCard
                id={`card-${j}`}
                key={j}
                discussion={i}
                collapsed={collapsed}
                onAddComplete={adding ? handleAddComplete : undefined}
                showStep={allSteps}
                showReference={allPassages}
                setRef={setHighlightedRef}
                requestHighlight={highlightNew}
                refreshList={resetDiscussionList}
              />
            ))}
          </Grid>
        </StyledPaper>
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
      </>
    </StyledPaper>
  );
}

export default DiscussionList;
