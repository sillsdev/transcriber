import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  useFetchMediaUrl,
  MediaSt,
  usePlan,
  useRole,
  useArtifactType,
  getMediaInPlans,
} from '../crud';
import StickyRedirect from '../components/StickyRedirect';
import { loadBlob, logError, Severity } from '../utils';
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
});

interface IDispatchProps {
  fetchBooks: typeof actions.fetchBooks;
}
const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
  ...bindActionCreators(
    {
      fetchBooks: actions.fetchBooks,
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
  loading: false,
  mediaUrl: '',
  audioBlob: undefined as Blob | undefined,
  trBusy: false,
  setTrBusy: (trBusy: boolean) => {},
  flat: false,
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
  slug?: string;
  medId?: string;
}
const TranscriberProvider = withData(mapRecordsToProps)(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )((props: IProps) => {
    const [reporter] = useGlobal('errorReporter');
    const { passages, mediafiles, sections, plans, planTypes } = props;
    const { lang, allBookData, fetchBooks, booksLoaded } = props;
    const {
      todoStr,
      taskItemStr,
      activityStateStr,
      transcriberStr,
      projButtonStr,
      sharedStr,
    } = props;
    const { prjId, pasId, slug, medId } = useParams<ParamTypes>();
    const [memory] = useGlobal('memory');
    const [user] = useGlobal('user');
    const [project] = useGlobal('project');
    const [devPlan] = useGlobal('plan');
    const { getPlan } = usePlan();
    const [projRole] = useGlobal('projRole');
    const [errorReporter] = useGlobal('errorReporter');
    const view = React.useRef('');
    const [refreshed, setRefreshed] = useState(0);
    const mediaUrlRef = useRef('');
    const { showMessage } = useSnackBar();
    const [trackedTask, setTrackedTask] = useGlobal('trackedTask');
    const { userCanTranscribe, userCanBeEditor } = useRole();
    const [planMedia, setPlanMedia] = useState<MediaFile[]>([]);
    const [state, setState] = useState({
      ...initState,
      allBookData,
      todoStr,
      taskItemStr,
      activityStateStr,
      transcriberStr,
      projButtonStr,
      sharedStr,
    });
    const { fetchMediaUrl, mediaState } = useFetchMediaUrl(reporter);
    const { vernacularId, getTypeId } = useArtifactType();
    const fetching = useRef('');

    const artifactId = useMemo(
      () => (slug ? getTypeId(slug) : vernacularId),
      [slug, vernacularId, getTypeId]
    );

    useEffect(() => {
      if (devPlan && mediafiles.length > 0) {
        setPlanMedia(getMediaInPlans([devPlan], mediafiles, artifactId, true));
      }
    }, [mediafiles, devPlan, artifactId]);

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

    const setTrBusy = (busy: boolean) => {
      setState((state: ICtxState) => {
        return {
          ...state,
          trBusy: busy,
        };
      });
    };
    const setSelected = (
      selected: string,
      rowData: IRowData[] = state.rowData
    ) => {
      const i = rowData.findIndex((r) => r.passage.id === selected);
      if (i < 0) return;
      const r = rowData[i];
      if (state.index !== i || state.selected !== selected) {
        const remId = remoteId('passage', selected, memory.keyMap) || selected;
        if (pasId !== remId) {
          view.current = `/work/${prjId}/${remId}`;
          if (slug) view.current += `/${slug}/${medId}`;
        }
        setTrackedTask(selected);
        var resetBlob = false;
        if (
          mediaState.urlMediaId !== r.mediaId &&
          fetching.current !== r.mediaId
        ) {
          fetching.current = r.mediaId;
          fetchMediaUrl({
            id: r.mediaId,
            auth: props.auth,
          });
          resetBlob = true;
        }
        setState((state: ICtxState) => {
          return {
            ...state,
            audioBlob: resetBlob ? undefined : state.audioBlob,
            index: i,
            selected,
            playing: false,
            playItem: r.mediaId,
            loading: fetching.current !== '',
          };
        });
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
        .filter((p) => p.attributes?.state === state || role === 'view') //just group the passages within a section together right now
        .sort((a, b) =>
          related(a, 'section') <= related(b, 'section') ? -1 : 1
        );

      let addRows = Array<IRowData>();
      readyRecs.forEach((p) => {
        const mediaRecs = planMedia
          .filter((m) => related(m, 'passage') === p.id)
          .sort(
            (i: MediaFile, j: MediaFile) =>
              // Sort descending
              j.attributes.versionNumber - i.attributes.versionNumber
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
                        role === 'view' ? p.attributes?.state || state : state;
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
                          passage: {} as Passage,
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
                          medId && (p.keys?.remoteId || p.id) === pasId
                            ? medId
                            : remoteId(
                                'mediafile',
                                mediaRec.id,
                                memory.keyMap
                              ) || mediaRec.id,
                        mediaId:
                          medId && (p.keys?.remoteId || p.id) === pasId
                            ? remoteIdGuid('mediafile', medId, memory.keyMap) ||
                              medId
                            : mediaRec.id,
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
            : i.sectPass <= j.sectPass
            ? -1
            : 1
        )
        .forEach((r) => rowList.push(r));
    };

    const role = React.useMemo(() => {
      if (userCanTranscribe()) {
        if (userCanBeEditor()) return RoleNames.Editor;
        else return RoleNames.Transcriber;
      } else return '';

      /* eslint-disable-next-line react-hooks/exhaustive-deps */
    }, [projRole]);

    const selectTasks = (
      onlyAvailable: boolean,
      rowList: IRowData[],
      item: string
    ) => {
      // IN PROGRESS TASKS
      if (role === RoleNames.Editor) {
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
      if (role === RoleNames.Editor) {
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
        const newAllDone = rowList.length === 0;
        if (newAllDone !== state.allDone) setAllDone(newAllDone);
        // ALL OTHERS
        addTasks('', 'view', rowList, false, playItem);
      } else {
        addTasks('', 'view', rowList, false, playItem);
      }
      setRows(rowList.map((r) => r));
      const exGrp: string[] = [];
      rowList.forEach((r) => {
        if (!exGrp.includes(r.planName)) exGrp.push(r.planName);
      });
      setExpandedGroups(exGrp);

      if (rowList.length > 0) {
        let selected =
          state.selected !== ''
            ? state.selected
            : remoteIdGuid('passage', pasId, memory.keyMap) ||
              pasId ||
              trackedTask;
        if (selected !== '') {
          const selectedRow = rowList.filter((r) => r.passage.id === selected);
          if (selectedRow.length > 0) {
            setSelected(selected, rowList);
          } else {
            selected = '';
          }
        }
        if (selected === '') {
          setSelected(rowList[1].passage.id, rowList);
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [role, project, sections, planMedia, refreshed]);

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
          const state = r.passage.attributes?.state || '';
          let rowRole = actor[state] || 'view';
          if (rowRole === 'editor' && role !== RoleNames.Editor)
            rowRole = 'view';
          const assigned = related(section, rowRole);
          rowData.push({
            ...r,
            section,
            role: rowRole,
            assigned,
            transcriber,
            editor,
          });
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
      const rowData: IRowData[] = [];
      var forcerefresh = false;
      state.rowData.forEach((r) => {
        //section
        if (!r.passage.id) rowData.push({ ...r });
        else {
          const passRecs = passages.filter((p) => p.id === r.passage.id);
          if (passRecs.length > 0) {
            const passage = { ...passRecs[0] };
            let role = r.role;
            const newState = passage?.attributes?.state;
            if (newState !== r.passage?.attributes?.state) {
              changed = true;
              role = actor[newState] || 'view';
              forcerefresh =
                forcerefresh ||
                noNewSelection.indexOf(newState) === -1 ||
                role !== r.role;
            }
            rowData.push({ ...r, passage, role });
          }
        }
      });
      if (changed) {
        setState({ ...state, rowData, playing: false });
        if (forcerefresh) refresh(); //force the transcriber pane to refresh also
      }
      /* eslint-disable-next-line react-hooks/exhaustive-deps */
    }, [passages]);

    useEffect(() => {
      if (mediaState.url) {
        mediaUrlRef.current = mediaState.url;
        fetching.current = '';
        try {
          loadBlob(mediaState.url, (urlOrError, b) => {
            if (!b) {
              if (urlOrError.includes('403')) {
                //force requery for new media url
                setSelected(state.selected);
              } else {
                //no blob
                showMessage(urlOrError);
                setState((state: ICtxState) => {
                  return {
                    ...state,
                    loading: false,
                    audioBlob: undefined,
                    playing: false,
                  };
                });
              }
              return;
            }
            //not sure what this intermediary file is, but causes console errors
            if (b.type !== 'text/html') {
              if (urlOrError === mediaUrlRef.current) {
                setState((state: ICtxState) => {
                  return {
                    ...state,
                    loading: false,
                    audioBlob: b,
                    playing: false,
                  };
                });
              }
            }
          });
        } catch (e: any) {
          logError(Severity.error, errorReporter, e);
          showMessage(e.message);
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mediaState.url]);

    useEffect(() => {
      if (mediaState.error) {
        if (mediaState.error.startsWith('no offline file'))
          showMessage(sharedStr.fileNotFound);
        else showMessage(mediaState.error);
        setState((state: ICtxState) => {
          return {
            ...state,
            loading: false,
            audioBlob: undefined,
            playing: false,
          };
        });
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mediaState.error]);

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

    const isFlat = (plan: string) => {
      if (plan !== '') {
        var planRec = getPlan(plan);
        if (planRec !== null) return planRec.attributes?.flat;
      }
      return false;
    };

    React.useEffect(() => {
      if (devPlan !== '') {
        const newFlat = isFlat(devPlan);
        if (state.flat !== newFlat)
          setState((state) => ({
            ...state,
            flat: newFlat,
          }));
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [devPlan]);

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
            hasUrl: mediaState.status === MediaSt.FETCHED,
            mediaUrl: mediaState.url,
            setSelected,
            setPlaying,
            setAllDone,
            setTrBusy,
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
