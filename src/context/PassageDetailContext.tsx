import React, { useState, useEffect, useRef } from 'react';
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
} from '../crud';
import { useOrgWorkflowSteps } from '../crud/useOrgWorkflowSteps';
import StickyRedirect from '../components/StickyRedirect';
import { loadBlob, logError, Severity, toCamel, useRemoteSave } from '../utils';
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
import Uploader, { IStatus } from '../components/Uploader';

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
  isResource: boolean;
  isComment: boolean;
}

interface SimpleWf {
  id: string;
  label: string;
}
interface StepComplete {
  stepid: string;
  complete: boolean;
  name: string; //don't use for querying.  For our readability only
}

const initState = {
  passage: {} as Passage,
  section: {} as Section,
  currentstep: '',
  orgWorkflowSteps: [] as OrgWorkflowStep[],
  setOrgWorkflowSteps: (steps: OrgWorkflowStep[]) => {},
  setCurrentStep: (step: string) => {}, //what the user is looking at
  index: 0, //row index?
  selected: '',
  setSelected: (selected: string) => {},
  playing: false, //vernacular in wavesurfer
  setPlaying: (playing: boolean) => {},
  mediaPlaying: false, //resource or comment
  setMediaPlaying: (playing: boolean) => {},
  playItem: '', //resource or comment
  rowData: Array<IRow>(),
  refresh: () => {},
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
  discussionSize: 500,
  setDiscussionSize: (size: number) => {},
  defaultFilename: '',
  uploadItem: '',
  showRecord: (
    defaultFilename: string,
    uploadItem: string,
    recordCb: (planId: string, MediaRemId?: string[]) => void
  ) => {},
  recordCb: (planId: string, MediaRemId?: string[]) => {},
  setSegments: (segments: string) => {},
  setupLocate: (cb?: (segments: string) => void) => {},
  getSegments: () => '',
  setPlayerSegments: (segments: string) => {},
  commentRecording: false,
  setCommentRecording: (commentRecording: boolean) => {},
  toolsChanged: [] as string[],
  toolChanged: (toolId: string, changed?: boolean, saveErr?: string) => {},
  toolSaveCompleted: (toolId: string, saveErr: string) => {},
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
    const { pasId } = useParams<ParamTypes>();
    const [memory] = useGlobal('memory');
    const [coordinator] = useGlobal('coordinator');
    const remote = coordinator.getSource('remote') as JSONAPISource;
    const [user] = useGlobal('user');
    const [errorReporter] = useGlobal('errorReporter');
    const [changed, setChanged] = useGlobal('changed');
    const [startSave, saveCompleted, waitForSave] = useRemoteSave();
    const [, setComplete] = useGlobal('progress');
    const [status] = useState<IStatus>({ canceled: false });
    const [confirm, setConfirm] = useState('');
    const [uploadVisible, setUploadVisible] = useState(false);
    const view = React.useRef('');
    const [, setRefreshed] = useState(0);
    const mediaUrlRef = useRef('');
    const { showMessage } = useSnackBar();
    const [, setTrackedTask] = useGlobal('trackedTask');
    const [state, setState] = useState({
      ...initState,
      allBookData,
    });
    const { fetchMediaUrl, mediaState } = useFetchMediaUrl(reporter);
    const fetching = useRef('');
    const segmentsRef = useRef('{}');
    const segmentsCb = useRef<(segments: string) => void>();
    const { GetOrgWorkflowSteps } = useOrgWorkflowSteps();
    const { localizedArtifactType } = useArtifactType();
    const { localizedArtifactCategory } = useArtifactCategory();
    const { localizedWorkStep } = useOrgWorkflowSteps();
    const getStepsBusy = useRef<boolean>(false);
    const saveErrRef = useRef('');
    const setOrgWorkflowSteps = (steps: OrgWorkflowStep[]) => {
      setState((state: ICtxState) => {
        return { ...state, orgWorkflowSteps: steps };
      });
    };

    const handleSetCurrentStep = (stepId: string) => {
      var step = state.orgWorkflowSteps.find((s) => s.id === stepId);
      setState((state: ICtxState) => {
        return { ...state, currentstep: stepId, playing: false };
      });
      if (step && getTool(step.attributes?.tool) !== ToolSlug.Resource) {
        //this does a bunch of stuff...don't just set it in the state above...
        if (
          state.rowData.length > 0 &&
          !state.rowData[0].isResource &&
          !state.rowData[0].isComment
        )
          setSelected(state.rowData[0].id);
        else setSelected('');
      }
      segmentsCb.current = undefined;
    };
    const setCurrentStep = (stepId: string) => {
      if (state.commentRecording) {
        showMessage(sharedStr.recordingInProgress);
      } else if (changed) {
        setConfirm(stepId);
      } else {
        handleSetCurrentStep(stepId);
      }
    };
    const handleConfirmStep = () => {
      startSave();
      waitForSave(() => {
        handleSetCurrentStep(confirm);
        setConfirm('');
      }, 400);
    };
    const handleRefuseStep = () => {
      saveCompleted('');
      handleSetCurrentStep(confirm);
      setConfirm('');
    };
    const setDiscussionSize = (discussionSize: number) => {
      setState((state: ICtxState) => {
        return { ...state, discussionSize };
      });
    };
    const toolSaveCompleted = (toolId: string, saveErr: string) => {
      toolChanged(toolId, false, saveErr);
    };
    const toolChanged = (
      toolId: string,
      changed: boolean = true,
      saveErr: string = ''
    ) => {
      var toolsChanged = [...state.toolsChanged];
      if (changed) toolsChanged.push(toolId);
      else {
        toolsChanged = toolsChanged.filter((c) => c !== toolId);
        if (saveErr) saveErrRef.current = `${saveErr};${saveErrRef.current}`;
      }
      setState((state: ICtxState) => {
        return { ...state, toolsChanged };
      });
      if (toolsChanged.length > 0) setChanged(true);
      else {
        saveCompleted(saveErrRef.current);
        saveErrRef.current = '';
      }
    };
    const setCommentRecording = (commentRecording: boolean) => {
      setState((state: ICtxState) => {
        return { ...state, commentRecording };
      });
    };

    //this is for the vernacular only
    const setPlaying = (playing: boolean) => {
      setState((state: ICtxState) => {
        return { ...state, playing: playing };
      });
    };
    const setMediaPlaying = (mediaPlaying: boolean) => {
      setState((state: ICtxState) => {
        return { ...state, mediaPlaying };
      });
    };
    const handlePlayEnd = () => {
      setMediaPlaying(false);
    };

    const setPDBusy = (busy: boolean) => {
      setState((state: ICtxState) => {
        return {
          ...state,
          pdBusy: busy,
        };
      });
    };

    const stepComplete = (stepid: string) => {
      stepid = remoteId('orgworkflowstep', stepid, memory.keyMap) || stepid;
      var step = state.psgCompleted.find((s) => s.stepid === stepid);
      return Boolean(step?.complete);
    };

    const setStepComplete = (stepid: string, complete: boolean) => {
      var completed = state.psgCompleted;
      var remId = remoteId('orgworkflowstep', stepid, memory.keyMap) || stepid;
      var step = state.psgCompleted.find((s) => s.stepid === remId);
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
          psgCompleted: [...completed],
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
            artifactTypes,
            categories,
            userResources,
            user,
            localizedCategory: localizedArtifactCategory,
            localizedType: localizedArtifactType,
          });
          i = newRows.length - 1;
        } else {
          setState((state: ICtxState) => {
            return {
              ...state,
              audioBlob: undefined,
              index: -1,
              selected,
              playing: false,
              mediaPlaying: false,
              playItem: '',
              loading: false,
            };
          });
          return;
        }
      }
      const r = rowData[i];
      if (state.index !== i || state.selected !== selected) {
        var resetBlob = false;
        //if this is a file that will be played in the wavesurfer..fetch it
        if (!r.isResource && !r.isComment) {
          if (
            mediaState.urlMediaId !== r.mediafile.id &&
            fetching.current !== r.mediafile.id
          ) {
            setTrackedTask(selected);
            fetching.current = r.mediafile.id;
            fetchMediaUrl({
              id: r.mediafile.id,
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
              mediaPlaying: false,
              loading: fetching.current !== '',
              rowData: newRows.length > 0 ? newRows : rowData,
            };
          });
        } else {
          setState((state: ICtxState) => {
            return {
              ...state,
              index: i,
              selected,
              playing: false, //going to play a comment or resource so turn off vernacular
              playItem: r.mediafile.id,
              mediaPlaying: false,
              rowData: newRows.length > 0 ? newRows : rowData,
            };
          });
        }
      }
    };
    const showRecord = (
      defaultFilename: string,
      uploadItem: any,
      recordCb: (planId: string, MediaRemId?: string[]) => void
    ) => {
      setState({ ...state, defaultFilename, uploadItem, recordCb });
      setUploadVisible(true);
    };

    const handleUploadVisible = (v: boolean) => {
      setUploadVisible(v);
    };

    const refresh = () => {
      setRefreshed((refreshed) => {
        return refreshed + 1;
      });
    };

    const setSegments = (segments: string) => {
      segmentsRef.current = segments;
    };

    const setupLocate = (cb?: (segments: string) => void) => {
      segmentsCb.current = cb;
    };

    const setPlayerSegments = (segments: string) => {
      if (segmentsCb.current) segmentsCb.current(segments);
    };

    const onePlace = (n: number) => (Math.round(n * 10) / 10).toFixed(1);

    const getSegments = () => {
      const segs = JSON.parse(segmentsRef.current);
      const region = segs.regions ? JSON.parse(segs.regions) : [];
      if (region.length > 0) {
        const start: number = region[0].start;
        const end: number = region[0].end;
        return `${onePlace(start)}-${onePlace(end)} `;
      }
      return '';
    };

    useEffect(() => {
      const passageId = remoteIdGuid('passage', pasId, memory.keyMap) || pasId;
      var p = passages.find((p) => p.id === passageId);
      if (p) {
        var complete = [] as StepComplete[];
        if (p.attributes.stepComplete) {
          var tmp = JSON.parse(p.attributes.stepComplete);
          if (tmp) complete = tmp.completed;
        }
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
        resourceRows({ ...props, res, user, ...localize })
      );
      const mediafileId =
        newData.length > 0 && !newData[0].isResource && !newData[0].isComment
          ? newData[0].id
          : '';
      setState((state: ICtxState) => {
        return { ...state, rowData: newData, mediafileId };
      });
      if (mediafileId) setSelected(mediafileId, newData);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sectionResources, mediafiles, pasId]);

    if (view.current !== '') {
      const target = view.current;
      view.current = '';
      return <StickyRedirect to={target} />;
    }
    useEffect(() => {
      //if I set playing when I set the mediaId, it plays a bit of the old
      if (state.playItem) setMediaPlaying(true);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.playItem]);

    useEffect(() => {
      var wf: SimpleWf[] = [];
      if (!getStepsBusy.current) {
        getStepsBusy.current = true;

        GetOrgWorkflowSteps({ process: 'ANY' }).then(
          (orgsteps: OrgWorkflowStep[]) => {
            setOrgWorkflowSteps(orgsteps);
            wf = orgsteps.map((s) => {
              return {
                id: s.id,
                label:
                  wfStr.getString(toCamel(s.attributes.name)) ||
                  s.attributes.name,
              };
            });
            setState((state: ICtxState) => ({ ...state, workflow: wf }));
            getStepsBusy.current = false;
          }
        );
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [workflowSteps, orgWorkflowSteps]);

    useEffect(() => {
      if (state.currentstep === '' && state.workflow.length > 0) {
        var nextIndex = 0;
        var lastcompleted = state.psgCompleted
          .filter((s) => s.complete)
          .map(
            (cs) =>
              findRecord(
                memory,
                'orgworkflowstep',
                remoteIdGuid('orgworkflowstep', cs.stepid, memory.keyMap) ||
                  cs.stepid
              ) as OrgWorkflowStep
          )
          .sort(
            (i, j) => j?.attributes?.sequencenum - i?.attributes?.sequencenum
          );

        if (lastcompleted.length) {
          var lastIndex = state.workflow.findIndex(
            (s) => s.id === lastcompleted[0].id
          );
          nextIndex =
            lastIndex + (lastIndex === state.workflow.length - 1 ? 0 : 1);
        }
        const next = state.workflow[nextIndex].id;
        if (state.currentstep !== next) {
          setCurrentStep(next);
        }
        segmentsCb.current = undefined;
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.currentstep, state.psgCompleted, state.workflow]);
    return (
      <PassageDetailContext.Provider
        value={{
          state: {
            ...state,
            setSelected,
            setOrgWorkflowSteps,
            setCurrentStep,
            setDiscussionSize,
            setPlaying,
            setMediaPlaying,
            setPDBusy,
            getSharedResources,
            showRecord,
            refresh,
            setSegments,
            getSegments,
            setPlayerSegments,
            setupLocate,
            stepComplete,
            setStepComplete,
            toolChanged,
            toolSaveCompleted,
            setCommentRecording,
          },
          setState,
        }}
      >
        {props.children}
        {(state.rowData[state.index]?.isResource ||
          state.rowData[state.index]?.isComment) && (
          <MediaPlayer
            auth={auth}
            srcMediaId={state.playItem}
            requestPlay={state.mediaPlaying}
            onEnded={handlePlayEnd}
          />
        )}
        <Uploader
          recordAudio={true}
          defaultFilename={state.defaultFilename}
          auth={auth}
          mediaId={state.uploadItem || ''}
          importList={undefined}
          isOpen={uploadVisible}
          onOpen={handleUploadVisible}
          showMessage={showMessage}
          setComplete={setComplete}
          multiple={false}
          finish={state.recordCb}
          status={status}
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
