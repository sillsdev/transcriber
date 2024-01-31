import {
  useState,
  useEffect,
  useRef,
  useMemo,
  CSSProperties,
  useContext,
} from 'react';
import { useGlobal } from 'reactn';
import {
  IconButton,
  Typography,
  Box,
  BoxProps,
  styled,
  TableCell,
} from '@mui/material';
import PlayIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import { Table } from '@devexpress/dx-react-grid-material-ui';
import useTodo from '../context/useTodo';
import ShapingTable from './ShapingTable';
import TaskHead from './TaskHead';
import TaskItem from './TaskItem';
import BigDialog from '../hoc/BigDialog';
import IntegrationTab from './Integration';
import ExportTab from './TranscriptionTab';
import Visualize from './Visualize';
import ProjectMenu from './Team/ProjectMenu';
import { formatTime, GrowingSpacer, LightTooltip, iconSize } from '../control';
import { ChipText } from './TaskFlag';
import {
  sectionNumber,
  sectionDescription,
  taskPassageNumber,
  useOrganizedBy,
  usePlan,
  useOfflineAvailToggle,
  useRole,
  paddedSectionNumber,
} from '../crud';
import { numCompare, prettySegmentStart } from '../utils';
import { useProjectPlans } from '../crud';
import { debounce } from 'lodash';
import MediaPlayer from './MediaPlayer';
import { IMediaActionsStrings } from '../model';
import { mediaActionsSelector } from '../selector';
import { shallowEqual, useSelector } from 'react-redux';
import { GridColumnExtension } from '@devexpress/dx-react-grid';
import usePassageDetailContext from '../context/usePassageDetailContext';
import { PassageDetailContext } from '../context/PassageDetailContext';

export const TaskItemWidth = 240;
export const TaskTableWidth = 265;

const TaskTableDiv = styled('div')(() => ({
  td: {
    padding: 0,
  },
  '&[data-list="true"] table': {
    minWidth: `${TaskItemWidth}px !important`,
  },
  '&[data-list="true"] thead': {
    display: 'none',
  },
  '& .MuiListItem-root': {
    padding: '0 16px',
  },
  '& .MuiListItem-root .item-desc': {
    width: `${TaskItemWidth - 80}px!important`,
    whiteSpace: 'normal',
    overflow: 'hidden',
  },
  '& .MuiList-root': {
    padding: 0,
  },
  '& colgroup col:first-of-type': {
    width: '1px !important',
  },
  '&[data-list="true"] colgroup col:nth-of-type(2)': {
    width: `${TaskItemWidth}px !important`,
  },
  '& tbody > tr:first-of-type': {
    display: 'none',
  },
}));

const StyledPaper = styled(Box)<BoxProps>(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignContent: 'center',
  [theme.breakpoints.up('sm')]: {
    paddingLeft: 0,
    paddingRight: 0,
  },
}));

// see: https://mui.com/material-ui/customization/how-to-customize/
export interface HeaderProps extends BoxProps {
  filter?: boolean;
}
export const Header = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'filter',
})<HeaderProps>(({ filter, theme }) => ({
  paddingLeft: theme.spacing(2),
  paddingTop: theme.spacing(1),
  paddingBottom: '8px',
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  ...(filter
    ? {
        width: 'auto',
      }
    : {
        width: `${TaskItemWidth - 30}px`,
      }),
}));

interface IRow {
  composite: JSX.Element | null;
  play: string;
  plan: string;
  section: number;
  sectPass: string;
  title: string;
  description: string;
  topic: string;
  speaker: string;
  length: string;
  state: string;
  assigned: string;
  mediaId: string;
  rowKey: string;
}

interface IProps {
  onFilter?: (top: boolean) => void;
  isDetail?: boolean;
}

