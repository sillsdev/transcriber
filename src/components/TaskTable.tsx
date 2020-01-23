import React, { useState, useEffect, useRef } from 'react';
import { useGlobal } from 'reactn';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as actions from '../store';
import {
  IState,
  GroupMembership,
  Passage,
  PassageSection,
  Plan,
  Project,
  Role,
  Section,
  MediaFile,
  MediaDescription,
  IActivityStateStrings,
  IToDoTableStrings,
  ActivityStates,
  RoleNames,
} from '../model';
import localStrings from '../selector/localize';
import { withData } from 'react-orbitjs';
import { QueryBuilder, TransformBuilder } from '@orbit/data';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import { Button, IconButton } from '@material-ui/core';
import PlayIcon from '@material-ui/icons/PlayArrow';
import StopIcon from '@material-ui/icons/Stop';
import FilterIcon from '@material-ui/icons/FilterList';
import SelectAllIcon from '@material-ui/icons/SelectAll';
import { Table } from '@devexpress/dx-react-grid-material-ui';
import ShapingTable from './ShapingTable';
import TaskItem from './TaskItem';
import SnackBar from './SnackBar';
import { formatTime } from './Duration';
import Auth from '../auth/Auth';
import {
  related,
  hasRelated,
  remoteId,
  sectionNumber,
  passageNumber,
  numCompare,
} from '../utils';
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
    }),
    grow: {
      flexGrow: 1,
    },
    dialogHeader: theme.mixins.gutters({
      width: '370px',
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
    }),
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
  duration: number;
  state: string;
  action: string;
  assigned: string;
}

interface IStateProps {
  activityState: IActivityStateStrings;
  t: IToDoTableStrings;
  lang: string;
  hasUrl: boolean;
  mediaUrl: string;
  tableLoad: string[];
}

interface IDispatchProps {
  fetchBooks: typeof actions.fetchBooks;
  fetchMediaUrl: typeof actions.fetchMediaUrl;
}

