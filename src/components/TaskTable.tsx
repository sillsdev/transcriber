import React, { useState, useEffect, useRef } from 'react';
import { useGlobal } from 'reactn';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import { CSSProperties } from '@material-ui/core/styles/withStyles';
import { IconButton, Typography } from '@material-ui/core';
import PlayIcon from '@material-ui/icons/PlayArrow';
import StopIcon from '@material-ui/icons/Stop';
import { Table } from '@devexpress/dx-react-grid-material-ui';
import useTodo from '../context/useTodo';
import ShapingTable from './ShapingTable';
import TaskHead from './TaskHead';
import TaskItem from './TaskItem';
import { BigDialog } from '../hoc/BigDialog';
import IntegrationTab from './Integration';
import ExportTab from './TranscriptionTab';
import ImportTab from './ImportTab';
import ProjectMenu from './Team/ProjectMenu';
import { formatTime } from '../control';
import { ChipText } from './TaskFlag';
import Auth from '../auth/Auth';
import { sectionNumber, sectionDescription, useOrganizedBy } from '../crud';
import { numCompare } from '../utils';
import { useProjectPlans } from '../crud';
import { debounce } from 'lodash';
import MediaPlayer from './MediaPlayer';

export const TaskItemWidth = 370;

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
      '&[data-list="true"] table': {
        minWidth: '372px !important',
      },
      '&[data-list="true"] thead': {
        display: 'none',
      },
      '& .MuiListItem-root': {
        padding: '0 16px',
      },
      '& .MuiList-root': {
        padding: 0,
      },
      '& colgroup col:first-child': {
        width: '1px !important',
      },
      '&[data-list="true"] colgroup col:nth-child(2)': {
        width: '370px !important',
      },
      '& tbody > tr:first-child': {
        display: 'none',
      },
    },
    container: {
      display: 'flex',
      justifyContent: 'center',
    },
    paper: theme.mixins.gutters({
      display: 'flex',
      flexDirection: 'column',
      alignContent: 'center',
      [theme.breakpoints.up('sm')]: {
        paddingLeft: 0,
        paddingRight: 0,
      },
    }) as any,
    grow: {
      flexGrow: 1,
    },
    dialogHeader: theme.mixins.gutters({
      width: '340px',
      paddingTop: '8px',
      paddingBottom: '8px',
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
    }) as any,
    editIcon: {
      fontSize: 16,
    },
    link: {},
    button: {},
    icon: {},
    playIcon: {
      fontSize: 16,
    },
    list: {
      display: 'flex',
    },
  })
);

interface IRow {
  composite: JSX.Element | null;
  play: string;
  plan: string;
  section: number;
  sectPass: string;
  title: string;
  description: string;
  length: string;
  state: string;
  assigned: string;
  mediaRemoteId: string;
}

interface IProps {
  auth: Auth;
  onFilter?: (top: boolean) => void;
}

