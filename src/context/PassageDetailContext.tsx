import React, { useState, useEffect, useRef, useContext } from 'react';
// see: https://upmostly.com/tutorials/how-to-use-the-usecontext-hook-in-react
import { useGetGlobal, useGlobal } from '../context/GlobalContext';
import { useParams } from 'react-router-dom';
import { shallowEqual } from 'react-redux';
import {
  IState,
  Plan,
  MediaFile,
  MediaFileD,
  ISharedStrings,
  Passage,
  PassageD,
  Section,
  SectionD,
  BookName,
  OrgWorkflowStep,
  OrgWorkflowStepD,
  SectionResourceUser,
  ArtifactType,
  ArtifactCategory,
  WorkflowStep,
  IWorkflowStepsStrings,
  IPassageDetailStepCompleteStrings,
  StepComplete,
  SectionResourceD,
  SharedResourceD,
} from '../model';
import { AddPassageStateChangeToOps } from '../crud/updatePassageState';
import { ArtifactTypeSlug } from '../crud/artifactTypeSlug';
import { ToolSlug } from '../crud/toolSlug';
import { findRecord } from '../crud/tryFindRecord';
import { getAllMediaRecs } from '../crud/media';
import { getStepComplete } from '../crud/getStepComplete';
import { getTool } from '../crud/useStepTool';
import { nextPasId } from '../crud/nextPasId';
import { orgDefaultWorkflowProgression } from '../crud/useOrgDefaults';
import { related } from '../crud/related';
import { remoteId, remoteIdGuid } from '../crud/remoteId';
import { useArtifactCategory } from '../crud/useArtifactCategory';
import { useArtifactType } from '../crud/useArtifactType';
import { BlobStatus, useFetchMediaBlob } from '../crud/useFetchMediaBlob';
import { useFilteredSteps } from '../crud/useFilteredSteps';
import { useOrgDefaults } from '../crud/useOrgDefaults';
import { useOrgWorkflowSteps } from '../crud/useOrgWorkflowSteps';
import StickyRedirect from '../components/StickyRedirect';
import {
  logError,
  prettySegment,
  rememberCurrentPassage,
  Severity,
} from '../utils';
import { useSnackBar } from '../hoc/SnackBar';
import * as actions from '../store';
import LimitedMediaPlayer from '../components/LimitedMediaPlayer';
import {
  getResources,
  mediaRows,
  oneMediaRow,
  resourceRows,
} from '../components/PassageDetail/Internalization';
import Confirm from '../components/AlertDialog';
import { getNextStep } from '../crud/getNextStep';
import { UnsavedContext } from './UnsavedContext';
import { IRegion } from '../crud/useWavesurferRegions';
import { UpdateLastModifiedBy } from '../model/baseModel';
import { IMarker } from '../crud/useWaveSurfer';
import { useSelector } from 'react-redux';
import {
  passageDetailStepCompleteSelector,
  sharedSelector,
  workflowStepsSelector,
} from '../selector';
import { useDispatch } from 'react-redux';
import {
  RecordKeyMap,
  RecordOperation,
  RecordTransformBuilder,
} from '@orbit/records';
import { useOrbitData } from '../hoc/useOrbitData';
import {
  projDefSectionMap,
  useProjectDefaults,
} from '../crud/useProjectDefaults';
import { usePassageNavigate } from '../components/PassageDetail/usePassageNavigate';

export const getPlanName = (plan: Plan) => {
  return plan.attributes ? plan.attributes.name : '';
};
export enum PlayInPlayer {
  no = 0,
  yes = 1,
}

export interface IRow {
  id: string;
  sequenceNum: number;
  version: number;
  mediafile: MediaFileD;
  playItem: string;
  artifactName: string;
  artifactType: string;
  artifactCategory: string;
  done: boolean;
  editAction: JSX.Element | null;
  resource: SectionResourceD | null;
  passageId: string;
  isVernacular: boolean;
  isResource: boolean;
  isComment: boolean;
  isKeyTerm: boolean;
  isText: boolean;
  sourceVersion: number;
}

