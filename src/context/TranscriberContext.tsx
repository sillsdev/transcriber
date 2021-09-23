import React, { useState, useEffect, useRef } from 'react';
// see: https://upmostly.com/tutorials/how-to-use-the-usecontext-hook-in-react
import { useGlobal } from 'reactn';
import { useParams } from 'react-router-dom';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as actions from '../store';
import {
  IState,
  GroupMembership,
  Passage,
  Plan,
  PlanType,
  Project,
  Role,
  Section,
  MediaFile,
  ITaskItemStrings,
  IToDoTableStrings,
  ITranscriberStrings,
  IProjButtonsStrings,
  BookName,
  ActivityStates,
  RoleNames,
  ISharedStrings,
  IActivityStateStrings,
} from '../model';
import localStrings from '../selector/localize';
import { withData } from '../mods/react-orbitjs';
import { QueryBuilder } from '@orbit/data';
import {
  related,
  remoteId,
  sectionNumber,
  passageNumber,
  remoteIdGuid,
} from '../crud';
import StickyRedirect from '../components/StickyRedirect';
import { loadBlob } from '../utils';
import Auth from '../auth/Auth';
import { useSnackBar } from '../hoc/SnackBar';

export const getPlanName = (plan: Plan) => {
  return plan.attributes ? plan.attributes.name : '';
};

interface IStateProps {
  todoStr: IToDoTableStrings;
  taskItemStr: ITaskItemStrings;
  activityStateStr: IActivityStateStrings;
  transcriberStr: ITranscriberStrings;
  projButtonStr: IProjButtonsStrings;
  sharedStr: ISharedStrings;
  allBookData: BookName[];
  booksLoaded: boolean;
  lang: string;
  hasUrl: boolean;
  mediaUrl: string;
  trackedTask: string;
}
const mapStateToProps = (state: IState): IStateProps => ({
  todoStr: localStrings(state, { layout: 'toDoTable' }),
  taskItemStr: localStrings(state, { layout: 'taskItem' }),
  activityStateStr: localStrings(state, { layout: 'activityState' }),
  transcriberStr: localStrings(state, { layout: 'transcriber' }),
  projButtonStr: localStrings(state, { layout: 'projButtons' }),
  sharedStr: localStrings(state, { layout: 'shared' }),
  allBookData: state.books.bookData,
  booksLoaded: state.books.loaded,
  lang: state.strings.lang,
  hasUrl: state.media.loaded,
  mediaUrl: state.media.url,
  trackedTask: state.media.trackedTask,
});

interface IDispatchProps {
  fetchBooks: typeof actions.fetchBooks;
  fetchMediaUrl: typeof actions.fetchMediaUrl;
  setTrackedTask: typeof actions.setTrackedTask;
}
const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
  ...bindActionCreators(
    {
      fetchBooks: actions.fetchBooks,
      fetchMediaUrl: actions.fetchMediaUrl,
      setTrackedTask: actions.setTrackedTask,
    },
    dispatch
  ),
});

interface IRecordProps {
  groupMemberships: GroupMembership[];
  passages: Passage[];
  plans: Plan[];
  planTypes: PlanType[];
  projects: Project[];
  roles: Role[];
  sections: Section[];
  mediafiles: MediaFile[];
}
const mapRecordsToProps = {
  groupMemberships: (q: QueryBuilder) => q.findRecords('groupmembership'),
  passages: (q: QueryBuilder) => q.findRecords('passage'),
  plans: (q: QueryBuilder) => q.findRecords('plan'),
  planTypes: (q: QueryBuilder) => q.findRecords('plantype'),
  projects: (q: QueryBuilder) => q.findRecords('project'),
  roles: (q: QueryBuilder) => q.findRecords('role'),
  sections: (q: QueryBuilder) => q.findRecords('section'),
  mediafiles: (q: QueryBuilder) => q.findRecords('mediafile'),
};

