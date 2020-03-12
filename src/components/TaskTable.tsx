import React, { useState, useEffect, useRef } from 'react';
import { useGlobal } from 'reactn';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as actions from '../store';
import {
  IState,
  GroupMembership,
  Passage,
  Plan,
  Project,
  Role,
  Section,
  MediaFile,
  MediaDescription,
  ITaskItemStrings,
  IToDoTableStrings,
  ActivityStates,
  RoleNames,
} from '../model';
import localStrings from '../selector/localize';
import { withData } from '../mods/react-orbitjs';
import { QueryBuilder } from '@orbit/data';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import { Button, IconButton } from '@material-ui/core';
import PlayIcon from '@material-ui/icons/PlayArrow';
import StopIcon from '@material-ui/icons/Stop';
import FilterIcon from '@material-ui/icons/FilterList';
import SelectAllIcon from '@material-ui/icons/SelectAll';
import { Table } from '@devexpress/dx-react-grid-material-ui';
import ShapingTable from './ShapingTable';
import TaskHead from './TaskHead';
import TaskItem from './TaskItem';
import SnackBar from './SnackBar';
import { formatTime } from './Duration';
import { ChipText } from './TaskFlag';
import Auth from '../auth/Auth';
import {
  related,
  remoteId,
  sectionNumber,
  passageNumber,
  numCompare,
} from '../utils';
import { debounce } from 'lodash';
import './TaskTable.css';
import { CSSProperties } from '@material-ui/core/styles/withStyles';

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
  media: MediaDescription;
  play: string;
  plan: string;
  section: number;
  sectPass: string;
  title: string;
  description: string;
  length: string;
  state: string;
  assigned: string;
}

export const getPlanName = (plan: Plan) => {
  return plan.attributes ? plan.attributes.name : '';
};

interface IStateProps {
  taskItemStrings: ITaskItemStrings;
  t: IToDoTableStrings;
  lang: string;
  hasUrl: boolean;
  mediaUrl: string;
}

interface IDispatchProps {
  fetchBooks: typeof actions.fetchBooks;
  fetchMediaUrl: typeof actions.fetchMediaUrl;
}

interface IRecordProps {
  groupMemberships: GroupMembership[];
  passages: Array<Passage>;
  plans: Array<Plan>;
  projects: Project[];
  roles: Array<Role>;
  sections: Array<Section>;
  mediafiles: Array<MediaFile>;
}

interface IProps extends IStateProps, IDispatchProps, IRecordProps {
  auth: Auth;
  transcriber: (mediaDescription: MediaDescription) => void;
  filtering?: boolean;
  onFilter?: (top: boolean) => void;
  curDesc?: MediaDescription;
}