export interface SimpleWf {
  id: string;
  label: string;
}
const initState = {
  passage: {} as PassageD,
  section: {} as SectionD,
  sharedResource: {} as SharedResourceD,
  currentstep: '',
  tool: ToolSlug.Discuss,
  orgWorkflowSteps: [] as OrgWorkflowStepD[],
  setOrgWorkflowSteps: (steps: OrgWorkflowStep[]) => {},
  setCurrentStep: (step: string) => {}, //what the user is looking at
  firstStepIndex: -1,
  setFirstStepIndex: (step: number) => {},
  index: 0, //row index?
  mediafileId: '', //This is the latest vernacular
  selected: '',
  setSelected: (
    selected: string,
    inPlayer: PlayInPlayer,
    rowData?: IRow[]
  ) => {},
  setMediaSelected: (id: string, start: number, end: number) => {},
  playerMediafile: undefined as MediaFile | undefined, //passagedetailPlayer id
  playing: false, //vernacular in wavesurfer
  setPlaying: (playing: boolean) => {},
  itemPlaying: false, //resource, bt, retell etc
  setItemPlaying: (playing: boolean) => {},
  playItem: '', //resource
  setPlayItem: (item: string) => {},
  commentPlaying: false,
  setCommentPlaying: (playing: boolean, ended?: boolean) => {},
  commentPlayId: '',
  setCommentPlayId: (mediaId: string) => {},
  oldVernacularPlayItem: '',
  oldVernacularStart: 0,
  oldVernacularPlaying: false,
  handleOldVernacularPlayEnd: () => {},
  rowData: Array<IRow>(),
  sharedStr: {} as ISharedStrings,

  loading: false,
  audioBlob: undefined as Blob | undefined,
  pdBusy: false,
  setPDBusy: (pdBusy: boolean) => {},
  allBookData: Array<BookName>(),
  getProjectResources: async () => [] as MediaFileD[],
  workflow: Array<SimpleWf>(),
  psgCompleted: [] as StepComplete[],
  setStepComplete: async (
    stepId: string,
    complete: boolean,
    psgCompleted?: any[]
  ): Promise<void> => {},
  setStepCompleteTo: async (stepId: string) => {},
  gotoNextStep: () => {},
  stepComplete: (stepId: string) => {
    return false;
  },
  discussionSize: { width: 450, height: 900 },
  playerSize: 280,
  setDiscussionSize: (size: { width: number; height: number }) => {},
  setPlayerSize: (size: number) => {},
  chooserSize: 48,
  setChooserSize: (size: number) => {},
  defaultFilename: '',
  uploadItem: '',
  currentSegment: '',
  currentSegmentIndex: -1,
  setCurrentSegment: (segment: IRegion | undefined, index: number) => {}, //replace the above two
  setupLocate: (cb?: (segments: string) => void) => {},
  getCurrentSegment: () => undefined as IRegion | undefined,
  setPlayerSegments: (segments: string) => {},
  recording: false,
  setRecording: (recording: boolean) => {},
  commentRecording: false,
  setCommentRecording: (commentRecording: boolean) => {},
  wfStr: {} as IWorkflowStepsStrings,
  handleItemPlayEnd: () => {},
  handleItemTogglePlay: () => {},
  handleCommentPlayEnd: () => {},
  handleCommentTogglePlay: () => {},
  discussionMarkers: [] as IMarker[],
  setDiscussionMarkers: (markers: IMarker[]) => {},
  handleHighlightDiscussion: (time: number | undefined) => {},
  highlightDiscussion: undefined as number | undefined,
  refresh: 0,
  prjId: '',
  forceRefresh: (rowData?: IRow[]) => {},
  sectionArr: [] as [number, string][],
  toggleDone: (id: string) => {},
};

export type ICtxState = typeof initState;

interface IContext {
  state: ICtxState;
  setState: React.Dispatch<React.SetStateAction<ICtxState>>;
}

const PassageDetailContext = React.createContext({} as IContext);