export interface IRowData {
  planName: string;
  planType: string;
  section: Section;
  passage: Passage;
  state: string;
  sectPass: string;
  mediaRemoteId: string;
  mediaId: string;
  playItem: string;
  duration: number;
  role: string;
  assigned: string;
  transcriber: string;
  editor: string;
}

const initState = {
  index: 0,
  selected: '',
  setSelected: (selected: string) => {},
  playing: false,
  setPlaying: (playing: boolean) => {},
  rowData: Array<IRowData>(),
  expandedGroups: Array<string>(),
  playItem: '',
  allDone: false,
  setAllDone: (val: boolean) => {},
  refresh: () => {},
  allBookData: Array<BookName>(),
  taskItemStr: {} as ITaskItemStrings,
  activityStateStr: {} as IActivityStateStrings,
  sharedStr: {} as ISharedStrings,
  todoStr: {} as IToDoTableStrings,
  transcriberStr: {} as ITranscriberStrings,
  projButtonStr: {} as IProjButtonsStrings,
  hasUrl: false,
  loading: true,
  mediaUrl: '',
  audioBlob: undefined as Blob | undefined,
  fetchMediaUrl: actions.fetchMediaUrl,
};

export type ICtxState = typeof initState;

interface IContext {
  state: ICtxState;
  setState: React.Dispatch<React.SetStateAction<ICtxState>>;
}

const TranscriberContext = React.createContext({} as IContext);

