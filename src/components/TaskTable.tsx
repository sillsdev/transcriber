import React, { useState, useEffect, useRef } from 'react';
import { useGlobal } from 'reactn';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import { CSSProperties } from '@material-ui/core/styles/withStyles';
import { Button, IconButton } from '@material-ui/core';
import PlayIcon from '@material-ui/icons/PlayArrow';
import StopIcon from '@material-ui/icons/Stop';
import FilterIcon from '@material-ui/icons/FilterList';
import SelectAllIcon from '@material-ui/icons/SelectAll';
import { Table } from '@devexpress/dx-react-grid-material-ui';
import useTodo from '../context/useTodo';
import ShapingTable from './ShapingTable';
import TaskHead from './TaskHead';
import TaskItem from './TaskItem';
import SnackBar from './SnackBar';
import { formatTime } from './Duration';
import { ChipText } from './TaskFlag';
import Auth from '../auth/Auth';
import { sectionNumber, numCompare, sectionDescription } from '../utils';
import { debounce } from 'lodash';
import './TaskTable.css';

export const TaskItemWidth = 370;

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
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
      width: '370px',
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
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
    fetchMediaUrl,
    hasUrl,
    mediaUrl,
    selected,
    expandedGroups,
    filter,
    setFilter,
  } = useTodo();
  const t = todoStr;
  const classes = useStyles();
  const [memory] = useGlobal('memory');
  const [offline] = useGlobal('offline');
  const [user] = useGlobal('user');
  const [columns] = useState([
    { name: 'composite', title: '\u00A0' },
    { name: 'play', title: '\u00A0' },
    { name: 'plan', title: t.plan },
    { name: 'section', title: t.section },
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
  const [message, setMessage] = useState(<></>);
  const [playing, setPlaying] = useState(false);
  const [playItem, setPlayItem] = useState('');
  const audioRef = useRef<any>();
  const formRef = useRef<any>();
  const selectedRef = useRef<any>();
  const notSelectedRef = useRef<any>();

  const handleMessageReset = () => {
    setMessage(<></>);
  };
  const handleFilter = () => {
    if (onFilter) onFilter(!filter);
    setFilter(!filter);
  };

  const handlePlay = (id: string) => () => {
    if (playing) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
    setPlaying(false);
    if (id !== playItem) {
      fetchMediaUrl(id, memory, offline, auth);
      setPlayItem(id);
    } else {
      setPlayItem('');
    }
  };

  const setDimensions = () => {
    setStyle({ height: window.innerHeight - 100, overflowY: 'auto' });
  };

  useEffect(() => {
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
      setColumnFormatting([
        { columnName: 'composite', width: 1, align: 'left' },
        { columnName: 'play', width: 65, align: 'left' },
        {
          columnName: 'plan',
          width: 100,
          align: 'left',
          wordWrapEnabled: true,
        },
        { columnName: 'section', width: 65, align: 'right' },
        {
          columnName: 'title',
          width: 150,
          align: 'left',
          wordWrapEnabled: true,
        },
        { columnName: 'sectPass', width: 65, align: 'left' },
        {
          columnName: 'description',
          width: 150,
          align: 'left',
          wordWrapEnabled: true,
        },
        { columnName: 'length', width: 100, align: 'left' },
        { columnName: 'duration', width: 100, align: 'right' },
        { columnName: 'state', width: 150, align: 'left' },
        { columnName: 'assigned', width: 150, align: 'left' },
      ]);
    }
  }, [filter]);

  useEffect(() => {
    const newRows = rowData.map((r, i) => ({
      composite: r.state === '' ? <TaskHead item={i} /> : <TaskItem item={i} />,
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

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowData, selected]);

  useEffect(() => {
    if (hasUrl && audioRef.current && !playing && playItem !== '') {
      setPlaying(true);
      audioRef.current.play();
    }
  }, [hasUrl, mediaUrl, playing, playItem]);

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
            <div className={classes.grow}>{'\u00A0'}</div>
            <Button
              key="filter"
              aria-label={t.filter}
              variant="outlined"
              color="primary"
              className={classes.button}
              onClick={handleFilter}
              title={t.showHide}
            >
              {t.filter}
              {filter ? (
                <SelectAllIcon className={classes.icon} />
              ) : (
                <FilterIcon className={classes.icon} />
              )}
            </Button>
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
      {!hasUrl || <audio ref={audioRef} src={mediaUrl} />}
      <SnackBar {...props} message={message} reset={handleMessageReset} />
    </div>
  );
}

export default TaskTable;