interface IProps {
  children: React.ReactElement;
}
const PassageDetailProvider = (props: IProps) => {
  const passages = useOrbitData<Passage[]>('passage');
  const sections = useOrbitData<Section[]>('section');
  const mediafiles = useOrbitData<MediaFileD[]>('mediafile');
  const artifactTypes = useOrbitData<ArtifactType[]>('artifacttype');
  const categories = useOrbitData<ArtifactCategory[]>('artifactcategory');
  const userResources = useOrbitData<SectionResourceUser[]>(
    'sectionresourceuser'
  );
  const sectionResources = useOrbitData<SectionResourceD[]>('sectionresource');
  const orgWorkflowSteps = useOrbitData<OrgWorkflowStep[]>('orgworkflowstep');
  const workflowSteps = useOrbitData<WorkflowStep[]>('workflowstep');
  const wfStr: IWorkflowStepsStrings = useSelector(
    workflowStepsSelector,
    shallowEqual
  );
  const sharedStr: ISharedStrings = useSelector(sharedSelector, shallowEqual);
  const stepCompleteStr: IPassageDetailStepCompleteStrings = useSelector(
    passageDetailStepCompleteSelector,
    shallowEqual
  );
  const lang = useSelector((state: IState) => state.strings.lang);
  const allBookData = useSelector((state: IState) => state.books.bookData);
  const booksLoaded = useSelector((state: IState) => state.books.loaded);
  const dispatch = useDispatch();
  const fetchBooks = (lang: string) => dispatch(actions.fetchBooks(lang));
  const { pasId, prjId } = useParams();
  const getGlobal = useGetGlobal();
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');
  const [org] = useGlobal('organization');
  const [errorReporter] = useGlobal('errorReporter');
  const [saveResult, setSaveResult] = useGlobal('saveResult');
  const [confirm, setConfirm] = useState('');
  const view = React.useRef('');
  const { showMessage } = useSnackBar();
  const [plan] = useGlobal('plan');
  const { getProjectDefault } = useProjectDefaults();
  const [state, setState] = useState({
    ...initState,
    allBookData,
    wfStr,
    prjId: prjId ?? '',
  });
  const [blobState, fetchBlob] = useFetchMediaBlob();
  const fetching = useRef('');
  const segmentsCb = useRef<(segments: string) => void>();
  const getFilteredSteps = useFilteredSteps();
  const { localizedArtifactType, getTypeId } = useArtifactType();
  const { localizedArtifactCategory } = useArtifactCategory();
  const { localizedWorkStep } = useOrgWorkflowSteps();
  const getStepsBusy = useRef<boolean>(false);
  const mediaStart = useRef<number | undefined>();
  const mediaEnd = useRef<number | undefined>();
  const mediaPosition = useRef<number | undefined>();
  const currentSegmentRef = useRef<IRegion | undefined>();
  const { startSave, startClear, waitForSave } =
    useContext(UnsavedContext).state;
  const highlightRef = useRef<number>();
  const refreshRef = useRef<number>(0);
  const settingSegmentRef = useRef(false);
  const inPlayerRef = useRef<string>();
  const { getOrgDefault } = useOrgDefaults();

  const setCurrentStep = (stepId: string) => {
    if (getGlobal('changed')) {
      setConfirm(stepId);
    } else {
      handleSetCurrentStep(stepId);
    }
  };

  const passageNavigate = usePassageNavigate(() => {}, setCurrentStep);

  const handleSetCurrentStep = (stepId: string) => {
    var step = state.orgWorkflowSteps.find((s) => s.id === stepId);
    var tool = getTool(step?.attributes?.tool) as ToolSlug;
    setCurrentSegment(undefined, 0);
    setState((state: ICtxState) => {
      return {
        ...state,
        currentstep: stepId,
        tool,
        playing: false,
        itemPlaying: false,
        commentPlaying: false,
        oldVernacularPlaying: false,
        playItem: '',
        commentPlayId: '',
        oldVernacularPlayItem: '',
      };
    });

    if (step && tool !== ToolSlug.Resource && tool !== ToolSlug.Transcribe) {
      //this does a bunch of stuff...don't just set it in the state above...
      if (state.rowData.length > 0 && state.rowData[0].isVernacular) {
        setSelected(state.rowData[0].id, PlayInPlayer.yes);
      } else setSelected('', PlayInPlayer.yes);
    }
    segmentsCb.current = undefined;
  };
  const forceRefresh = (rowData?: IRow[]) => {
    refreshRef.current = refreshRef.current + 1;
    setState((state: ICtxState) => {
      return {
        ...state,
        refresh: refreshRef.current,
        rowData: rowData ?? state.rowData,
      };
    });
  };

  const setFirstStepIndex = (stepIndex: number) => {
    setState((state: ICtxState) => {
      return {
        ...state,
        firstStepIndex: stepIndex,
      };
    });
  };

  const handleConfirmStep = () => {
    startSave();
    waitForSave(() => {
      handleSetCurrentStep(confirm);
      setConfirm('');
    }, 400);
  };

  const handleRefuseStep = () => {
    startClear();
    waitForSave(() => {
      handleSetCurrentStep(confirm);
      setConfirm('');
    }, 400);
  };

  const setDiscussionSize = (discussionSize: {
    width: number;
    height: number;
  }) => {
    setState((state: ICtxState) => {
      return { ...state, discussionSize };
    });
  };

  const setPlayerSize = (playerSize: number) => {
    setState((state: ICtxState) => {
      return { ...state, playerSize };
    });
  };

  const setChooserSize = (chooserSize: number) => {
    setState((state: ICtxState) => {
      return { ...state, chooserSize };
    });
  };

  const setRecording = (recording: boolean) => {
    setState((state: ICtxState) => {
      return {
        ...state,
        playing: false, //stop the vernacular
        itemPlaying: false,
        commentPlaying: false,
        oldVernacularPlaying: false,
        recording,
      };
    });
  };
  const setCommentRecording = (commentRecording: boolean) => {
    setState((state: ICtxState) => {
      return {
        ...state,
        playing: false, //stop the vernacular
        itemPlaying: false,
        commentPlaying: false,
        oldVernacularPlaying: false,
        commentRecording,
      };
    });
  };

  //this is for the PD Player only
  const setPlaying = (playing: boolean) => {
    //if this is called from a callback, we don't know the state
    //if (playing !== state.playing) {
    if (playing)
      setState((state: ICtxState) => {
        return {
          ...state,
          playing,
          itemPlaying: false,
          commentPlaying: false,
          oldVernacularPlaying: false,
          oldVernacularPlayItem: '',
          oldVernacularStart: 0,
        };
      });
    else
      setState((state: ICtxState) => {
        return {
          ...state,
          playing,
        };
      });
  };
  const setItemPlaying = (itemPlaying: boolean) => {
    if (itemPlaying !== state.itemPlaying) {
      setState((state: ICtxState) => {
        return {
          ...state,
          itemPlaying,
          playing: itemPlaying ? false : state.playing,
          commentPlaying: itemPlaying ? false : state.commentPlaying,
          oldVernacularPlaying: itemPlaying
            ? false
            : state.oldVernacularPlaying,
          oldVernacularPlayItem: itemPlaying ? '' : state.oldVernacularPlayItem,
          oldVernacularStart: itemPlaying ? 0 : state.oldVernacularStart,
        };
      });
    }
  };
  const setCommentPlaying = (
    commentPlaying: boolean,
    ended: boolean = false
  ) => {
    if (commentPlaying !== state.commentPlaying) {
      setState((state: ICtxState) => {
        return {
          ...state,
          commentPlaying,
          commentPlayId: ended ? '' : state.commentPlayId,
          playing: commentPlaying ? false : state.playing,
          itemPlaying: commentPlaying ? false : state.itemPlaying,
          oldVernacularPlaying: commentPlaying
            ? false
            : state.oldVernacularPlaying,
          oldVernacularPlayItem: commentPlaying
            ? ''
            : state.oldVernacularPlayItem,
        };
      });
    }
  };

  const handleItemPlayEnd = () => {
    setItemPlaying(false);
    oldVernReset();
  };
  const handleItemTogglePlay = () => {
    setItemPlaying(!state.itemPlaying);
  };
  const handleCommentPlayEnd = () => {
    if (state.commentPlaying) setCommentPlaying(false, true);
    else setCommentPlayId('');
  };

  const handleCommentTogglePlay = () => {
    setCommentPlaying(!state.commentPlaying);
  };
  const handleOldVernacularPlayEnd = () => {
    mediaStart.current = undefined;
    mediaEnd.current = undefined;
    setState((state: ICtxState) => {
      return {
        ...state,
        oldVernacularPlaying: false,
        oldVernacularPlayItem: '',
        oldVernacularStart: 0,
      };
    });
  };
  const setPDBusy = (busy: boolean) => {
    setState((state: ICtxState) => {
      return {
        ...state,
        pdBusy: busy,
      };
    });
  };

  const setDiscussionMarkers = (discussionMarkers: IMarker[]) => {
    setState((state: ICtxState) => {
      return { ...state, discussionMarkers };
    });
  };
  const handleHighlightDiscussion = (time: number | undefined) => {
    if (settingSegmentRef.current) return;

    settingSegmentRef.current = true;
    if (highlightRef.current !== time) {
      highlightRef.current = time;
      setState((state: ICtxState) => {
        return {
          ...state,
          highlightDiscussion: time,
        };
      });
    } else if (time !== undefined) {
      //force refresh if they've hit the same locate button again
      refreshRef.current = refreshRef.current + 1;
      setState((state: ICtxState) => {
        return { ...state, refresh: refreshRef.current, playing: false };
      });
    } else settingSegmentRef.current = false;
  };
  const stepComplete = (stepid: string) => {
    stepid =
      remoteId('orgworkflowstep', stepid, memory?.keyMap as RecordKeyMap) ||
      stepid;
    var step = state.psgCompleted.find((s) => s.stepid === stepid);
    return Boolean(step?.complete);
  };

  const gotoNextStep = () => {
    var gotoNextPassage =
      getOrgDefault(orgDefaultWorkflowProgression) !== 'step';
    const nextpsg = gotoNextPassage
      ? nextPasId(state.section, state.passage.id, memory)
      : undefined;
    if (nextpsg && nextpsg !== state.passage?.keys?.remoteId) {
      rememberCurrentPassage(memory, nextpsg);
      passageNavigate(`/detail/${prjId}/${nextpsg}`);
    } else setCurrentStep(''); // setting to empty jumps to first uncompleted
  };
  const setStepComplete = async (
    stepid: string,
    complete: boolean,
    psgCompleted?: any[]
  ) => {
    if (stepid === '') return;
    var completed = psgCompleted ?? [...state.psgCompleted];
    var remId =
      remoteId('orgworkflowstep', stepid, memory?.keyMap as RecordKeyMap) ||
      stepid;
    var step = completed.find((s) => s.stepid === remId);
    var rec = findRecord(memory, 'orgworkflowstep', stepid) as OrgWorkflowStep;
    if (step) {
      step.complete = complete;
    } else {
      completed.push({ stepid: remId, complete, name: rec.attributes.name });
    }
    const recId = {
      type: 'passage',
      id:
        remoteIdGuid('passage', pasId ?? '', memory?.keyMap as RecordKeyMap) ||
        pasId ||
        '',
    };
    const curPassage = findRecord(memory, 'passage', recId.id) as Passage;
    const curCompleteStr = curPassage?.attributes.stepComplete;
    let stepComplete = {};
    try {
      stepComplete = JSON.parse(curCompleteStr || '{}');
    } catch (err) {}
    var tb = new RecordTransformBuilder();
    var ops = [] as RecordOperation[];
    ops.push(
      tb
        .replaceAttribute(
          recId,
          'stepComplete',
          JSON.stringify({ ...stepComplete, completed })
        )
        .toOperation()
    );
    ops.push(...UpdateLastModifiedBy(tb, recId, user));
    AddPassageStateChangeToOps(
      tb,
      ops,
      recId.id,
      '',
      `${
        complete ? stepCompleteStr.title : stepCompleteStr.incomplete
      } : ${localizedWorkStep(rec.attributes.name)}`,
      user,
      memory
    );
    await memory.update(ops);
    setState((state: ICtxState) => ({ ...state, psgCompleted: completed }));
  };
  const setStepCompleteTo = async (stepid: string) => {
    if (stepid === '') return;
    var completed: StepComplete[] = [];
    var steps = state.orgWorkflowSteps.sort(
      (a, b) => a.attributes.sequencenum - b.attributes.sequencenum
    );
    var rec;
    for (const step of steps) {
      var remId =
        remoteId('orgworkflowstep', step.id, memory.keyMap as RecordKeyMap) ||
        step.id;
      rec = findRecord(memory, 'orgworkflowstep', step.id) as OrgWorkflowStep;
      completed.push({
        stepid: remId,
        complete: true,
        name: rec.attributes.name,
      });
      if (step.id === stepid) break;
    }
    const recId = {
      type: 'passage',
      id:
        remoteIdGuid('passage', pasId ?? '', memory.keyMap as RecordKeyMap) ||
        pasId ||
        '',
    };
    var tb = new RecordTransformBuilder();
    var ops = [] as RecordOperation[];
    ops.push(
      tb
        .replaceAttribute(recId, 'stepComplete', JSON.stringify({ completed }))
        .toOperation()
    );
    ops.push(...UpdateLastModifiedBy(tb, recId, user));
    AddPassageStateChangeToOps(
      tb,
      ops,
      recId.id,
      '',
      `${stepCompleteStr.title} : ${localizedWorkStep(
        rec?.attributes?.name ?? ''
      )}`,
      user,
      memory
    );
    await memory.update(ops);
    setState((state: ICtxState) => ({ ...state, psgCompleted: completed }));
  };
  const getProjectResources = async () => {
    const typeId = getTypeId(ArtifactTypeSlug.ProjectResource);
    return mediafiles.filter(
      (m) =>
        related(m, 'plan') === plan && related(m, 'artifactType') === typeId
    );
  };

  const setSelected = (
    selected: string,
    inPlayer: PlayInPlayer,
    rowData: IRow[] = state.rowData
  ) => {
    let i = rowData.findIndex((r) => r.mediafile.id === selected);
    let newRows: IRow[] = [];

    if (i < 0) {
      const media = mediafiles.find((m) => m.id === selected);
      if (media) {
        newRows = oneMediaRow({
          newRow: state.rowData,
          r: null,
          media,
          sourceversion: 0,
          artifactTypes,
          categories,
          userResources,
          user,
          localizedCategory: localizedArtifactCategory,
          localizedType: localizedArtifactType,
        });
        i = newRows.length - 1;
      } else {
        oldVernReset();
        fetchBlob('');
        setState((state: ICtxState) => {
          return {
            ...state,
            audioBlob: undefined,
            index: -1,
            selected,
            playerMediafile: undefined,
            playing: false,
            itemPlaying: false,
            commentPlaying: false,
            playItem: '',
            commentPlayId: '',
            loading: false,
          };
        });
        return;
      }
    }
    const r = rowData[i];
    var resetBlob = false;
    //if this is a file that will be played in the wavesurfer..fetch it
    if (inPlayer === PlayInPlayer.yes) {
      inPlayerRef.current = r.mediafile.id;
      if (
        blobState.id !== r.mediafile.id &&
        fetching.current !== r.mediafile.id
      ) {
        fetching.current = r.mediafile.id;
        fetchBlob(r.mediafile.id);
        resetBlob = true;
      }

      if (resetBlob) currentSegmentRef.current = undefined;
      var rows = newRows.length > 0 ? newRows : rowData;
      setState((state: ICtxState) => {
        return {
          ...state,
          audioBlob: resetBlob ? undefined : state.audioBlob,
          index: i,
          selected,
          playerMediafile: rows[i].mediafile,
          playing: false,
          loading: fetching.current !== '',
          rowData: rows,
          currentSegment: resetBlob ? '' : state.currentSegment,
          currentSegmentIndex: resetBlob ? 0 : state.currentSegmentIndex,
        };
      });
    } else if (mediaStart.current !== undefined && !r.isResource) {
      //play just the segment of an old one
      setState((state: ICtxState) => {
        return {
          ...state,
          index: i,
          selected,
          playing: false,
          commentPlaying: false,
          itemPlaying: false,
          oldVernacularPlayItem: r.mediafile.id,
          oldVernacularStart: mediaStart.current || 0,
          rowData: newRows.length > 0 ? newRows : rowData,
        };
      });
    } else if (r.isComment || r.isKeyTerm) {
      setState((state: ICtxState) => {
        return {
          ...state,
          index: i,
          selected,
          playing: false,
          commentPlayId: r.mediafile.id,
          commentPlaying: true, //should I have a useEffect like playItem?
          itemPlaying: false,
          rowData: newRows.length > 0 ? newRows : rowData,
        };
      });
    } else {
      setState((state: ICtxState) => {
        return {
          ...state,
          index: i,
          selected,
          playing: false,
          commentPlaying: false,
          playItem: r.mediafile.id,
          itemPlaying: false, //useEffect will turn this on
          rowData: newRows.length > 0 ? newRows : rowData,
        };
      });
    }
  };

  const setPlayItem = (playItem: string) => {
    setState((state: ICtxState) => {
      return {
        ...state,
        playItem: playItem,
      };
    });
  };

  const setCommentPlayId = (mediaId: string) => {
    setState((state: ICtxState) => {
      return {
        ...state,
        commentPlayId: mediaId,
      };
    });
  };

  const oldVernReset = () => {
    mediaStart.current = undefined;
    mediaEnd.current = undefined;
    mediaPosition.current = undefined;
    handleOldVernacularPlayEnd();
  };

  const setMediaSelected = (id: string, start: number, end: number) => {
    mediaStart.current = start;
    mediaEnd.current = end;
    setSelected(id, PlayInPlayer.no, state.rowData);
  };

  const handleLoaded = () => {
    setState((state: ICtxState) => {
      return {
        ...state,
        oldVernacularPlaying: true,
      };
    });
  };

  const setCurrentSegment = (
    segment: IRegion | undefined,
    currentSegmentIndex: number
  ) => {
    if (
      settingSegmentRef.current &&
      ((!segment && highlightRef.current === undefined) ||
        (segment && segment.start === highlightRef.current))
    ) {
      settingSegmentRef.current = false;
    }
    if (!settingSegmentRef.current && segment?.start !== highlightRef.current) {
      handleHighlightDiscussion(undefined);
      settingSegmentRef.current = false;
    }
    if (currentSegmentRef.current !== segment) {
      currentSegmentRef.current = segment;
      setState((state: ICtxState) => ({
        ...state,
        currentSegment: prettySegment(segment),
        currentSegmentIndex,
      }));
    }
  };
  const setupLocate = (cb?: (segments: string) => void) => {
    segmentsCb.current = cb;
  };
  //set the player segment to the specified segment??
  const setPlayerSegments = (segments: string) => {
    if (segmentsCb.current) segmentsCb.current(segments);
    settingSegmentRef.current = false;
  };

  const getCurrentSegment = () => {
    return currentSegmentRef.current;
  };

  const toggleDone = (id: string) => {
    const newRows = state.rowData.map((r) =>
      r.id === id ? { ...r, done: !r.done } : r
    );
    setState((state: ICtxState) => ({ ...state, rowData: newRows }));
  };

  const stepCmp = (a: StepComplete, b: StepComplete) =>
    a.stepid > b.stepid ? 1 : -1;

  useEffect(() => {
    const passageId =
      remoteIdGuid('passage', pasId ?? '', memory?.keyMap as RecordKeyMap) ||
      pasId ||
      '';
    var p = passages.find((p) => p.id === passageId);
    if (p) {
      const complete = getStepComplete(p).sort(stepCmp);
      var s = sections.find((s) => s.id === related(p, 'section'));
      if (s) {
        if (p.id !== state.passage.id || s.id !== state.section.id) {
          setState((state: ICtxState) => {
            return {
              ...state,
              passage: p as PassageD,
              section: s as SectionD,
              sharedResource: findRecord(
                memory,
                'sharedresource',
                related(p, 'sharedResource')
              ) as SharedResourceD,
              psgCompleted: [...complete],
            };
          });
        } else if (
          state.psgCompleted.length !== complete.length ||
          !state.psgCompleted
            .sort(stepCmp)
            .every((c, i) => shallowEqual(c, complete[i]))
        ) {
          setState((state: ICtxState) => ({
            ...state,
            psgCompleted: [...complete],
          }));
        }
      }
    }
  }, [
    memory,
    pasId,
    passages,
    sections,
    state.passage.id,
    state.psgCompleted,
    state.section.id,
  ]);

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

  useEffect(() => {
    if (blobState.blobStat === BlobStatus.FETCHED) {
      setState((state: ICtxState) => {
        return {
          ...state,
          loading: false,
          audioBlob: blobState.blob,
          playing: false,
        };
      });
      fetching.current = '';
    } else if (blobState.blobStat === BlobStatus.ERROR) {
      const errText = blobState?.error || 'Blob loading error';
      if (errText.startsWith('no offline file'))
        showMessage(sharedStr.fileNotFound);
      else showMessage(errText);
      logError(Severity.error, errorReporter, errText);
      setState((state: ICtxState) => {
        return {
          ...state,
          loading: false,
          audioBlob: undefined,
          playing: false,
        };
      });
      fetching.current = '';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blobState]);

  useEffect(() => {
    if (saveResult) {
      logError(Severity.error, errorReporter, saveResult);
      showMessage(saveResult);
      setSaveResult('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveResult]);

  useEffect(() => {
    const passageId =
      remoteIdGuid('passage', pasId ?? '', memory?.keyMap as RecordKeyMap) ||
      pasId ||
      '';
    const passRec = passages.find((p) => p.id === passageId);
    let psgId = undefined;
    if (related(passRec, 'sharedResource')) {
      const sr = findRecord(
        memory,
        'sharedresource',
        related(passRec, 'sharedResource')
      ) as SharedResourceD;
      psgId = related(sr, 'passage');
    }
    const allMedia = getAllMediaRecs(psgId ?? passageId, memory);
    const localize = {
      localizedCategory: localizedArtifactCategory,
      localizedType: localizedArtifactType,
    };
    getProjectResources().then((pres) => {
      let newData = mediaRows({
        artifactTypes,
        categories,
        userResources,
        mediafiles: allMedia.concat(pres) as MediaFileD[],
        user,
        ...localize,
      });

      const sectId = related(passRec, 'section');
      let res = getResources(sectionResources, mediafiles, sectId);
      newData = newData.concat(
        resourceRows({
          artifactTypes,
          categories,
          userResources,
          mediafiles,
          res,
          user,
          ...localize,
        }).sort((i, j) => i.sequenceNum - j.sequenceNum)
      );

      const mediafileId =
        newData.length > 0 && newData[0].isVernacular ? newData[0].id : '';
      var i = state.selected
        ? newData.findIndex((r) => r.mediafile.id === state.selected)
        : state.index;
      setState((state: ICtxState) => {
        return { ...state, rowData: newData, index: i, mediafileId };
      });

      if (
        state.tool !== ToolSlug.Resource &&
        state.tool !== ToolSlug.Transcribe &&
        mediafileId !== state.playerMediafile?.id
      ) {
        setSelected(mediafileId, PlayInPlayer.yes, newData);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionResources, mediafiles, pasId, userResources]);

  useEffect(() => {
    let delayedPlay: NodeJS.Timeout | undefined = undefined;
    //if I set playing when I set the mediaId, it plays a bit of the old
    //if not starting at the beginning set to playing after loaded
    if (state.playItem && mediaStart.current === undefined)
      delayedPlay = setTimeout(() => {
        setItemPlaying(true);
      }, 2000);

    return () => {
      if (delayedPlay) clearTimeout(delayedPlay);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.playItem]);

  useEffect(() => {
    if (plan && org && !getStepsBusy.current) {
      getStepsBusy.current = true;

      getFilteredSteps((wf) => {
        setState((state: ICtxState) => ({
          ...state,
          orgWorkflowSteps: wf,
        }));
        getStepsBusy.current = false;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan, orgWorkflowSteps, workflowSteps, org]);

  useEffect(() => {
    const wf: SimpleWf[] = state.orgWorkflowSteps.map((s) => ({
      id: s.id,
      label: s.attributes.name,
    }));
    setState((state: ICtxState) => ({ ...state, workflow: wf }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.orgWorkflowSteps]);

  useEffect(() => {
    if (state.currentstep === '' && state.orgWorkflowSteps.length > 0) {
      const next = getNextStep(state);
      if (state.currentstep !== next) {
        setCurrentStep(next);
      }
      segmentsCb.current = undefined;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentstep, state.psgCompleted, state.orgWorkflowSteps]);

  if (view.current !== '') {
    const target = view.current;
    view.current = '';
    return <StickyRedirect to={target} />;
  }

  return (
    <PassageDetailContext.Provider
      value={{
        state: {
          ...state,
          setSelected,
          setCurrentStep,
          setFirstStepIndex,
          setDiscussionSize,
          setPlayerSize,
          setChooserSize,
          setPlaying,
          setItemPlaying,
          setPlayItem,
          setCommentPlaying,
          setCommentPlayId,
          setPDBusy,
          getProjectResources,
          setCurrentSegment,
          getCurrentSegment,
          setPlayerSegments,
          setupLocate,
          stepComplete,
          setStepComplete,
          setStepCompleteTo,
          gotoNextStep,
          setRecording,
          setCommentRecording,
          setMediaSelected,
          toggleDone,
          handleItemPlayEnd,
          handleItemTogglePlay,
          handleCommentPlayEnd,
          handleCommentTogglePlay,
          handleOldVernacularPlayEnd,
          setDiscussionMarkers,
          handleHighlightDiscussion,
          forceRefresh,
          sectionArr: getProjectDefault(projDefSectionMap) ?? [],
        },
        setState,
      }}
    >
      {props.children}
      {/*this is only used to play old vernacular file segments*/}
      <LimitedMediaPlayer
        srcMediaId={state.oldVernacularPlayItem}
        requestPlay={state.oldVernacularPlaying}
        onEnded={handleOldVernacularPlayEnd}
        onLoaded={handleLoaded}
        limits={{ start: mediaStart.current, end: mediaEnd.current }}
      />
      {confirm !== '' && (
        <Confirm
          title={wfStr.unsaved}
          text={wfStr.saveFirst}
          yesResponse={handleConfirmStep}
          noResponse={handleRefuseStep}
        />
      )}
    </PassageDetailContext.Provider>
  );
};

export { PassageDetailContext, PassageDetailProvider };
