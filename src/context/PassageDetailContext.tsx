import React, { useState, useEffect, useRef, useContext } from 'react';
// see: https://upmostly.com/tutorials/how-to-use-the-usecontext-hook-in-react
import { useGlobal } from 'reactn';
import { useParams } from 'react-router-dom';
import { shallowEqual } from 'react-redux';
import {
  IState,
  Plan,
  MediaFile,
  Resource,
  ISharedStrings,
  Passage,
  Section,
  BookName,
  OrgWorkflowStep,
  SectionResource,
  SectionResourceUser,
  ArtifactType,
  ArtifactCategory,
  WorkflowStep,
  IWorkflowStepsStrings,
  IPassageDetailStepCompleteStrings,
  StepComplete,
} from '../model';
import { withData } from 'react-orbitjs';
import { Operation, QueryBuilder, TransformBuilder } from '@orbit/data';
import {
  useFetchMediaUrl,
  remoteIdGuid,
  related,
  getAllMediaRecs,
  useArtifactCategory,
  useArtifactType,
  ArtifactTypeSlug,
  findRecord,
  remoteId,
  AddPassageStateChangeToOps,
  getTool,
  ToolSlug,
  getStepComplete,
  useFilteredSteps,
} from '../crud';
import { useOrgWorkflowSteps } from '../crud/useOrgWorkflowSteps';
import StickyRedirect from '../components/StickyRedirect';
import {
  loadBlob,
  logError,
  prettySegment,
  Severity,
  waitForIt,
} from '../utils';
import { useSnackBar } from '../hoc/SnackBar';
import * as actions from '../store';
import JSONAPISource from '@orbit/jsonapi';
import MediaPlayer from '../components/MediaPlayer';
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

export const getPlanName = (plan: Plan) => {
  return plan.attributes ? plan.attributes.name : '';
};
export enum PlayInPlayer {
  no = 0,
  yes = 1,
  tryAgain = 2,
}

interface IRecordProps {
  passages: Passage[];
  sections: Section[];
  mediafiles: MediaFile[];
  sectionResources: SectionResource[];
  userResources: SectionResourceUser[];
  artifactTypes: ArtifactType[];
  categories: ArtifactCategory[];
  workflowSteps: WorkflowStep[];
  orgWorkflowSteps: OrgWorkflowStep[];
}

const mapRecordsToProps = {
  passages: (q: QueryBuilder) => q.findRecords('passage'),
  sections: (q: QueryBuilder) => q.findRecords('section'),
  mediafiles: (q: QueryBuilder) => q.findRecords('mediafile'),
  sectionResources: (q: QueryBuilder) => q.findRecords('sectionresource'),
  userResources: (q: QueryBuilder) => q.findRecords('sectionresourceuser'),
  artifactTypes: (q: QueryBuilder) => q.findRecords('artifacttype'),
  categories: (q: QueryBuilder) => q.findRecords('artifactcategory'),
  workflowSteps: (q: QueryBuilder) => q.findRecords('workflowstep'),
  orgWorkflowSteps: (q: QueryBuilder) => q.findRecords('orgworkflowstep'),
};

