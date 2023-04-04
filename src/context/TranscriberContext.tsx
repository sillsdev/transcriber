import React, { useState, useEffect, useRef, useMemo } from 'react';
// see: https://upmostly.com/tutorials/how-to-use-the-usecontext-hook-in-react
import { useGlobal } from 'reactn';
import { useParams } from 'react-router-dom';
import * as actions from '../store';
import {
  IState,
  Passage,
  Plan,
  PlanType,
  Section,
  MediaFile,
  ITaskItemStrings,
  IToDoTableStrings,
  ITranscriberStrings,
  IProjButtonsStrings,
  BookName,
  ActivityStates,
  ISharedStrings,
  IActivityStateStrings,
} from '../model';
import { withData } from 'react-orbitjs';
import { QueryBuilder } from '@orbit/data';
import {
  related,
  sectionNumber,
  passageNumber,
  remoteIdGuid,
  usePlan,
  useArtifactType,
  getMediaInPlans,
  findRecord,
  VernacularTag,
} from '../crud';
import StickyRedirect from '../components/StickyRedirect';
import { shallowEqual, useSelector } from 'react-redux';
import {
  activitySelector,
  projButtonsSelector,
  sharedSelector,
  taskItemSelector,
  toDoTableSelector,
  transcriberSelector,
} from '../selector';
import { useDispatch } from 'react-redux';

export const getPlanName = (plan: Plan) => {
  return plan.attributes ? plan.attributes.name : '';
};

interface IRecordProps {
  passages: Passage[];
  sections: Section[];
  mediafiles: MediaFile[];
}

const mapRecordsToProps = {
  passages: (q: QueryBuilder) => q.findRecords('passage'),
  sections: (q: QueryBuilder) => q.findRecords('section'),
  mediafiles: (q: QueryBuilder) => q.findRecords('mediafile'),
};

export interface IRowData {
  planName: string;
  planType: string;
  section: Section;
  passage: Passage;
  mediafile: MediaFile;
  state: string;
  sectPass: string;
  playItem: string;
  duration: number;
  role: string;
  assigned: string;
  transcriber: string;
  editor: string;
}

const initState = {
  transSelected: undefined as string | undefined, //mediafileid
  setTransSelected: (selected: string | undefined) => {},
  index: -1,
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
  flat: false,
  artifactId: null as string | null,
  isDetail: false,
};

export type ICtxState = typeof initState;

interface IContext {
  state: ICtxState;
  setState: React.Dispatch<React.SetStateAction<ICtxState>>;
}

const TranscriberContext = React.createContext({} as IContext);