export function TaskTable(props: IProps) {
  const { onFilter, isDetail } = props;
  const {
    rowData,
    activityStateStr,
    todoStr,
    projButtonStr,
    expandedGroups,
    filter,
    setFilter,
    flat,
  } = useTodo();
  const {
    playerMediafile,
    playing,
    setPlaying,
    loading,
    pdBusy,
    discussionSize,
  } = usePassageDetailContext();
  const { sectionArr } = useContext(PassageDetailContext).state;
  const filterRef = useRef(filter);
  const t = todoStr;
  const tpb = projButtonStr;
  const [user] = useGlobal('user');
  const tm: IMediaActionsStrings = useSelector(
    mediaActionsSelector,
    shallowEqual
  );
  const [width, setWidth] = useState(TaskTableWidth);
  const { getPlan, getPlanName } = usePlan();
  const offlineAvailableToggle = useOfflineAvailToggle();
  const [planId] = useGlobal('plan');
  const [planName, setPlanName] = useState('');
  const [projectId] = useGlobal('project');
  const projectPlans = useProjectPlans();
  const [openIntegration, setOpenIntegration] = useState(false);
  const [openExport, setOpenExport] = useState(false);
  const [openReports, setOpenReports] = useState(false);
  const { getOrganizedBy } = useOrganizedBy();
  const [organizedBy] = useState(getOrganizedBy(true));
  const isInline = useRef(false);
  const [columns] = useState([
    { name: 'composite', title: '\u00A0' },
    { name: 'play', title: '\u00A0' },
    { name: 'plan', title: t.project },
    { name: 'section', title: organizedBy },
    { name: 'title', title: t.title },
    { name: 'sectPass', title: t.passage },
    { name: 'description', title: t.description },
    { name: 'topic', title: t.topic },
    { name: 'speaker', title: t.speaker },
    { name: 'length', title: t.length },
    { name: 'state', title: t.state },
    { name: 'assigned', title: t.assigned },
  ]);
  const [columnFormatting, setColumnFormatting] = useState<
    GridColumnExtension[]
  >([
    { columnName: 'composite', width: TaskItemWidth, align: 'left' },
    { columnName: 'play', width: 65, align: 'left' },
    { columnName: 'plan', width: 100, align: 'left', wordWrapEnabled: true },
    { columnName: 'section', width: 65, align: 'right' },
    { columnName: 'title', width: 150, align: 'left', wordWrapEnabled: true },
    { columnName: 'sectPass', width: 65, align: 'left' },
    {
      columnName: 'description',
      width: 150,
      align: 'left',
      wordWrapEnabled: true,
    },
    { columnName: 'topic', width: 100, align: 'left' },
    { columnName: 'speaker', width: 100, align: 'left' },
    { columnName: 'length', width: 100, align: 'left' },
    { columnName: 'state', width: 150, align: 'left' },
    { columnName: 'assigned', width: 150, align: 'left' },
  ]);
  const columnSorting = [{ columnName: 'section', compare: numCompare }];
  const numCols = ['section', 'duration'];
  const sortingEnabled = [
    { columnName: 'composite', sortingEnabled: false },
    { columnName: 'play', sortingEnabled: false },
  ];
  const filteringEnabled = [
    { columnName: 'composite', filteringEnabled: false },
    { columnName: 'play', filteringEnabled: false },
  ];
  const defaultGrouping = [{ columnName: 'plan' }];

  const [rows, setRows] = useState(Array<IRow>());
  const extraHeight = 86;
  const [style, setStyle] = useState<CSSProperties>({
    height: discussionSize.height + extraHeight,
    overflowY: 'auto',
    cursor: 'default',
  });
  const [playItem, setPlayItem] = useState('');
  const formRef = useRef<any>();
  const selectedRef = useRef<any>();
  const notSelectedRef = useRef<any>();
  const busyRef = useRef(false);
  const { userIsAdmin } = useRole();
  const hiddenColumnNames = useMemo(() => (flat ? ['sectPass'] : []), [flat]);

  const handleToggleFilter = () => {
    handleStopPlayer();
    setPlayItem('');
    if (onFilter) onFilter(!filter);
    setFilter(!filter);
  };

  const setDimensions = () => {
    const newWidth = filterRef.current
      ? window.innerWidth - 40
      : TaskTableWidth;
    if (width !== newWidth) setWidth(newWidth);
    setStyle((style) => ({
      ...style,
      cursor: busyRef.current ? 'progress' : 'default',
      width: newWidth,
    }));
  };

  useEffect(() => {
    if (onFilter) onFilter(false);
    setDimensions();
    const handleResize = debounce(() => {
      setDimensions();
    }, 100);

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  useEffect(() => {
    filterRef.current = filter;
    setDimensions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handleStopPlayer = () => {
    if (playing) setPlaying(false);
  };

  const handleProjectMenu = (what: string) => {
    if (what === 'offlineAvail') {
      offlineAvailableToggle(projectId);
    } else if (what === 'integration') {
      setOpenIntegration(true);
    } else if (what === 'export') {
      setOpenExport(true);
    } else if (what === 'reports') {
      setOpenReports(true);
    } else if (what === 'filter') {
      handleToggleFilter();
    }
  };

  const handlePlay = (id: string) => () => {
    if (id !== playItem) {
      setPlayItem(id);
    } else {
      setPlaying(!playing);
    }
  };

  useEffect(() => {
    busyRef.current = pdBusy || loading;
    setStyle((style) => ({
      ...style,
      height: discussionSize.height + extraHeight,
      cursor: busyRef.current ? 'progress' : 'default',
    }));
  }, [pdBusy, loading, discussionSize]);

  useEffect(() => {
    if (formRef.current && selectedRef.current) {
      formRef.current.scrollTo(0, selectedRef.current.offsetTop);
    }
  });

  useEffect(() => {
    setPlanName(getPlanName(planId));
    const planRec = getPlan(planId);
    isInline.current = Boolean(planRec?.attributes?.flat);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId]);

  useEffect(() => {
    if (!filter) {
      setColumnFormatting([
        { columnName: 'composite', width: TaskItemWidth, align: 'left' },
        { columnName: 'play', width: 0, align: 'left' },
        { columnName: 'plan', width: 0, align: 'left' },
        { columnName: 'section', width: 0, align: 'right' },
        { columnName: 'title', width: 0, align: 'left' },
        { columnName: 'sectPass', width: 0, align: 'left' },
        {
          columnName: 'description',
          width: 0,
          align: 'left',
          wordWrapEnabled: true,
        },
        { columnName: 'length', width: 0, align: 'left' },
        { columnName: 'duration', width: 0, align: 'right' },
        { columnName: 'state', width: 0, align: 'left' },
        { columnName: 'assigned', width: 0, align: 'left' },
      ]);
    } else {
      let addHead = 50;
      let addWid = (width - 1237) / 3;
      if (width < 1283) {
        addHead = addWid = width > 1237 ? (width - 1237) / 7 : 0;
      }
      setColumnFormatting([
        { columnName: 'composite', width: 1, align: 'left' },
        { columnName: 'play', width: 65, align: 'left' },
        {
          columnName: 'plan',
          width: 100 + addWid,
          align: 'left',
          wordWrapEnabled: true,
        },
        { columnName: 'section', width: 65 + addHead, align: 'right' },
        {
          columnName: 'title',
          width: 150 + addWid,
          align: 'left',
          wordWrapEnabled: true,
        },
        { columnName: 'sectPass', width: 65 + addHead, align: 'left' },
        {
          columnName: 'description',
          width: 150 + addWid,
          align: 'left',
          wordWrapEnabled: true,
        },
        { columnName: 'topic', width: 65 + addHead, align: 'left' },
        { columnName: 'speaker', width: 65 + addHead, align: 'left' },
        { columnName: 'length', width: 100, align: 'left' },
        { columnName: 'duration', width: 100, align: 'right' },
        { columnName: 'state', width: 150, align: 'left' },
        { columnName: 'assigned', width: 150, align: 'left' },
      ]);
    }
  }, [filter, width]);

  useEffect(() => {
    const newRows = rowData.map((r, i) => ({
      composite:
        r.state === '' ? (
          <TaskHead item={i} />
        ) : (
          <TaskItem
            item={i}
            organizedBy={organizedBy}
            flat={isInline.current}
          />
        ),
      play: playItem,
      plan: r.planName,
      section: Number(sectionNumber(r.section)),
      sectPass: r.sectPass,
      title: sectionDescription(r.section),
      description: r.passage?.attributes?.title,
      topic: r.mediafile?.attributes?.topic || '',
      speaker: r.mediafile?.attributes?.performedBy || '',
      length: r.duration ? formatTime(r.duration) : '',
      state:
        r.state !== ''
          ? ChipText({ state: r.state, ta: activityStateStr })
          : '',
      assigned: r.assigned === user ? t.yes : t.no,
      mediaId: r.mediafile.id,
      rowKey:
        paddedSectionNumber(r.section) +
        (r.mediafile.id ? taskPassageNumber(r.passage) : '   ') +
        prettySegmentStart(r.mediafile?.attributes?.sourceSegments),
    }));
    setRows(newRows);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowData, playItem]);

  useEffect(() => {
    //if I set playing when I set the mediaId, it plays a bit of the old
    if (playItem) setPlaying(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playItem]);

  interface ICell {
    value: any;
    style?: CSSProperties;
    mediaId?: string;
    row: IRow;
    column: any;
    tableRow: any;
    tableColumn: any;
  }

  const PlayCell = ({ value, style, mediaId, ...restProps }: ICell) => (
    <Table.Cell {...restProps} style={{ ...style }} value>
      <IconButton
        id={`audio-${mediaId}`}
        key={'audio-' + mediaId}
        aria-label={'audio-' + mediaId}
        color="primary"
        onClick={handlePlay(mediaId || '')}
      >
        {value === mediaId && playing ? (
          <LightTooltip title={tm.pause}>
            <PauseIcon sx={iconSize} />
          </LightTooltip>
        ) : (
          <LightTooltip title={tm.play}>
            <PlayIcon sx={iconSize} />
          </LightTooltip>
        )}
      </IconButton>
    </Table.Cell>
  );

  const selBacking: CSSProperties = { background: 'lightgrey' };
  const noSelBacking: CSSProperties = { background: 'transparent' };

  const Cell = (props: ICell) => {
    const { row, column, value } = props;
    if (!filter) {
      if (column.name === 'composite') {
        let curId = '';
        if (typeof value?.props?.item === 'number')
          if (row.mediaId !== '')
            curId = rowData[value.props.item]?.mediafile.id;
        return (
          <TableCell
            ref={curId === playerMediafile?.id ? selectedRef : notSelectedRef}
            style={curId === playerMediafile?.id ? selBacking : noSelBacking}
          >
            {value}
          </TableCell>
        );
      }
      return <td>{'\u200B'}</td>; // Zero width space
    } else {
      if (column.name === 'composite') {
        return <td>{'\u00a0'}</td>;
      } else if (column.name === 'play') {
        // if there is no audio file to play put nothing in the play column
        return filter && row.mediaId ? (
          <PlayCell {...props} mediaId={row.mediaId || props.mediaId} />
        ) : (
          <Table.Cell {...props} value="" />
        );
      }
      return <Table.Cell {...props} />;
    }
  };
  const playEnded = () => {
    setPlaying(false);
  };
  return (
    <TaskTableDiv
      id="TaskTable"
      ref={formRef}
      style={style}
      data-list={!filter ? 'true' : ''}
    >
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <StyledPaper>
          <Header filter={filter}>
            <Typography variant="h6">{t.tasks}</Typography>
            <GrowingSpacer />
            <ProjectMenu
              action={handleProjectMenu}
              stopPlayer={handleStopPlayer}
              inProject={true}
              isAdmin={userIsAdmin}
              project={projectId}
              justFilter={isDetail}
            />
            {/** filter && (
              <IconButton id="taskFiltClose" onClick={handleToggleFilter}>
                <CloseIcon />
              </IconButton>
            ) **/}
          </Header>
          <ShapingTable
            columns={columns}
            columnFormatting={filter ? columnFormatting : []}
            dataCell={Cell}
            sorting={[
              { columnName: 'plan', direction: 'asc' },
              { columnName: 'rowKey', direction: 'asc' },
            ]}
            sortingEnabled={sortingEnabled}
            defaultGrouping={defaultGrouping}
            expandedGroups={expandedGroups}
            filteringEnabled={filteringEnabled}
            columnSorting={columnSorting}
            hiddenColumnNames={hiddenColumnNames}
            numCols={numCols}
            shaping={filter}
            rows={rows}
          />
        </StyledPaper>
      </Box>
      <MediaPlayer
        srcMediaId={playItem}
        requestPlay={playing}
        onEnded={playEnded}
      />
      <BigDialog
        title={tpb.integrationsTitle.replace('{0}', planName)}
        isOpen={openIntegration}
        onOpen={setOpenIntegration}
      >
        <IntegrationTab {...props} stopPlayer={handleStopPlayer} />
      </BigDialog>
      <BigDialog
        title={tpb.exportTitle.replace('{0}', planName)}
        isOpen={openExport}
        onOpen={setOpenExport}
      >
        <ExportTab
          {...props}
          projectPlans={projectPlans(projectId)}
          planColumn={true}
          sectionArr={sectionArr}
        />
      </BigDialog>
      <BigDialog
        title={tpb.reportsTitle.replace('{0}', planName)}
        isOpen={openReports}
        onOpen={setOpenReports}
      >
        <Visualize selectedPlan={planId} />
      </BigDialog>
    </TaskTableDiv>
  );
}

export default TaskTable;