export interface IRow {
  id: string;
  sequenceNum: number;
  version: number;
  mediafile: MediaFile;
  playItem: string;
  artifactName: string;
  artifactType: string;
  artifactCategory: string;
  done: boolean;
  editAction: JSX.Element | null;
  resource: SectionResource | null;
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
  passage: {} as Passage,
  section: {} as Section,
  currentstep: '',
  orgWorkflowSteps: [] as OrgWorkflowStep[],
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
  getSharedResources: async () => [] as Resource[],
  getProjectResources: async () => [] as MediaFile[],
  workflow: Array<SimpleWf>(),
  psgCompleted: [] as StepComplete[],
  setStepComplete: (stepId: string, complete: boolean) => {},
  stepComplete: (stepId: string) => {
    return false;
  },
  discussionSize: { width: 450, height: 900 },
  playerSize: 280,
  setDiscussionSize: (size: { width: number; height: number }) => {},
  setPlayerSize: (size: number) => {},
  defaultFilename: '',
  uploadItem: '',
  recordCb: (planId: string, MediaRemId?: string[]) => {},
  currentSegment: '',
  currentSegmentIndex: -1,
  setCurrentSegment: (segment: IRegion | undefined, index: number) => {}, //replace the above two
  setupLocate: (cb?: (segments: string) => void) => {},
  getCurrentSegment: () => undefined as IRegion | undefined,
  setPlayerSegments: (segments: string) => {},
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
  forceRefresh: () => {},
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
const PassageDetailProvider = withData(mapRecordsToProps)(
  (props: IProps & IRecordProps) => {
    const [reporter] = useGlobal('errorReporter');
    const { passages, sections, sectionResources, mediafiles } = props;
    const { artifactTypes, categories, userResources } = props;
    const { workflowSteps, orgWorkflowSteps } = props;
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
    const [memory] = useGlobal('memory');
    const [coordinator] = useGlobal('coordinator');
    const remote = coordinator.getSource('remote') as JSONAPISource;
    const [user] = useGlobal('user');
    const [org] = useGlobal('organization');
    const [errorReporter] = useGlobal('errorReporter');
    const [saveResult, setSaveResult] = useGlobal('saveResult');
    const [confirm, setConfirm] = useState('');
    const view = React.useRef('');
    const mediaUrlRef = useRef('');
    const { showMessage } = useSnackBar();
    const [state, setState] = useState({
      ...initState,
      allBookData,
      wfStr,
      prjId: prjId ?? '',
    });
    const { fetchMediaUrl, mediaState } = useFetchMediaUrl(reporter);
    const fetching = useRef('');
    const segmentsCb = useRef<(segments: string) => void>();
    const getFilteredSteps = useFilteredSteps();
    const { localizedArtifactType, getTypeId } = useArtifactType();
    const { localizedArtifactCategory } = useArtifactCategory();
    const { localizedWorkStep } = useOrgWorkflowSteps();
    const getStepsBusy = useRef<boolean>(false);
    const [changed] = useGlobal('changed');
    const mediaStart = useRef<number | undefined>();
    const mediaEnd = useRef<number | undefined>();
    const mediaPosition = useRef<number | undefined>();
    const currentSegmentRef = useRef<IRegion | undefined>();
    const { startSave, clearChanged, waitForSave } =
      useContext(UnsavedContext).state;
    const [plan] = useGlobal('plan');
    const highlightRef = useRef<number>();
    const refreshRef = useRef<number>(0);
    const settingSegmentRef = useRef(false);
    const inPlayerRef = useRef<string>();

    const handleSetCurrentStep = (stepId: string) => {
      var step = state.orgWorkflowSteps.find((s) => s.id === stepId);
      setCurrentSegment(undefined, 0);
      setState((state: ICtxState) => {
        return {
          ...state,
          currentstep: stepId,
          playing: false,
          itemPlaying: false,
          commentPlaying: false,
          playItem: '',
          commentPlayId: '',
        };
      });

      var tool = getTool(step?.attributes?.tool) as ToolSlug;
      if (step && tool !== ToolSlug.Resource && tool !== ToolSlug.Transcribe) {
        //this does a bunch of stuff...don't just set it in the state above...
        if (state.rowData.length > 0 && state.rowData[0].isVernacular)
          setSelected(state.rowData[0].id, PlayInPlayer.yes);
        else setSelected('', PlayInPlayer.yes);
      }
      segmentsCb.current = undefined;
    };
    const forceRefresh = () => {
      refreshRef.current = refreshRef.current + 1;
      setState((state: ICtxState) => {
        return { ...state, refresh: refreshRef.current };
      });
    };
    const setCurrentStep = (stepId: string) => {
      if (changed) {
        setConfirm(stepId);
      } else {
        handleSetCurrentStep(stepId);
      }
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
      clearChanged();
      handleSetCurrentStep(confirm);
      setConfirm('');
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

    const setCommentRecording = (commentRecording: boolean) => {
      setState((state: ICtxState) => {
        return { ...state, commentRecording };
      });
    };

    //this is for the PD Player only
    const setPlaying = (playing: boolean) => {
      if (playing !== state.playing) {
        setState((state: ICtxState) => {
          return {
            ...state,
            playing,
            itemPlaying: playing ? false : state.itemPlaying,
            commentPlaying: playing ? false : state.commentPlaying,
            oldVernacularPlaying: playing ? false : state.oldVernacularPlaying,
            oldVernacularPlayItem: playing ? '' : state.oldVernacularPlayItem,
            oldVernacularStart: playing ? 0 : state.oldVernacularStart,
          };
        });
      }
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
            oldVernacularPlayItem: itemPlaying
              ? ''
              : state.oldVernacularPlayItem,
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
          return { ...state, refresh: refreshRef.current };
        });
      } else settingSegmentRef.current = false;
    };
    const stepComplete = (stepid: string) => {
      stepid = remoteId('orgworkflowstep', stepid, memory.keyMap) || stepid;
      var step = state.psgCompleted.find((s) => s.stepid === stepid);
      return Boolean(step?.complete);
    };