export function TaskTable(props: IProps) {
  const {
    auth,
    taskItemStrings,
    groupMemberships,
    passages,
    plans,
    projects,
    roles,
    sections,
    mediafiles,
    t,
    lang,
    transcriber,
    fetchBooks,
    fetchMediaUrl,
    hasUrl,
    mediaUrl,
    filtering,
    onFilter,
    curDesc,
  } = props;
  const classes = useStyles();
  const [busy] = useGlobal('remoteBusy');
  const [memory] = useGlobal('memory');
  const [keyMap] = useGlobal('keyMap');
  const [offline] = useGlobal('offline');
  const [user] = useGlobal('user');
  const [project] = useGlobal('project');
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
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
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
  const [filter, setFilter] = useState(
    filtering === undefined ? false : filtering
  );
  const [style, setStyle] = React.useState<CSSProperties>({
    height: window.innerHeight - 100,
    overflowY: 'auto',
  });
  const [message, setMessage] = useState(<></>);
  const [playing, setPlaying] = useState(false);
  const [playItem, setPlayItem] = useState('');
  const [selected, setSelected] = useState('');
  const [selRole, setSelRole] = useState('');
  const audioRef = useRef<any>();

  const handleMessageReset = () => {
    setMessage(<></>);
  };
  const handleFilter = () => {
    if (onFilter) onFilter(!filter);
    setFilter(!filter);
  };

  const processSelect = (mediaDescription: MediaDescription) => {
    setSelected(mediaDescription.passage.id);
    setSelRole(mediaDescription.role);
    transcriber(mediaDescription);
  };
  const handleSelect = (mediaDescription: MediaDescription) => (e: any) => {
    processSelect(mediaDescription);
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

  let curSec = '';

  const addTasks = (
    state: string,
    role: string,
    rowList: IRow[],
    playItem: string
  ) => {
    const readyRecs = passages.filter(
      p => (p.attributes && p.attributes.state === state) || role === 'view'
    );
    readyRecs.forEach(p => {
      const mediaRecs = mediafiles
        .filter(m => related(m, 'passage') === p.id)
        .sort((i: MediaFile, j: MediaFile) =>
          // Sort descending
          i.attributes.versionNumber < j.attributes.versionNumber ? 1 : -1
        );
      if (mediaRecs.length > 0) {
        const mediaRec = mediaRecs[0];
        const secId = related(p, 'section');
        const secRecs = sections.filter(sr => sr.id === secId);
        if (secRecs.length > 0) {
          const planId = related(secRecs[0], 'plan');
          const planRecs = plans.filter(pl => pl.id === planId);
          if (planRecs.length > 0) {
            if (related(planRecs[0], 'project') === project) {
              const assignee = related(secRecs[0], role);
              if (
                !assignee ||
                assignee === '' ||
                assignee === user ||
                role === 'view'
              ) {
                let already: IRow[] = [];
                if (role === 'view') {
                  already = rowList.filter(
                    r => r.media.mediaId === mediaRec.id
                  );
                }
                if (role !== 'view' || already.length === 0) {
                  const curState: ActivityStates | string =
                    role === 'view'
                      ? p.attributes && p.attributes.state
                        ? p.attributes.state
                        : state
                      : state;
                  const mediaDescription: MediaDescription = {
                    plan: planRecs[0],
                    section: secRecs[0],
                    passage: p,
                    mediaRemoteId: remoteId('mediafile', mediaRec.id, keyMap),
                    mediaId: mediaRec.id,
                    duration: mediaRec.attributes.duration,
                    state: curState,
                    role,
                  };
                  const planName = getPlanName(planRecs[0]);
                  const secNum = sectionNumber(secRecs[0]);
                  const secTitle = secRecs[0].attributes.name;
                  const nextSecId = secRecs[0].id;
                  if (nextSecId !== curSec && passageNumber(p).trim() === '1') {
                    curSec = nextSecId;
                    rowList.push({
                      composite: <TaskHead mediaDesc={mediaDescription} />,
                      media: mediaDescription,
                      play: '',
                      plan: planName,
                      section: Number(secNum),
                      sectPass: sectionNumber(secRecs[0]) + '.',
                      title: secTitle,
                      description: '',
                      length: '',
                      state: '',
                      assigned: assignee === user ? t.yes : t.no,
                    });
                  }
                  rowList.push({
                    composite: (
                      <TaskItem
                        mediaDesc={mediaDescription}
                        mediaRec={mediaRec}
                        select={handleSelect}
                      />
                    ),
                    media: mediaDescription,
                    play: playItem,
                    plan: planName,
                    section: Number(secNum),
                    sectPass: secNum + '.' + passageNumber(p).trim(),
                    title: secTitle,
                    description: p.attributes.title,
                    length: formatTime(mediaRec.attributes.duration),
                    state: ChipText({ state: curState, t: taskItemStrings }),
                    assigned: '',
                  });
                }
              }
            }
          }
        }
      }
    });
  };

  const setDimensions = () => {
    setStyle({ height: window.innerHeight - 100, overflowY: 'auto' });
  };

  React.useEffect(() => {
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

  React.useEffect(() => {
    fetchBooks(lang);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [lang]);

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

  const getUserRole = (user: string, project: string) => {
    const projectRecs = projects.filter(p => p.id === project);
    if (projectRecs.length === 0) {
      return '';
    }
    const groupId = related(projectRecs[0], 'group');
    const memberships = groupMemberships.filter(
      gm => related(gm, 'group') === groupId && related(gm, 'user') === user
    );
    if (memberships.length === 0) {
      return '';
    }
    const memberRole: string = related(memberships[0], 'role');
    const roleRecs = roles.filter(r => r.id === memberRole);
    return roleRecs.length > 0 && roleRecs[0].attributes
      ? roleRecs[0].attributes.roleName
      : '';
  };
  const role = React.useMemo(() => {
    return getUserRole(user, project);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [user, project, projects.length, groupMemberships.length, roles.length]);

  useEffect(() => {
    const rowList: IRow[] = [];
    if (role !== '') {
      if (role !== RoleNames.Transcriber) {
        addTasks(ActivityStates.Reviewing, 'reviewer', rowList, playItem);
      }
      addTasks(ActivityStates.Transcribing, 'transcriber', rowList, playItem);
      if (role !== RoleNames.Transcriber) {
        addTasks(ActivityStates.Transcribed, 'reviewer', rowList, playItem);
      }
      addTasks(
        ActivityStates.TranscribeReady,
        'transcriber',
        rowList,
        playItem
      );
      addTasks(ActivityStates.Incomplete, 'transcriber', rowList, playItem);
      addTasks(
        ActivityStates.NeedsNewTranscription,
        'transcriber',
        rowList,
        playItem
      );
      addTasks('', 'view', rowList, playItem);
    }
    setRows(rowList);
    const exGrp: string[] = [];
    rowList.forEach(r => {
      if (!exGrp.includes(r.plan)) exGrp.push(r.plan);
    });
    setExpandedGroups(exGrp);

    if (selected === '') {
      console.log('Select first task');
      if (rowList.length > 0) processSelect(rowList[0].media);
    } else {
      const selectedRow = rowList.filter(r => r.media.passage.id === selected);
      if (selectedRow.length === 0) {
        processSelect(rowList[0].media);
      } else if (selectedRow[0].media.role !== selRole) {
        processSelect(selectedRow[0].media);
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, playItem, curDesc, project, busy]);

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
      const curId =
        value &&
        value.props &&
        value.props.mediaDesc &&
        value.props.mediaDesc.passage &&
        value.props.mediaDesc.passage.id
          ? value.props.mediaDesc.passage.id
          : '';
      if (column.name === 'composite') {
        return (
          <td
            style={
              curId === selected && row.length !== ''
                ? selBacking
                : noSelBacking
            }
          >
            {value}
          </td>
        );
      }
      return <>{'\u00a0'}</>;
    } else {
      if (column.name === 'composite') {
        return <>{'\u00a0'}</>;
      } else if (column.name === 'play' && row.length !== '') {
        return <PlayCell {...props} mediaId={row.media.mediaRemoteId} />;
      }
      return <Table.Cell {...props} />;
    }
  };

  return (
    <div
      id="TaskTable"
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

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'toDoTable' }),
  taskItemStrings: localStrings(state, { layout: 'taskItem' }),
  hasUrl: state.media.loaded,
  mediaUrl: state.media.url,
  lang: state.strings.lang,
});
const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
  ...bindActionCreators(
    {
      fetchBooks: actions.fetchBooks,
      fetchMediaUrl: actions.fetchMediaUrl,
    },
    dispatch
  ),
});

const mapRecordsToProps = {
  groupMemberships: (q: QueryBuilder) => q.findRecords('groupmembership'),
  passages: (q: QueryBuilder) => q.findRecords('passage'),
  plans: (q: QueryBuilder) => q.findRecords('plan'),
  projects: (q: QueryBuilder) => q.findRecords('project'),
  roles: (q: QueryBuilder) => q.findRecords('role'),
  sections: (q: QueryBuilder) => q.findRecords('section'),
  mediafiles: (q: QueryBuilder) => q.findRecords('mediafile'),
};

export default withData(mapRecordsToProps)(
  connect(mapStateToProps, mapDispatchToProps)(TaskTable) as any
) as any;
