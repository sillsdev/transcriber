import React, { useState, useEffect, useRef, useContext } from 'react';
// see: https://upmostly.com/tutorials/how-to-use-the-usecontext-hook-in-react
import { useGlobal } from 'reactn';
import { useParams } from 'react-router-dom';
import { connect } from 'react-redux';
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
import localStrings from '../selector/localize';
import { withData } from '../mods/react-orbitjs';
import { Operation, QueryBuilder, TransformBuilder } from '@orbit/data';
import {
  useFetchMediaUrl,
  remoteIdGuid,
  related,
  getAllMediaRecs,
  useArtifactCategory,
  useArtifactType,
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
import { loadBlob, logError, prettySegment, Severity } from '../utils';
import Auth from '../auth/Auth';
import { useSnackBar } from '../hoc/SnackBar';
import * as actions from '../store';
import { bindActionCreators } from 'redux';
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

export const getPlanName = (plan: Plan) => {
  return plan.attributes ? plan.attributes.name : '';
};

interface IStateProps {
  wfStr: IWorkflowStepsStrings;
  sharedStr: ISharedStrings;
  stepCompleteStr: IPassageDetailStepCompleteStrings;
  allBookData: BookName[];
  booksLoaded: boolean;
  lang: string;
}
const mapStateToProps = (state: IState): IStateProps => ({
  wfStr: localStrings(state, { layout: 'workflowSteps' }),
  sharedStr: localStrings(state, { layout: 'shared' }),
  stepCompleteStr: localStrings(state, { layout: 'passageDetailStepComplete' }),
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
  isVernacular: boolean;
  isResource: boolean;
  isComment: boolean;
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
  selected: '',
  setSelected: (selected: string) => {},
  setMediaSelected: (id: string, start: number, end: number) => {},
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
  rowData: Array<IRow>(),
  sharedStr: {} as ISharedStrings,
  mediafileId: '',
  loading: false,
  audioBlob: undefined as Blob | undefined,
  pdBusy: false,
  setPDBusy: (pdBusy: boolean) => {},
  allBookData: Array<BookName>(),
  getSharedResources: async () => [] as Resource[],
  workflow: Array<SimpleWf>(),
  psgCompleted: [] as StepComplete[],
  setStepComplete: (stepId: string, complete: boolean) => {},
  stepComplete: (stepId: string) => {
    return false;
  },
  discussionSize: { width: 450, height: 700 },
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
};

export type ICtxState = typeof initState;

interface IContext {
  state: ICtxState;
  setState: React.Dispatch<React.SetStateAction<ICtxState>>;
}

const PassageDetailContext = React.createContext({} as IContext);

interface IProps extends IStateProps, IDispatchProps, IRecordProps {
  children: React.ReactElement;
  auth: Auth;
}
interface ParamTypes {
  prjId: string;
  pasId: string;
  mediaId: string;
}
const PassageDetailProvider = withData(mapRecordsToProps)(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )((props: IProps) => {
    const [reporter] = useGlobal('errorReporter');
    const { auth, passages, sections, sectionResources, mediafiles } = props;
    const { artifactTypes, categories, userResources } = props;
    const { workflowSteps, orgWorkflowSteps } = props;
    const { wfStr, sharedStr, stepCompleteStr } = props;
    const { lang, allBookData, fetchBooks, booksLoaded } = props;
    const { pasId, prjId } = useParams<ParamTypes>();
    const [memory] = useGlobal('memory');
    const [coordinator] = useGlobal('coordinator');
    const remote = coordinator.getSource('remote') as JSONAPISource;
    const [user] = useGlobal('user');
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
      prjId,
    });
    const { fetchMediaUrl, mediaState } = useFetchMediaUrl(reporter);
    const fetching = useRef('');
    const segmentsCb = useRef<(segments: string) => void>();
    const getFilteredSteps = useFilteredSteps();
    const { localizedArtifactType } = useArtifactType();
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
    const [oldVernacularPlayItem, setOldVernacularPlayItem] = useState('');
    const [oldVernacularPlaying, setOldVernacularPlaying] = useState(false);
    const highlightRef = useRef<number>();
    const refreshRef = useRef<number>(0);
    const settingSegmentRef = useRef(false);
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
      if (step && getTool(step.attributes?.tool) !== ToolSlug.Resource) {
        //this does a bunch of stuff...don't just set it in the state above...
        if (state.rowData.length > 0 && state.rowData[0].isVernacular)
          setSelected(state.rowData[0].id);
        else setSelected('');
      }
      segmentsCb.current = undefined;
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

    //this is for the vernacular only
    const setPlaying = (playing: boolean) => {
      if (playing !== state.playing) {
        setState((state: ICtxState) => {
          return {
            ...state,
            playing,
            itemPlaying: playing ? false : state.itemPlaying,
            commentPlaying: playing ? false : state.commentPlaying,
          };
        });
        if (playing) setOldVernacularPlayItem('');
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
          };
        });
        if (itemPlaying) setOldVernacularPlayItem('');
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
          };
        });
        if (commentPlaying) setOldVernacularPlayItem('');
      }
    };

    const handleItemPlayEnd = () => {
      setItemPlaying(false);
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
    const handleOldVernacularPlayEnd = () => setOldVernacularPlayItem('');
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
        id: remoteIdGuid('passage', pasId, memory.keyMap) || pasId,
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

    const setSelected = (selected: string, rowData: IRow[] = state.rowData) => {
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
          setOldVernacularPlaying(false);
          setState((state: ICtxState) => {
            return {
              ...state,
              audioBlob: undefined,
              index: -1,
              selected,
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
      if (r.isVernacular && i === 0) {
        if (
          mediaState.id !== r.mediafile.id &&
          fetching.current !== r.mediafile.id
        ) {
          fetching.current = r.mediafile.id;
          fetchMediaUrl({
            id: r.mediafile.id,
            auth: props.auth,
          });
          resetBlob = true;
        }
        currentSegmentRef.current = undefined;
        setState((state: ICtxState) => {
          return {
            ...state,
            audioBlob: resetBlob ? undefined : state.audioBlob,
            index: i,
            selected,
            playing: false,
            loading: fetching.current !== '',
            rowData: newRows.length > 0 ? newRows : rowData,
            currentSegment: '',
            currentSegmentIndex: 0,
          };
        });
      } else if (r.isVernacular) {
        //play just the segment of an old one
        setOldVernacularPlayItem(r.mediafile.id);
        setState((state: ICtxState) => {
          return {
            ...state,
            index: i,
            selected,
            playing: false,
            commentPlaying: false,
            itemPlaying: false,
            rowData: newRows.length > 0 ? newRows : rowData,
          };
        });
      } else if (r.isComment) {
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
      setOldVernacularPlayItem('');
    };
    const setMediaSelected = (id: string, start: number, end: number) => {
      mediaStart.current = start;
      mediaEnd.current = end;
      setSelected(id, state.rowData);
    };
    const handleDuration = (duration: number) => {
      if (mediaStart.current) {
        mediaPosition.current = mediaStart.current;
        mediaStart.current = undefined;
        setOldVernacularPlaying(true);
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
      const passageId = remoteIdGuid('passage', pasId, memory.keyMap) || pasId;
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
      if (saveResult) {
        logError(Severity.error, errorReporter, saveResult);
        showMessage(saveResult);
        setSaveResult('');
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [saveResult]);

    useEffect(() => {
      const passageId = remoteIdGuid('passage', pasId, memory.keyMap) || pasId;
      const allMedia = getAllMediaRecs(passageId, memory);
      const localize = {
        localizedCategory: localizedArtifactCategory,
        localizedType: localizedArtifactType,
      };
      let newData = mediaRows({
        ...props,
        mediafiles: allMedia,
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
      setState((state: ICtxState) => {
        return { ...state, rowData: newData, mediafileId };
      });
      if (mediafileId) setSelected(mediafileId, newData);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sectionResources, mediafiles, pasId, userResources]);

    if (view.current !== '') {
      const target = view.current;
      view.current = '';
      return <StickyRedirect to={target} />;
    }
    useEffect(() => {
      //if I set playing when I set the mediaId, it plays a bit of the old
      if (state.playItem) setItemPlaying(true);
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
    }, [plan, orgWorkflowSteps, workflowSteps]);

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
            setDiscussionMarkers,
            handleHighlightDiscussion,
          },
          setState,
        }}
      >
        {props.children}
        {/*this is only used to play old vernacular file segments*/}
        <MediaPlayer
          auth={auth}
          srcMediaId={oldVernacularPlayItem}
          requestPlay={oldVernacularPlaying}
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
  })
);

export { PassageDetailContext, PassageDetailProvider };
