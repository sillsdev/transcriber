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
import {
  PassageDescription,
  PassageDescriptionCompare,
} from './passageDescription';
import {
  SectionDescription,
  SectionDescriptionCompare,
} from './sectionDescription';
import SnackBar from './SnackBar';
import Duration from './Duration';
import Auth from '../auth/Auth';
import { related, hasRelated, remoteId } from '../utils';

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
    }),
    grow: {
      flexGrow: 1,
    },
    dialogHeader: theme.mixins.gutters({
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
  })
);

interface IRow {
  desc: MediaDescription;
  play: string;
  plan: string;
  section: JSX.Element | null;
  passage: JSX.Element | null;
  length: JSX.Element;
  state: string;
  action: string;
  assigned: string;
}

interface IStateProps {
  activityState: IActivityStateStrings;
  t: IToDoTableStrings;
  hasUrl: boolean;
  mediaUrl: string;
}

interface IDispatchProps {
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
}

export function ToDoTable(props: IProps) {
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
    transcriber,
    fetchMediaUrl,
    hasUrl,
    mediaUrl,
  } = props;
  const classes = useStyles();
  const [memory] = useGlobal('memory');
  const [keyMap] = useGlobal('keyMap');
  const [user] = useGlobal('user');
  const [project] = useGlobal('project');
  const [columns] = useState([
    { name: 'play', title: '\u00A0' },
    { name: 'plan', title: t.plan },
    { name: 'section', title: t.section },
    { name: 'passage', title: t.passage },
    { name: 'length', title: t.length },
    { name: 'state', title: t.state },
    { name: 'action', title: t.action },
    { name: 'assigned', title: t.assigned },
  ]);
  const [columnWidth] = useState([
    { columnName: 'play', width: 65 },
    { columnName: 'plan', width: 100 },
    { columnName: 'section', width: 200 },
    { columnName: 'passage', width: 150 },
    { columnName: 'length', width: 100 },
    { columnName: 'state', width: 150 },
    { columnName: 'action', width: 150 },
    { columnName: 'assigned', width: 150 },
  ]);
  const [role, setRole] = useState('');

  const [rows, setRows] = useState(Array<IRow>());
  const [filter, setFilter] = useState(false);
  const [message, setMessage] = useState(<></>);
  const [playing, setPlaying] = useState(false);
  const [playItem, setPlayItem] = useState('');
  const audioRef = useRef<any>();

  const handleMessageReset = () => {
    setMessage(<></>);
  };
  const handleFilter = () => setFilter(!filter);
  const next: { [key: string]: string } = {
    transcribeReady: 'transcribing',
    transcribed: 'reviewing',
  };
  const handleSelect = (mediaDescription: MediaDescription) => (e: any) => {
    memory.update((t: TransformBuilder) =>
      t.replaceAttribute(
        { type: 'passage', id: mediaDescription.passage.id },
        'state',
        next[mediaDescription.state]
      )
    );
    transcriber(mediaDescription);
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
      p => p.attributes && p.attributes.state === state
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
                if (!assignee || assignee === '' || assignee === user) {
                  const mediaDescription: MediaDescription = {
                    section: secRecs[0],
                    passage: p,
                    mediaRemoteId: remoteId('mediafile', mediaRec.id, keyMap),
                    mediaId: mediaRec.id,
                    duration: mediaRec.attributes.duration,
                    state,
                    role,
                  };
                  rowList.push({
                    desc: mediaDescription,
                    play: playItem,
                    plan: getPlanName(planRecs[0]),
                    section: <SectionDescription section={secRecs[0]} />,
                    passage: <PassageDescription passage={p} />,
                    length: <Duration seconds={mediaRec.attributes.duration} />,
                    state: activityState.getString(state),
                    action: t.getString(role),
                    assigned: assignee === user ? t.yes : t.no,
                  });
                }
              }
            }
          }
        }
      }
    });
  };

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
      if (role !== 'Transcriber') {
        addTasks('reviewing', 'reviewer', rowList, playItem);
      }
      addTasks('transcribing', 'transcriber', rowList, playItem);
      if (role !== 'Transcriber') {
        addTasks('transcribed', 'reviewer', rowList, playItem);
      }
      addTasks('transcribeReady', 'transcriber', rowList, playItem);
    }
    setRows(rowList);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, playItem]);

  useEffect(() => {
    if (hasUrl && audioRef.current && !playing && playItem !== '') {
      setPlaying(true);
      audioRef.current.play();
    }
  }, [hasUrl, mediaUrl, playing, playItem]);

  interface ICell {
    value: string;
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
        onClick={handleSelect(restProps.row.desc)}
      >
        {value}
      </Button>
    </Table.Cell>
  );

  const Cell = (props: ICell) => {
    const { row, column } = props;
    if (column.name === 'play') {
      return <PlayCell {...props} mediaId={row.desc.mediaRemoteId} />;
    }
    if (column.name === 'action') {
      return <LinkCell {...props} />;
    }
    return <Table.Cell {...props} />;
  };

  return (
    <div className={classes.root}>
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
            columnWidths={columnWidth}
            dataCell={Cell}
            sorting={[
              { columnName: 'plan', direction: 'asc' },
              { columnName: 'section', direction: 'asc' },
              { columnName: 'passage', direction: 'asc' },
            ]}
            columnSorting={[
              { columnName: 'section', compare: SectionDescriptionCompare },
              { columnName: 'passage', compare: PassageDescriptionCompare },
            ]}
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
});
const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
  ...bindActionCreators(
    {
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

export default withData(mapRecordsToProps)(connect(
  mapStateToProps,
  mapDispatchToProps
)(ToDoTable) as any) as any;