export function TaskTable(props: IProps) {
  const { auth, onFilter } = props;
  const {
    rowData,
    taskItemStr,
    todoStr,
    projButtonStr,
    selected,
    expandedGroups,
    filter,
    setFilter,
  } = useTodo();
  const t = todoStr;
  const tpb = projButtonStr;
  const classes = useStyles();
  const [user] = useGlobal('user');
  const [width, setWidth] = useState(window.innerWidth);
  const [planName, setPlanName] = useState('');
  const [projectId] = useGlobal('project');
  const [projRole] = useGlobal('projRole');
  const projectPlans = useProjectPlans();
  const [openIntegration, setOpenIntegration] = React.useState(false);
  const [openImport, setOpenImport] = useState(false);
  const [openExport, setOpenExport] = useState(false);
  const { getOrganizedBy } = useOrganizedBy();
  const [organizedBy] = useState(getOrganizedBy(true));
  const [columns] = useState([
    { name: 'composite', title: '\u00A0' },
    { name: 'play', title: '\u00A0' },
    { name: 'plan', title: t.project },
    { name: 'section', title: organizedBy },
    { name: 'title', title: t.title },
    { name: 'sectPass', title: t.passage },
    { name: 'description', title: t.description },
    { name: 'length', title: t.length },
    { name: 'state', title: t.state },
    { name: 'assigned', title: t.assigned },
  ]);
  const [columnFormatting, setColumnFormatting] = useState([
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
  const [style, setStyle] = React.useState<CSSProperties>({
    height: window.innerHeight - 100,
    overflowY: 'auto',
  });
  const [playItem, setPlayItem] = useState('');
  const formRef = useRef<any>();
  const selectedRef = useRef<any>();
  const notSelectedRef = useRef<any>();

  const handleProjectMenu = (what: string) => {
    if (what === 'integration') {
      setOpenIntegration(true);
    } else if (what === 'import') {
      setOpenImport(true);
    } else if (what === 'export') {
      setOpenExport(true);
    } else if (what === 'filter') {
      if (onFilter) onFilter(!filter);
      setFilter(!filter);
    }
  };

  const handlePlay = (id: string) => () => {
    if (id !== playItem) {
      setPlayItem(id);
    } else {
      setPlayItem('');
    }
  };

  const setDimensions = () => {
    setStyle({ height: window.innerHeight - 100, overflowY: 'auto' });
    setWidth(window.innerWidth);
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
    if (formRef.current && selectedRef.current) {
      formRef.current.scrollTo(0, selectedRef.current.offsetTop);
    }
  });

  useEffect(() => {
    if (!filter) {
      setColumnFormatting([
        { columnName: 'composite', width: TaskItemWidth, align: 'left' },
        { columnName: 'play', width: 1, align: 'left' },
        { columnName: 'plan', width: 1, align: 'left' },
        { columnName: 'section', width: 1, align: 'right' },
        { columnName: 'title', width: 1, align: 'left' },
        { columnName: 'sectPass', width: 1, align: 'left' },
        {
          columnName: 'description',
          width: 1,
          align: 'left',
          wordWrapEnabled: true,
        },
        { columnName: 'length', width: 1, align: 'left' },
        { columnName: 'duration', width: 1, align: 'right' },
        { columnName: 'state', width: 1, align: 'left' },
        { columnName: 'assigned', width: 1, align: 'left' },
      ]);
    } else {
      let addHead = 50;
      let addWid = (width - 1037) / 3;
      if (width < 1283) {
        addHead = addWid = width > 1037 ? (width - 1037) / 5 : 0;
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
          <TaskItem item={i} organizedBy={organizedBy} />
        ),
      play: r.playItem,
      plan: r.planName,
      section: Number(sectionNumber(r.section)),
      sectPass: r.sectPass,
      title: sectionDescription(r.section),
      description: r.passage?.attributes?.title,
      length: r.duration ? formatTime(r.duration) : '',
      state: r.state !== '' ? ChipText({ state: r.state, t: taskItemStr }) : '',
      assigned: r.assigned === user ? t.yes : t.no,
      mediaId: r.mediaId,
      mediaRemoteId: r.mediaRemoteId,
    }));
    setRows(newRows);
    const newPlanName = newRows.length > 0 ? newRows[0].plan : '';
    if (planName !== newPlanName) setPlanName(newPlanName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowData]);

  interface ICell {
    value: any;
    style?: React.CSSProperties;
    mediaId?: string;
    row: IRow;
    column: any;
    tableRow: any;
    tableColumn: any;
  }

  const PlayCell = ({ value, style, mediaId, ...restProps }: ICell) => (
    <Table.Cell {...restProps} style={{ ...style }} value>
      <IconButton
        key={'audio-' + mediaId}
        aria-label={'audio-' + mediaId}
        color="primary"
        className={classes.link}
        onClick={handlePlay(mediaId ? mediaId : '')}
      >
        {value === mediaId ? (
          <StopIcon className={classes.playIcon} />
        ) : (
          <PlayIcon className={classes.playIcon} />
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
        const curId =
          typeof value?.props?.item === 'number' && row.length !== ''
            ? rowData[value.props.item]?.passage?.id
            : '';
        return (
          <td
            ref={curId === selected ? selectedRef : notSelectedRef}
            style={curId === selected ? selBacking : noSelBacking}
          >
            {value}
          </td>
        );
      }
      return <td>{'\u00a0'}</td>;
    } else {
      if (column.name === 'composite') {
        return <td>{'\u00a0'}</td>;
      } else if (column.name === 'play' && row.length !== '') {
        return <PlayCell {...props} mediaId={row.mediaRemoteId} />;
      }
      return <Table.Cell {...props} />;
    }
  };

  return (
    <div
      id="TaskTable"
      ref={formRef}
      className={classes.root}
      style={style}
      data-list={!filter ? 'true' : ''}
    >
      <div className={classes.container}>
        <div className={classes.paper}>
          <div className={classes.dialogHeader}>
            <Typography variant="h6">{t.tasks}</Typography>
            <div className={classes.grow}>{'\u00A0'}</div>
            <ProjectMenu
              action={handleProjectMenu}
              inProject={true}
              isOwner={projRole === 'admin'}
            />
          </div>
          <ShapingTable
            columns={columns}
            columnFormatting={filter ? columnFormatting : []}
            dataCell={Cell}
            sorting={[
              { columnName: 'plan', direction: 'asc' },
              { columnName: 'sectPass', direction: 'asc' },
            ]}
            sortingEnabled={sortingEnabled}
            defaultGrouping={defaultGrouping}
            expandedGroups={expandedGroups}
            filteringEnabled={filteringEnabled}
            columnSorting={columnSorting}
            numCols={numCols}
            shaping={filter}
            rows={rows}
          />
        </div>
      </div>
      <MediaPlayer auth={auth} srcMediaId={playItem} />
      <BigDialog
        title={tpb.integrationsTitle.replace('{0}', planName)}
        isOpen={openIntegration}
        onOpen={setOpenIntegration}
      >
        <IntegrationTab {...props} auth={auth} />
      </BigDialog>
      <BigDialog
        title={tpb.exportTitle.replace('{0}', planName)}
        isOpen={openExport}
        onOpen={setOpenExport}
      >
        <ExportTab
          {...props}
          auth={auth}
          projectPlans={projectPlans(projectId)}
          planColumn={true}
        />
      </BigDialog>

      {openImport && (
        <ImportTab
          {...props}
          auth={auth}
          isOpen={openImport}
          onOpen={setOpenImport}
          planName={planName}
          project={projectId}
        />
      )}
    </div>
  );
}

export default TaskTable;