    const setStepComplete = (stepid: string, complete: boolean) => {
      var completed = [...state.psgCompleted];
      var remId = remoteId('orgworkflowstep', stepid, memory.keyMap) || stepid;
      var step = completed.find((s) => s.stepid === remId);
      var rec = findRecord(
        memory,
        'orgworkflowstep',
        stepid
      ) as OrgWorkflowStep;
      if (step) {
        step.complete = complete;
      } else {
        completed.push({ stepid: remId, complete, name: rec.attributes.name });
      }
      setState((state: ICtxState) => {
        return {
          ...state,
          psgCompleted: completed,
        };
      });
      const recId = {
        type: 'passage',
        id: remoteIdGuid('passage', pasId ?? '', memory.keyMap) || pasId || '',
      };
      var tb = new TransformBuilder();
      var ops = [] as Operation[];
      ops.push(
        tb.replaceAttribute(
          recId,
          'stepComplete',
          JSON.stringify({ completed })
        )
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
      memory.update(ops);
    };

    const getSharedResources = async () => {
      if (remote)
        return (await remote.query((q: QueryBuilder) =>
          q.findRecords('resource')
        )) as Resource[];
      else return [] as Resource[];
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
          fetchMediaUrl({
            id: '',
          });
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
      //we've gotten a 403 and requeried so selected hasn't changed
      if (inPlayer === PlayInPlayer.tryAgain)
        inPlayer =
          state.playerMediafile?.id === r.mediafile.id
            ? PlayInPlayer.yes
            : PlayInPlayer.no;
      //if this is a file that will be played in the wavesurfer..fetch it
      if (inPlayer === PlayInPlayer.yes) {
        inPlayerRef.current = r.mediafile.id;
        if (
          mediaState.id !== r.mediafile.id &&
          fetching.current !== r.mediafile.id
        ) {
          fetching.current = r.mediafile.id;
          fetchMediaUrl({
            id: r.mediafile.id,
          });
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
      } else if (mediaStart.current !== undefined) {
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

    const handleDuration = (duration: number) => {
      if (mediaStart.current !== undefined) {
        mediaPosition.current = mediaStart.current;
        mediaStart.current = undefined;
        setState((state: ICtxState) => {
          return {
            ...state,
            oldVernacularPlaying: true,
          };
        });
      }
    };

    const handlePosition = (position: number) => {
      if (mediaEnd.current) {
        if (position >= mediaEnd.current) {
          oldVernReset();
        }
      }
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
      if (
        !settingSegmentRef.current &&
        segment?.start !== highlightRef.current
      ) {
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
    };

    const getCurrentSegment = () => {
      return currentSegmentRef.current;
    };

    useEffect(() => {
      const passageId =
        remoteIdGuid('passage', pasId ?? '', memory.keyMap) || pasId || '';
      var p = passages.find((p) => p.id === passageId);
      if (p) {
        const complete = getStepComplete(p);
        var s = sections.find((s) => s.id === related(p, 'section'));
        if (s) {
          if (p.id !== state.passage.id || s.id !== state.section.id) {
            setState((state: ICtxState) => {
              return {
                ...state,
                passage: p as Passage,
                section: s as Section,
                psgCompleted: [...complete],
              };
            });
          } else if (
            JSON.stringify(state.psgCompleted) !== JSON.stringify(complete)
          ) {
            setState((state: ICtxState) => ({
              ...state,
              psgCompleted: [...complete],
            }));
          }
        }
      }
    }, [
      memory.keyMap,
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
      if (mediaState.url) {
        mediaUrlRef.current = mediaState.url;
        fetching.current = '';
        try {
          loadBlob(mediaState.url, (urlOrError, b) => {
            if (!b) {
              if (urlOrError.includes('403')) {
                //force requery for new media url
                fetchMediaUrl({
                  id: '',
                });
                waitForIt(
                  'requery url',
                  () => mediaState.id === '',
                  () => false,
                  500
                ).then(() => {
                  setSelected(state.selected, PlayInPlayer.tryAgain);
                });
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
            if (b.type !== 'text/html' && b.type !== 'application/xml') {
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
      if (saveResult) {
        logError(Severity.error, errorReporter, saveResult);
        showMessage(saveResult);
        setSaveResult('');
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [saveResult]);

    useEffect(() => {
      const passageId =
        remoteIdGuid('passage', pasId ?? '', memory.keyMap) || pasId || '';
      const allMedia = getAllMediaRecs(passageId, memory);
      const localize = {
        localizedCategory: localizedArtifactCategory,
        localizedType: localizedArtifactType,
      };
      getProjectResources().then((pres) => {
        let newData = mediaRows({
          ...props,
          mediafiles: allMedia.concat(pres),
          user,
          ...localize,
        });
        const passRec = passages.find((p) => p.id === passageId);
        const sectId = related(passRec, 'section');
        let res = getResources(sectionResources, mediafiles, sectId);
        newData = newData.concat(
          resourceRows({ ...props, res, user, ...localize }).sort((i, j) =>
            i.done === j.done ? i.sequenceNum - j.sequenceNum : i.done ? 1 : -1
          )
        );

        const mediafileId =
          newData.length > 0 && newData[0].isVernacular ? newData[0].id : '';
        var i = state.selected
          ? newData.findIndex((r) => r.mediafile.id === state.selected)
          : state.index;
        setState((state: ICtxState) => {
          return { ...state, rowData: newData, index: i, mediafileId };
        });

        if (mediafileId && state.index === 0)
          setSelected(mediafileId, PlayInPlayer.yes, newData);
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
      if (!getStepsBusy.current) {
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
            setPlaying,
            setItemPlaying,
            setPlayItem,
            setCommentPlaying,
            setCommentPlayId,
            setPDBusy,
            getSharedResources,
            getProjectResources,
            setCurrentSegment,
            getCurrentSegment,
            setPlayerSegments,
            setupLocate,
            stepComplete,
            setStepComplete,
            setCommentRecording,
            setMediaSelected,
            handleItemPlayEnd,
            handleItemTogglePlay,
            handleCommentPlayEnd,
            handleCommentTogglePlay,
            handleOldVernacularPlayEnd,
            setDiscussionMarkers,
            handleHighlightDiscussion,
            forceRefresh,
          },
          setState,
        }}
      >
        {props.children}
        {/*this is only used to play old vernacular file segments*/}
        <MediaPlayer
          srcMediaId={state.oldVernacularPlayItem}
          requestPlay={state.oldVernacularPlaying}
          onEnded={handleOldVernacularPlayEnd}
          onDuration={handleDuration}
          onPosition={handlePosition}
          position={mediaPosition.current}
        />
        {confirm !== '' && (
          <Confirm
            open={true}
            onClose={handleRefuseStep}
            title={wfStr.unsaved}
            text={wfStr.saveFirst}
            yesResponse={handleConfirmStep}
            noResponse={handleRefuseStep}
          />
        )}
      </PassageDetailContext.Provider>
    );
  }
);

export { PassageDetailContext, PassageDetailProvider };