interface IRecordProps {
  groupMemberships: GroupMembership[];
  passageSections: Array<PassageSection>;
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
    activityState,
    groupMemberships,
    passageSections,
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
    tableLoad,
    filtering,
    onFilter,
    curDesc,
  } = props;
  const classes = useStyles();
  const [busy] = useGlobal('remoteBusy');
  const [memory] = useGlobal('memory');
  const [keyMap] = useGlobal('keyMap');
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
    { name: 'duration', title: t.duration },
    { name: 'state', title: t.state },
    { name: 'action', title: t.action },
    { name: 'assigned', title: t.assigned },
  ]);
  const [columnFormatting, setColumnFormatting] = useState([
    { columnName: 'composite', width: TaskItemWidth, align: 'left' },
    { columnName: 'play', width: 65, align: 'left' },
    { columnName: 'plan', width: 100, align: 'left' },
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
    { columnName: 'duration', width: 100, align: 'right' },
    { columnName: 'state', width: 150, align: 'left' },
    { columnName: 'action', width: 150, align: 'left' },
    { columnName: 'assigned', width: 150, align: 'left' },
  ]);
  const columnSorting = [
    { columnName: 'section', compare: numCompare },
    { columnName: 'duration', compare: numCompare },
  ];
  const numCols = ['section', 'duration'];
  const sortingEnabled = [
    { columnName: 'composite', sortingEnabled: false },
    { columnName: 'play', sortingEnabled: false },
    { columnName: 'action', sortingEnabled: false },
  ];
  const filteringEnabled = [
    { columnName: 'composite', filteringEnabled: false },
    { columnName: 'play', filteringEnabled: false },
    { columnName: 'action', filteringEnabled: false },
  ];
  const [role, setRole] = useState('');

  const [rows, setRows] = useState(Array<IRow>());
  const [filter, setFilter] = useState(
    filtering === undefined ? false : filtering
  );
  const [height, setHeight] = React.useState(window.innerHeight);
  const [message, setMessage] = useState(<></>);
  const [playing, setPlaying] = useState(false);
  const [playItem, setPlayItem] = useState('');
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState('');
  const audioRef = useRef<any>();

  const handleMessageReset = () => {
    setMessage(<></>);
  };
  const handleFilter = () => {
    if (onFilter) onFilter(!filter);
    setFilter(!filter);
  };
  const next: { [key: string]: string } = {
    needsNewTranscription: ActivityStates.Transcribing,
    transcribeReady: ActivityStates.Transcribing,
    transcribed: ActivityStates.Reviewing,
  };
  const processSelect = (mediaDescription: MediaDescription) => {
    setSelected(mediaDescription.passage.id);
    if (mediaDescription.role !== 'view') {
      const assignee = related(mediaDescription.section, mediaDescription.role);
      if (!assignee) {
        memory.update((t: TransformBuilder) =>
          t.replaceRelatedRecord(
            mediaDescription.section,
            mediaDescription.role,
            { type: 'user', id: user }
          )
        );
      }
      memory.update((t: TransformBuilder) =>
        t.replaceAttribute(
          { type: 'passage', id: mediaDescription.passage.id },
          'state',
          next[mediaDescription.state]
        )
      );
    }
    transcriber(mediaDescription);
  };
  const handleSelect = (mediaDescription: MediaDescription) => (e: any) => {
    processSelect(mediaDescription);
  };
  const getPlanName = (plan: Plan) => {
    return plan.attributes ? plan.attributes.name : '';
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
      fetchMediaUrl(id, auth);
      setPlayItem(id);
    } else {
      setPlayItem('');
    }
  };
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
      const passSecRecs = passageSections.filter(
        s => hasRelated(p, 'sections', s.id).length !== 0
      );
      const mediaRecs = mediafiles
        .filter(m => related(m, 'passage') === p.id)
        .sort((i: MediaFile, j: MediaFile) =>
          // Sort descending
          i.attributes.versionNumber < j.attributes.versionNumber ? 1 : -1
        );
      if (mediaRecs.length > 0) {
        const mediaRec = mediaRecs[0];
        if (passSecRecs.length > 0) {
          const secId = related(passSecRecs[0], 'section');
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
                    const curState =
                      role === 'view'
                        ? p.attributes && p.attributes.state
                          ? p.attributes.state
                          : state
                        : state;
                    const mediaDescription: MediaDescription = {
                      section: secRecs[0],
                      passage: p,
                      mediaRemoteId: remoteId('mediafile', mediaRec.id, keyMap),
                      mediaId: mediaRec.id,
                      duration: mediaRec.attributes.duration,
                      state: curState,
                      role,
                    };
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
                      plan: getPlanName(planRecs[0]),
                      section: Number(sectionNumber(secRecs[0])),
                      sectPass:
                        sectionNumber(secRecs[0]) +
                        '.' +
                        passageNumber(p).trim(),
                      title: secRecs[0].attributes.name,
                      description: p.attributes.title,
                      length: formatTime(mediaRec.attributes.duration),
                      duration: mediaRec.attributes.duration,
                      state: activityState.getString(curState),
                      action: t.getString(role),
                      assigned: assignee === user ? t.yes : t.no,
                    });
                  }
                }
              }
            }
          }
        }
      }
    });
  };

  const setDimensions = () => {
    setHeight(window.innerHeight);
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
        { columnName: 'title', width: 1, align: 'left', wordWrapEnabled: true },
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
        { columnName: 'action', width: 1, align: 'left' },
        { columnName: 'assigned', width: 1, align: 'left' },
      ]);
    } else {
      setColumnFormatting([
        { columnName: 'composite', width: 1, align: 'left' },
        { columnName: 'play', width: 65, align: 'left' },
        { columnName: 'plan', width: 100, align: 'left' },
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
        { columnName: 'action', width: 150, align: 'left' },
        { columnName: 'assigned', width: 150, align: 'left' },
      ]);
    }
  }, [filter]);

  useEffect(() => {
    const projectRecs = projects.filter(p => p.id === project);
    if (projectRecs.length === 0) {
      setRole('');
      return;
    }
    const groupId = related(projectRecs[0], 'group');
    const memberships = groupMemberships.filter(
      gm => related(gm, 'group') === groupId && related(gm, 'user') === user
    );
    if (memberships.length === 0) {
      setRole('');
      return;
    }
    const memberRole: string = related(memberships[0], 'role');
    const roleRecs = roles.filter(r => r.id === memberRole);
    setRole(
      roleRecs.length > 0 && roleRecs[0].attributes
        ? roleRecs[0].attributes.roleName
        : ''
    );
  }, [user, project, projects, groupMemberships, roles]);

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
      addTasks(
        ActivityStates.NeedsNewTranscription,
        'transcriber',
        rowList,
        playItem
      );
      addTasks('', 'view', rowList, playItem);
    }
    setRows(rowList);
    if (rowList.length > 0 && selected === '') {
      console.log('Select first task');
      processSelect(rowList[0].media);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, playItem, curDesc, project, busy]);

  useEffect(() => {
    if (hasUrl && audioRef.current && !playing && playItem !== '') {
      setPlaying(true);
      audioRef.current.play();
    }
  }, [hasUrl, mediaUrl, playing, playItem]);

  useEffect(() => {
    if (
      tableLoad.length > 0 &&
      (!tableLoad.includes('mediafile') ||
        !tableLoad.includes('passage') ||
        !tableLoad.includes('section') ||
        !tableLoad.includes('passagesection') ||
        !tableLoad.includes('role')) &&
      !loading
    ) {
      setMessage(<span>{t.loadingTable}</span>);
      setLoading(true);
    } else if (loading) {
      setMessage(<></>);
      setLoading(false);
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [tableLoad]);

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

  const LinkCell = ({ value, style, ...restProps }: ICell) => (
    <Table.Cell {...restProps} style={{ ...style }} value>
      <Button
        key={value}
        aria-label={value}
        variant="contained"
        color="primary"
        className={classes.link}
        onClick={handleSelect(restProps.row.media)}
      >
        {value}
      </Button>
    </Table.Cell>
  );

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
          <div
            style={{
              width: TaskItemWidth,
              backgroundColor: curId === selected ? 'lightgray' : 'transparent',
            }}
          >
            {value}
          </div>
        );
      }
      return <>{'\u00a0'}</>;
    } else {
      if (column.name === 'composite') {
        return <>{'\u00a0'}</>;
      } else if (column.name === 'play') {
        return <PlayCell {...props} mediaId={row.media.mediaRemoteId} />;
      }
      if (column.name === 'action') {
        return <LinkCell {...props} />;
      }
      return <Table.Cell {...props} />;
    }
  };

  return (
    <div
      id="TaskTable"
      className={classes.root}
      style={{ height: height - 100, overflowY: 'auto' }}
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
              title={'Show/Hide filter rows'}
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
  activityState: localStrings(state, { layout: 'activityState' }),
  hasUrl: state.media.loaded,
  mediaUrl: state.media.url,
  tableLoad: state.orbit.tableLoad,
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
  passageSections: (q: QueryBuilder) => q.findRecords('passagesection'),
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