interface IProps extends IStateProps, IDispatchProps, IRecordProps {
  children: React.ReactElement;
  auth: Auth;
}
interface ParamTypes {
  prjId: string;
  pasId: string;
}
const TranscriberProvider = withData(mapRecordsToProps)(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )((props: IProps) => {
    const { passages, mediafiles, sections, plans, planTypes } = props;
    const { projects, groupMemberships, roles } = props;
    const { lang, allBookData, fetchBooks, booksLoaded } = props;
    const {
      todoStr,
      taskItemStr,
      activityStateStr,
      transcriberStr,
      projButtonStr,
      sharedStr,
    } = props;
    const { hasUrl, mediaUrl, fetchMediaUrl } = props;
    const { trackedTask, setTrackedTask } = props;
    const { prjId, pasId } = useParams<ParamTypes>();
    const [memory] = useGlobal('memory');
    const [user] = useGlobal('user');
    const [project] = useGlobal('project');
    const [devPlan] = useGlobal('plan');
    const [projRole] = useGlobal('projRole');
    const view = React.useRef('');
    const [refreshed, setRefreshed] = useState(0);
    const mediaUrlRef = useRef('');
    const { showMessage } = useSnackBar();
    const [state, setState] = useState({
      ...initState,
      selected: '',
      allBookData,
      todoStr,
      taskItemStr,
      activityStateStr,
      transcriberStr,
      projButtonStr,
      sharedStr,
      hasUrl,
      mediaUrl,
      fetchMediaUrl,
    });

    const setRows = (rowData: IRowData[]) => {
      setState((state: ICtxState) => {
        return { ...state, rowData, playing: false };
      });
    };

    const setExpandedGroups = (expandedGroups: string[]) => {
      setState((state: ICtxState) => {
        return { ...state, expandedGroups };
      });
    };

    const setPlaying = (playing: boolean) => {
      setState((state: ICtxState) => {
        return { ...state, playing };
      });
    };

    const setAllDone = (val: boolean) => {
      setState((state: ICtxState) => {
        return { ...state, allDone: val };
      });
    };

    const setSelected = (
      selected: string,
      rowData: IRowData[] = state.rowData
    ) => {
      const rowLen = rowData.length;
      for (let i = 0; i < rowLen; i++) {
        const r = rowData[i];
        if (r.passage?.id === selected && r.mediaRemoteId !== '') {
          if (state.index !== i || trackedTask !== selected) {
            const remId =
              remoteId('passage', selected, memory.keyMap) || selected;
            if (pasId !== remId) {
              view.current = `/work/${prjId}/${remId}`;
            }
            setTrackedTask(selected);
            fetchMediaUrl(r.mediaRemoteId, memory, props.auth);
            setState((state: ICtxState) => {
              return {
                ...state,
                index: i,
                selected,
                playing: false,
                playItem: r.mediaId,
                loading: true,
              };
            });
          }
          break;
        }
      }
    };

    const refresh = () => {
      setRefreshed((refreshed) => {
        return refreshed + 1;
      });
    };

    let curSec = '';

    const addTasks = (
      state: string,
      role: string,
      rowList: IRowData[],
      onlyAvailable: boolean,
      playItem: string
    ) => {
      const readyRecs = passages
        .filter(
          (p) =>
            (p.attributes && p.attributes.state === state) || role === 'view'
        ) //just group the passages within a section together right now
        .sort((a, b) =>
          related(a, 'section') < related(b, 'section') ? -1 : 1
        );

      let addRows = Array<IRowData>();
      readyRecs.forEach((p) => {
        const mediaRecs = mediafiles
          .filter((m) => related(m, 'passage') === p.id)
          .sort((i: MediaFile, j: MediaFile) =>
            // Sort descending
            i.attributes.versionNumber < j.attributes.versionNumber ? 1 : -1
          );
        if (mediaRecs.length > 0) {
          const mediaRec = mediaRecs[0];
          const secId = related(p, 'section');
          const secRecs = sections.filter((sr) => sr.id === secId);
          if (secRecs.length > 0) {
            const planId = related(secRecs[0], 'plan');
            if (planId === devPlan) {
              const planRecs = plans.filter((pl) => pl.id === planId);
              if (planRecs.length > 0) {
                if (related(planRecs[0], 'project') === project) {
                  const assigned = related(secRecs[0], role);
                  const allowed = onlyAvailable
                    ? assigned === user || !assigned || assigned === ''
                    : role === 'view';
                  if (allowed) {
                    let already: IRowData[] = [];
                    if (role === 'view') {
                      already = rowList.filter(
                        (r) => r.mediaId === mediaRec.id
                      );
                    }
                    if (role !== 'view' || already.length === 0) {
                      const curState: ActivityStates | string =
                        role === 'view'
                          ? p.attributes && p.attributes.state
                            ? p.attributes.state
                            : state
                          : state;
                      const planName = getPlanName(planRecs[0]);
                      const planTypeRecs = planTypes.filter(
                        (pt) => pt.id === related(planRecs[0], 'plantype')
                      );
                      const planType =
                        planTypeRecs.length > 0
                          ? planTypeRecs[0].attributes.name
                          : '';
                      const secNum = sectionNumber(secRecs[0]);
                      const nextSecId = secRecs[0].id;
                      const transcriber = related(secRecs[0], 'transcriber');
                      const editor = related(secRecs[0], 'editor');
                      if (
                        nextSecId !== curSec &&
                        rowList.findIndex(
                          (r) => r.sectPass === secNum + '.'
                        ) === -1
                      ) {
                        curSec = nextSecId;
                        addRows.push({
                          planName,
                          planType,
                          section: { ...secRecs[0] },
                          passage: { ...p },
                          state: '',
                          sectPass: secNum + '.',
                          mediaRemoteId: '',
                          mediaId: mediaRec.id,
                          playItem: '',
                          duration: 0,
                          role,
                          assigned,
                          transcriber,
                          editor,
                        });
                      }
                      addRows.push({
                        planName,
                        planType,
                        section: { ...secRecs[0] },
                        passage: { ...p },
                        state: curState,
                        sectPass: secNum + '.' + passageNumber(p).trim(),
                        mediaRemoteId:
                          remoteId('mediafile', mediaRec.id, memory.keyMap) ||
                          mediaRec.id,
                        mediaId: mediaRec.id,
                        playItem,
                        duration: mediaRec.attributes.duration,
                        role,
                        assigned,
                        transcriber,
                        editor,
                      });
                    }
                  }
                }
              }
            }
          }
        }
      });
      addRows
        .sort((i, j) =>
          i.planName < j.planName
            ? -1
            : i.planName > j.planName
            ? 1
            : i.sectPass < j.sectPass
            ? -1
            : 1
        )
        .forEach((r) => rowList.push(r));
    };

    const getUserRole = (user: string, project: string) => {
      const projectRecs = projects.filter((p) => p.id === project);
      if (projectRecs.length === 0) {
        return '';
      }
      const groupId = related(projectRecs[0], 'group');
      const memberships = groupMemberships.filter(
        (gm) => related(gm, 'group') === groupId && related(gm, 'user') === user
      );
      if (memberships.length === 0) {
        return '';
      }
      const memberRole: string = related(memberships[0], 'role');
      const roleRecs = roles.filter((r) => r.id === memberRole);
      return roleRecs.length > 0 && roleRecs[0].attributes
        ? roleRecs[0].attributes.roleName
        : '';
    };

    const role = React.useMemo(() => {
      return getUserRole(user, project);
      /* eslint-disable-next-line react-hooks/exhaustive-deps */
    }, [user, project, projects.length, groupMemberships.length, roles.length]);

    const selectTasks = (
      onlyAvailable: boolean,
      rowList: IRowData[],
      item: string
    ) => {
      // IN PROGRESS TASKS
      if (role !== RoleNames.Transcriber) {
        // editor or admin
        addTasks(
          ActivityStates.Reviewing,
          'editor',
          rowList,
          onlyAvailable,
          item
        );
      }

      addTasks(
        ActivityStates.Transcribing,
        'transcriber',
        rowList,
        onlyAvailable,
        item
      );

      // IN PROGRESS BUT ERROR REPORTED
      addTasks(
        ActivityStates.Incomplete,
        'transcriber',
        rowList,
        onlyAvailable,
        item
      );

      addTasks(
        ActivityStates.NeedsNewTranscription,
        'transcriber',
        rowList,
        onlyAvailable,
        item
      );

      // READY TO BEGIN TASKS
      if (role !== RoleNames.Transcriber) {
        // editor or admin
        addTasks(
          ActivityStates.Transcribed,
          'editor',
          rowList,
          onlyAvailable,
          item
        );
      }

      addTasks(
        ActivityStates.TranscribeReady,
        'transcriber',
        rowList,
        onlyAvailable,
        item
      );
      if (state.selected !== '' && state.index < rowList.length) {
        if (rowList[state.index].passage.id !== state.selected) {
          setSelected(state.selected);
        }
      }
    };

    useEffect(() => {
      const playItem = state.playItem;
      const rowList: IRowData[] = [];
      if (role !== '') {
        selectTasks(true, rowList, playItem); // assigned
        selectTasks(false, rowList, playItem); // unassigned
        if (rowList.length === 0) {
          setAllDone(true);
        }
        // ALL OTHERS
        addTasks('', 'view', rowList, false, playItem);
      }
      setRows(rowList.map((r) => r));
      const exGrp: string[] = [];
      rowList.forEach((r) => {
        if (!exGrp.includes(r.planName)) exGrp.push(r.planName);
      });
      setExpandedGroups(exGrp);

      if (rowList.length > 0) {
        let selected = remoteIdGuid('passage', pasId, memory.keyMap) || pasId;
        selected =
          state.selected !== '' ? state.selected : selected || trackedTask;
        if (selected !== '') {
          const selectedRow = rowList.filter((r) => r.passage.id === selected);
          if (selectedRow.length > 0) {
            setSelected(selected, rowList);
          } else {
            selected = '';
          }
        }
        if (selected === '') {
          setSelected(rowList[0].passage.id, rowList);
        }
      }

      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [role, project, trackedTask, sections, refreshed]);

    const actor: { [key: string]: string } = {
      [ActivityStates.TranscribeReady]: 'transcriber',
      [ActivityStates.Reviewing]: 'editor',
      [ActivityStates.Transcribing]: 'transcriber',
      [ActivityStates.Transcribed]: 'editor',
      [ActivityStates.Incomplete]: 'transcriber',
      [ActivityStates.NeedsNewTranscription]: 'transcriber',
      '': 'view',
    };

    useEffect(() => {
      let changed = false;
      const rowData: IRowData[] = [];
      state.rowData.forEach((r) => {
        const secRecs = sections.filter((s) => s.id === r.section.id);
        if (secRecs.length > 0) {
          const section = { ...secRecs[0] };
          const transcriber = related(section, 'transcriber');
          if (transcriber !== r.transcriber) changed = true;
          const editor = related(section, 'editor');
          if (editor !== r.editor) changed = true;
          const state = r.passage.attributes.state || '';
          let role = actor[state] || 'view';
          if (projRole === 'transcriber' && role === 'editor') role = 'view';
          const assigned = related(section, role);
          rowData.push({ ...r, section, role, assigned, transcriber, editor });
        }
      });
      if (changed) setState({ ...state, rowData });
      /* eslint-disable-next-line react-hooks/exhaustive-deps */
    }, [sections]);

    const noNewSelection: string[] = [
      ActivityStates.TranscribeReady,
      ActivityStates.Transcribing,
      ActivityStates.Reviewing,
    ];

    useEffect(() => {
      let changed = false;
      let selected = state.selected;
      const rowData: IRowData[] = [];
      state.rowData.forEach((r) => {
        const passRecs = passages.filter((p) => p.id === r.passage.id);
        if (passRecs.length > 0) {
          const passage = { ...passRecs[0] };
          let role = r.role;
          const newState = passage?.attributes?.state;
          if (newState !== r.passage?.attributes?.state) {
            changed = true;
            if (noNewSelection.indexOf(newState) === -1) selected = '';
            role = actor[newState] || 'view';
          }
          rowData.push({ ...r, passage, role });
        }
      });
      if (changed) {
        setState({ ...state, rowData, selected, playing: false });
        if (!state.playing) setTrackedTask('');
      }
      /* eslint-disable-next-line react-hooks/exhaustive-deps */
    }, [passages]);

    useEffect(() => {
      if (mediaUrl) {
        mediaUrlRef.current = mediaUrl;
        try {
          loadBlob(mediaUrl, (url, b) => {
            if (!b) {
              setSelected(state.selected);
              return;
            }
            //not sure what this intermediary file is, but causes console errors
            if (b.type !== 'text/html') {
              //console.log('got the blob', url.substr(70, 50));
              if (url === mediaUrlRef.current)
                setState((state: ICtxState) => {
                  return {
                    ...state,
                    loading: false,
                    audioBlob: b,
                    playing: false,
                  };
                });
              else console.log('not sending blob...newer request pending');
            }
          });
        } catch (e: any) {
          console.log(e);
          showMessage(e.message);
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mediaUrl]);

    useEffect(() => {
      if (!booksLoaded) {
        fetchBooks(lang);
      } else {
        setState((state: ICtxState) => {
          return { ...state, allBookData };
        });
      }
      /* eslint-disable-next-line react-hooks/exhaustive-deps */
    }, [lang, booksLoaded, allBookData]);

    if (view.current !== '') {
      const target = view.current;
      view.current = '';
      return <StickyRedirect to={target} />;
    }

    return (
      <TranscriberContext.Provider
        value={{
          state: {
            ...state,
            hasUrl,
            mediaUrl,
            setSelected,
            setPlaying,
            setAllDone,
            refresh,
          },
          setState,
        }}
      >
        {props.children}
      </TranscriberContext.Provider>
    );
  })
);

export { TranscriberContext, TranscriberProvider };