interface IProps {
  children: React.ReactElement;
  artifactTypeId?: string | null | undefined;
}
const TranscriberProvider = withData(mapRecordsToProps)(
  (props: IProps & IRecordProps) => {
    const { artifactTypeId } = props;
    const [isDetail] = useState(artifactTypeId !== undefined);
    const { passages, mediafiles, sections } = props;
    const todoStr: IToDoTableStrings = useSelector(
      toDoTableSelector,
      shallowEqual
    );
    const taskItemStr: ITaskItemStrings = useSelector(
      taskItemSelector,
      shallowEqual
    );
    const activityStateStr: IActivityStateStrings = useSelector(
      activitySelector,
      shallowEqual
    );
    const transcriberStr: ITranscriberStrings = useSelector(
      transcriberSelector,
      shallowEqual
    );
    const projButtonStr: IProjButtonsStrings = useSelector(
      projButtonsSelector,
      shallowEqual
    );
    const allBookData = useSelector((state: IState) => state.books.bookData);
    const lang = useSelector((state: IState) => state.strings.lang);
    const booksLoaded = useSelector((state: IState) => state.books.loaded);
    const dispatch = useDispatch();
    const fetchBooks = (lang: string) => dispatch(actions.fetchBooks(lang));
    const sharedStr: ISharedStrings = useSelector(sharedSelector, shallowEqual);
    const { pasId, slug, medId } = useParams();
    const [memory] = useGlobal('memory');
    const [user] = useGlobal('user');
    const [devPlan] = useGlobal('plan');
    const { getPlan } = usePlan();
    const view = React.useRef('');
    const [refreshed, setRefreshed] = useState(0);
    const [planMedia, setPlanMedia] = useState<MediaFile[]>([]);
    const planMediaRef = useRef<MediaFile[]>([]);
    const passageMediaRef = useRef<MediaFile[]>([]);
    const [planRec, setPlanRec] = useState<Plan>({} as Plan);
    const [state, setState] = useState({
      ...initState,
      allBookData,
      todoStr,
      taskItemStr,
      activityStateStr,
      transcriberStr,
      projButtonStr,
      sharedStr,
      isDetail,
    });
    const { getTypeId } = useArtifactType();

    const artifactId = useMemo(
      () => (slug ? getTypeId(slug) : artifactTypeId ?? VernacularTag),
      [slug, artifactTypeId, getTypeId]
    );

    useEffect(() => {
      if (devPlan && mediafiles.length > 0) {
        var m = getMediaInPlans([devPlan], mediafiles, artifactId, true);
        setPlanMedia(m);
        planMediaRef.current = m;
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mediafiles, devPlan, artifactId]);

    const setRows = (rowData: IRowData[]) => {
      setState((state: ICtxState) => {
        return { ...state, rowData };
      });
    };

    const setExpandedGroups = (expandedGroups: string[]) => {
      setState((state: ICtxState) => {
        return { ...state, expandedGroups };
      });
    };

    const setAllDone = (val: boolean) => {
      setState((state: ICtxState) => {
        return { ...state, allDone: val };
      });
    };

    const setTransSelected = (
      transSelected: string | undefined,
      rowData: IRowData[] = state.rowData
    ) => {
      const i = rowData.findIndex((r) => r.mediafile.id === transSelected);
      if (i < 0) return;
      const r = rowData[i];

      if (state.index !== i || state.transSelected !== transSelected) {
        setState((state: ICtxState) => {
          return {
            ...state,
            index: i,
            transSelected,
            playItem: r.mediafile.id,
          };
        });
      }
    };

    const refresh = () => {
      setRefreshed((refreshed) => {
        return refreshed + 1;
      });
    };

    const getPlanType = (planRec: Plan) => {
      const planType = findRecord(
        memory,
        'plantype',
        related(planRec, 'plantype')
      ) as PlanType;
      return planType?.attributes.name || '';
    };

    const addTasks = (
      state: string,
      role: string,
      rowList: IRowData[],
      onlyAvailable: boolean,
      playItem: string
    ) => {
      const planName = getPlanName(planRec);
      const planType = getPlanType(planRec);

      const mediaRecs = passageMediaRef.current.filter(
        (m) =>
          role === 'view' ||
          (m.attributes?.transcriptionstate ||
            ActivityStates.TranscribeReady) === state
      );
      const passIds = mediaRecs.map((m) => related(m, 'passage') as string);
      let readyRecs = passages
        .filter((p) => passIds.findIndex((pid) => pid === p.id) >= 0)
        .sort((a, b) =>
          related(a, 'section') <= related(b, 'section') ? -1 : 1
        );
      let addRows = Array<IRowData>();
      let assigned = '';
      let allowed = false;
      let secNum = '';
      let secRec = {} as Section;
      let transcriber = '';
      let editor = '';
      let curSec = '';
      readyRecs.forEach((p) => {
        const passageMediaRecs = mediaRecs
          .filter((m) => related(m, 'passage') === p.id)
          .sort((i: MediaFile, j: MediaFile) =>
            // Sort ascending--vernacular will only have the latest.  All others sort by date created (possible upgrade would be segment start if available)
            j.attributes.dateCreated <= i.attributes.dateCreated ? -1 : 1
          );

        if (related(p, 'section') !== curSec) {
          curSec = related(p, 'section');
          secRec = findRecord(
            memory,
            'section',
            related(p, 'section')
          ) as Section;
          if (secRec) {
            secNum = sectionNumber(secRec);
            assigned = related(secRec, role);
            transcriber = related(secRec, 'transcriber');
            editor = related(secRec, 'editor');
            allowed = onlyAvailable
              ? assigned === user || !assigned || assigned === ''
              : role === 'view';

            if (allowed && !rowList.find((r) => r.sectPass === secNum + '.'))
              addRows.push({
                planName,
                planType,
                section: { ...secRec },
                passage: {} as Passage,
                state: '',
                sectPass: secNum + '.',
                mediafile: {} as MediaFile,
                playItem: '',
                duration: 0,
                role,
                assigned,
                transcriber,
                editor,
              });
          }
        }
        if (allowed)
          passageMediaRecs.forEach((mediaRec) => {
            let already: IRowData[] = [];
            if (role === 'view') {
              already = rowList.filter((r) => r.mediafile.id === mediaRec.id);
            }
            if (role !== 'view' || already.length === 0) {
              const curState: ActivityStates | string =
                role === 'view'
                  ? mediaRec.attributes?.transcriptionstate || state
                  : state;
              addRows.push({
                planName,
                planType,
                section: { ...secRec },
                passage: { ...p },
                state: curState,
                sectPass: secNum + '.' + passageNumber(p).trim(),
                mediafile: mediaRec,
                playItem,
                duration: mediaRec.attributes.duration,
                role,
                assigned,
                transcriber,
                editor,
              });
            }
          });
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
        .forEach((r) => {
          rowList.push(r);
        });
    };

    const selectTasks = (
      onlyAvailable: boolean,
      rowList: IRowData[],
      item: string
    ) => {
      // IN PROGRESS TASKS
      addTasks(
        ActivityStates.Reviewing,
        'editor',
        rowList,
        onlyAvailable,
        item
      );

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
      addTasks(
        ActivityStates.Transcribed,
        'editor',
        rowList,
        onlyAvailable,
        item
      );

      addTasks(
        ActivityStates.TranscribeReady,
        'transcriber',
        rowList,
        onlyAvailable,
        item
      );
    };

    useEffect(() => {
      const playItem = state.playItem;
      const rowList: IRowData[] = [];
      if (pasId) {
        var psg = remoteIdGuid('passage', pasId, memory.keyMap) || pasId;
        passageMediaRef.current = planMediaRef.current.filter(
          (m) => related(m, 'passage') === psg
        );
      } else passageMediaRef.current = planMediaRef.current;

      selectTasks(true, rowList, playItem); // assigned
      selectTasks(false, rowList, playItem); // unassigned
      const newAllDone = rowList.length === 0 && !isDetail;
      if (newAllDone !== state.allDone) setAllDone(newAllDone);
      // ALL OTHERS
      addTasks('', 'view', rowList, false, playItem);

      setRows(rowList.map((r) => r));
      const exGrp: string[] = [];
      rowList.forEach((r) => {
        if (!exGrp.includes(r.planName)) exGrp.push(r.planName);
      });
      setExpandedGroups(exGrp);
      if (rowList.length > 0) {
        let transSelected = state.transSelected;
        if (!transSelected) {
          let mediaId = medId;
          if (!mediaId) {
            //vernacular so should just be one
            const psg =
              remoteIdGuid('passage', pasId ?? '', memory.keyMap) || pasId;
            const p = rowList.filter((r) => r.passage.id === psg);
            if (p.length > 0) mediaId = p[0].mediafile.id;
          }
          transSelected =
            remoteIdGuid('mediafile', mediaId || '', memory.keyMap) ||
            mediaId ||
            '';
        }

        if (transSelected !== '') {
          const selectedRow = rowList.filter(
            (r) => r.mediafile.id === transSelected
          );
          if (selectedRow.length > 0) {
            setTransSelected(transSelected, rowList);
          } else {
            transSelected = '';
          }
        }
        if (transSelected === '') {
          setTransSelected(rowList[1].mediafile.id, rowList);
        }
      } else {
        setState((state: ICtxState) => {
          return {
            ...state,
            index: -1,
            transSelected: '',
            playItem: '',
          };
        });
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [planMedia, refreshed, pasId, medId]);

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
          const state =
            r.mediafile.attributes?.transcriptionstate ||
            ActivityStates.TranscribeReady;
          let rowRole = actor[state] || 'view';
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
          const mediaRecs = mediafiles.filter((m) => m.id === r.mediafile.id);
          if (mediaRecs.length > 0) {
            const mediafile = { ...mediaRecs[0] };
            let role = r.role;
            const newState = mediafile?.attributes?.transcriptionstate;
            if (newState !== r.mediafile?.attributes?.transcriptionstate) {
              changed = true;
              role = actor[newState] || 'view';
              forcerefresh =
                forcerefresh ||
                noNewSelection.indexOf(newState) === -1 ||
                role !== r.role;
            }
            rowData.push({ ...r, mediafile, role });
          }
        }
      });
      if (changed) {
        setState({ ...state, rowData }); //eh...what to do about: playing:false
        if (forcerefresh) refresh(); //force the transcriber pane to refresh also
      }
      /* eslint-disable-next-line react-hooks/exhaustive-deps */
    }, [mediafiles, pasId]);

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

    const isFlat = (planRec: Plan) => {
      if (planRec !== null) return planRec.attributes?.flat;
      return false;
    };

    React.useEffect(() => {
      if (devPlan !== '') {
        const planRec = getPlan(devPlan);
        if (planRec) {
          setPlanRec(planRec);
          const newFlat = isFlat(planRec);
          if (state.flat !== newFlat)
            setState((state) => ({
              ...state,
              flat: newFlat,
            }));
        }
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
            artifactId,
            setAllDone,
            setTransSelected,
            refresh,
          },
          setState,
        }}
      >
        {props.children}
      </TranscriberContext.Provider>
    );
  }
);

export { TranscriberContext, TranscriberProvider };
