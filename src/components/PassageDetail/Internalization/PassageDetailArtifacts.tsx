import { useState, useContext, useMemo, useRef, useEffect } from 'react';
import { useGetGlobal, useGlobal } from '../../../context/GlobalContext';
import {
  IPassageDetailArtifactsStrings,
  Passage,
  Section,
  MediaFileD,
  SectionResourceD,
  MediaFile,
  ArtifactType,
  Resource,
  SheetLevel,
  ISharedStrings,
} from '../../../model';
import { arrayMoveImmutable as arrayMove } from 'array-move';
import { PlayInPlayer } from '../../../context/PassageDetailContext';
import { useSnackBar } from '../../../hoc/SnackBar';
import Uploader from '../../Uploader';
import AddResource from './AddResource';
import SortableHeader from './SortableHeader';
import { IRow } from '../../../context/PassageDetailContext';
import { AltButton } from '../../../control';
import { AIGenerated, SortableItem } from '.';
import {
  remoteIdGuid,
  useSecResCreate,
  useMediaResCreate,
  useSecResUpdate,
  useSecResDelete,
  related,
  useSecResUserCreate,
  useSecResUserRead,
  useSecResUserDelete,
  useOrganizedBy,
  findRecord,
  useArtifactCategory,
  IArtifactCategory,
  ArtifactCategoryType,
  mediaFileName,
  usePlanType,
} from '../../../crud';
import BigDialog, { BigDialogBp } from '../../../hoc/BigDialog';
import MediaDisplay from '../../MediaDisplay';
import SelectSharedResource from './SelectSharedResource';
import SelectProjectResource from './SelectProjectResource';
import SelectSections from './SelectSections';
import ResourceData from './ResourceData';
import { MarkDownType, UploadType, UriLinkType } from '../../MediaUpload';
import LimitedMediaPlayer from '../../LimitedMediaPlayer';
import {
  Badge,
  Box,
  BoxProps,
  Grid,
  Stack,
  styled,
  Typography,
} from '@mui/material';
import { ReplaceRelatedRecord } from '../../../model/baseModel';
import { PassageResourceButton } from './PassageResourceButton';
import ProjectResourceConfigure from './ProjectResourceConfigure';
import { useProjectResourceSave } from './useProjectResourceSave';
import { UnsavedContext } from '../../../context/UnsavedContext';
import Confirm from '../../AlertDialog';
import {
  getSegments,
  NamedRegions,
  removeExtension,
  isVisual,
  isUrl,
} from '../../../utils';
import { useOrbitData } from '../../../hoc/useOrbitData';
import {
  RecordIdentity,
  RecordKeyMap,
  RecordTransformBuilder,
} from '@orbit/records';
import { shallowEqual, useSelector } from 'react-redux';
import {
  passageDetailArtifactsSelector,
  sharedSelector,
} from '../../../selector';
import { passageTypeFromRef } from '../../../control/RefRender';
import { PassageTypeEnum } from '../../../model/passageType';
import { VertListDnd } from '../../../hoc/VertListDnd';
import usePassageDetailContext from '../../../context/usePassageDetailContext';
import { LaunchLink } from '../../../control/LaunchLink';
import FindTabs from './FindTabs';
import { storedCompareKey } from '../../../utils/storedCompareKey';
import { mediaContentType } from '../../../utils/contentType';
import { useStepPermissions } from '../../../utils/useStepPermission';
import FindBibleBrain from './FindBibleBrain';
import { useHandleLink } from './addLinkKind';
import { usePassageRef } from './usePassageRef';
import { MarkDownView } from '../../../control/MarkDownView';

const MediaContainer = styled(Box)<BoxProps>(({ theme }) => ({
  marginRight: theme.spacing(2),
  marginTop: theme.spacing(1),
  width: '100%',
  '& audio': {
    height: '40px',
    display: 'flex',
    width: 'inherit',
  },
}));

export enum ResourceTypeEnum {
  sectionResource,
  passageResource,
  projectResource,
}
export function PassageDetailArtifacts() {
  const sectionResources = useOrbitData<SectionResourceD[]>('sectionresource');
  const mediafiles = useOrbitData<MediaFile[]>('mediafile');
  const artifactTypes = useOrbitData<ArtifactType[]>('artifacttype');
  const [memory] = useGlobal('memory');
  const [busy, setBusy] = useGlobal('importexportBusy'); //verified this is not used in a function 2/18/25
  const [remoteBusy] = useGlobal('remoteBusy'); //verified this is not used in a function 2/18/25
  const [offline] = useGlobal('offline'); //verified this is not used in a function 2/18/25
  const [offlineOnly] = useGlobal('offlineOnly'); //will be constant here
  const [, setComplete] = useGlobal('progress');
  const {
    rowData,
    section,
    passage,
    setSelected,
    playItem,
    setPlayItem,
    setMediaSelected,
    itemPlaying,
    setItemPlaying,
    currentstep,
    toggleDone,
    forceRefresh,
    handleItemPlayEnd,
    handleItemTogglePlay,
    getProjectResources,
  } = usePassageDetailContext();
  const { getOrganizedBy } = useOrganizedBy();
  const { AddSectionResource } = useSecResCreate(section);
  const AddSectionResourceUser = useSecResUserCreate();
  const ReadSectionResourceUser = useSecResUserRead();
  const RemoveSectionResourceUser = useSecResUserDelete();
  const AddMediaFileResource = useMediaResCreate(passage, currentstep);
  const UpdateSectionResource = useSecResUpdate();
  const DeleteSectionResource = useSecResDelete();
  const { getArtifactCategorys } = useArtifactCategory();
  const catRef = useRef<IArtifactCategory[]>([]);
  const [uploadVisible, setUploadVisible] = useState(false);
  const [aiGenerated, setAIGenerated] = useState(false);
  const [findOpen, setFindOpen] = useState(false);
  const [visual, setVisual] = useState(false);
  const [sortKey, setSortKey] = useState(0);
  const cancelled = useRef(false);
  const [displayId, setDisplayId] = useState('');
  const [link, setLink] = useState<string>();
  const [markDown, setMarkDoan] = useState('');
  const [audioScriptureVisible, setAudioScriptureVisible] = useState(false);
  const [nonAudio, setNonAudio] = useState(false);
  const [sharedResourceVisible, setSharedResourceVisible] = useState(false);
  const [projectResourceVisible, setProjectResourceVisible] = useState(false);
  const [projResPassageVisible, setProjResPassageVisible] = useState(false);
  const [projResWizVisible, setProjResWizVisible] = useState(false);
  const [projResSetup, setProjResSetup] = useState(new Array<MediaFileD>());
  const [editResource, setEditResource] = useState<
    SectionResourceD | undefined
  >();
  const [allowEditSave, setAllowEditSave] = useState(false);
  const [artifactState] = useState<{ id?: string | null }>({});
  // const [artifactTypeId, setArtifactTypeId] = useState<string>();
  const [uploadType, setUploadType] = useState<UploadType>(UploadType.Resource);
  const [initDescription, setInitDescription] = useState<string>('');
  const [recordAudio, setRecordAudio] = useState<boolean>(false);
  const mediaRef = useRef<MediaFileD>();
  const textRef = useRef<string>();
  const catIdRef = useRef<string>();
  const descriptionRef = useRef<string>('');

  const resourceTypeRef = useRef<ResourceTypeEnum>(
    ResourceTypeEnum.sectionResource
  );
  const projIdentRef = useRef<RecordIdentity[]>([]);
  const projMediaRef = useRef<MediaFileD>();
  const [allResources, setAllResources] = useState(false);
  const { showMessage } = useSnackBar();
  const [confirm, setConfirm] = useState('');
  const { waitForSave } = useContext(UnsavedContext).state;
  const [mediaStart, setMediaStart] = useState<number | undefined>();
  const [mediaEnd, setMediaEnd] = useState<number | undefined>();
  const [performedBy, setPerformedBy] = useState('');
  const [markdownValue, setMarkdownValue] = useState('');
  const projectResourceSave = useProjectResourceSave();
  const { removeKey } = storedCompareKey(passage, section);
  const [plan] = useGlobal('plan'); //will be constant here
  const planType = usePlanType();
  const t: IPassageDetailArtifactsStrings = useSelector(
    passageDetailArtifactsSelector,
    shallowEqual
  );
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);
  const { canDoSectionStep } = useStepPermissions();
  const hasPermission = canDoSectionStep(currentstep, section);
  const [biblebrainClose, setBiblebrainClose] = useState(false);
  const getGlobal = useGetGlobal();
  const handleLink = useHandleLink({ passage, setLink });
  const { passageRef } = usePassageRef();

  const resourceType = useMemo(() => {
    const resourceType = artifactTypes.find(
      (t) =>
        t.attributes?.typename === 'resource' &&
        Boolean(t?.keys?.remoteId) === !offlineOnly
    );
    // setArtifactTypeId(resourceType?.id);
    artifactState.id = resourceType?.id || null;
    return resourceType?.id;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artifactTypes, offlineOnly]);

  const otherResourcesAvailable = useMemo(
    () => rowData.some((r) => r.passageId && r.passageId !== passage.id),
    [passage, rowData]
  );

  const handleNonAudio = (value: boolean) => setNonAudio(value);

  const isPassageResource = () =>
    resourceTypeRef.current === ResourceTypeEnum.passageResource;
  const isProjectResource = () =>
    resourceTypeRef.current === ResourceTypeEnum.projectResource;

  const projResourceType = useMemo(() => {
    const resourceType = artifactTypes.find(
      (t) =>
        t.attributes?.typename === 'projectresource' &&
        Boolean(t?.keys?.remoteId) === !offlineOnly
    );
    return resourceType?.id;
  }, [artifactTypes, offlineOnly]);

  const handlePlay = (id: string) => {
    if (id === playItem) {
      setItemPlaying(!itemPlaying);
    } else {
      const row = rowData.find((r) => r.id === id);
      if (row) {
        const segs = getSegments(
          NamedRegions.ProjectResource,
          row.mediafile.attributes.segments
        );
        const regions = JSON.parse(segs);
        if (regions.length > 0) {
          const { start, end } = regions[0];
          setMediaStart(start);
          setMediaEnd(end);
          setMediaSelected(id, start, end);
          return;
        } else {
          setMediaStart(undefined);
          setMediaEnd(undefined);
        }
      }
      setSelected(id, PlayInPlayer.no);
    }
  };

  const handleDisplayId = (id: string) => {
    setDisplayId(id);
  };

  const handleFinish = () => {
    setDisplayId('');
  };

  const handleLinkId = (id: string) => {
    setLink(
      rowData.find((r) => r.id === id)?.mediafile?.attributes?.originalFile
    );
  };

  const handleMarkDownId = (id: string) => {
    setMarkDoan(
      rowData.find((r) => r.id === id)?.mediafile?.attributes?.originalFile ??
        ''
    );
  };

  const handleDone = async (id: string, res: SectionResourceD | null) => {
    if (!res) return;
    const rec = await ReadSectionResourceUser(res);
    if (rec !== null) {
      await RemoveSectionResourceUser(res, rec);
    } else {
      await AddSectionResourceUser(res);
    }
    toggleDone(id);
    setTimeout(() => {
      setBusy(true);
      forceRefresh();
      setTimeout(() => setBusy(false), 500);
    }, 500);
  };

  const handleDelete = (id: string) => setConfirm(id);
  const handleDeleteRefused = () => setConfirm('');
  const handleDeleteConfirmed = () => {
    setBusy(true);
    const secRes = sectionResources.find(
      (r) => related(r, 'mediafile') === confirm
    );
    if (secRes) {
      removeKey(related(secRes, 'mediafile'));
      DeleteSectionResource(secRes);
    }
    setConfirm('');
    setBusy(false);
  };
  const handleUploadVisible = (v: boolean) => {
    setUploadVisible(v);
  };

  const handleFindVisible = (v: boolean) => {
    setFindOpen(v);
  };

  const handleSharedResourceVisible = (v: boolean) => {
    setSharedResourceVisible(v);
  };

  const handleProjectResourceVisible = (v: boolean) => {
    let complete = getGlobal('progress');
    if (complete === 0 || complete === 100) {
      setProjectResourceVisible(v);
    }
  };

  const handleProjResPassageVisible = (v: boolean) => {
    setProjResPassageVisible(v);
  };

  const handleProjResWizVisible = (v: boolean) => {
    if (v) {
      setProjResWizVisible(v);
    } else {
      waitForSave(undefined, 200).then(() => {
        setProjResWizVisible(v);
        projMediaRef.current = undefined;
        setVisual(false);
      });
    }
  };

  const handleAllResources = () => {
    setAllResources(!allResources);
  };

  const handleEdit = (id: string) => {
    const secRes = sectionResources.find(
      (r) => related(r, 'mediafile') === id
    ) as SectionResourceD;
    setEditResource(secRes);
    setAllowEditSave(true);
    resourceTypeRef.current = Boolean(related(secRes, 'passage'))
      ? ResourceTypeEnum.passageResource
      : ResourceTypeEnum.sectionResource;
    descriptionRef.current = secRes?.attributes.description || '';
    const mf = mediafiles.find((m) => m.id === related(secRes, 'mediafile'));
    catIdRef.current = mf ? related(mf, 'artifactCategory') : undefined;
    mediaRef.current = mf as MediaFileD;
    var ct = mediaContentType(mf);
    setUploadType(
      ct === MarkDownType
        ? UploadType.MarkDown
        : ct === UriLinkType
        ? UploadType.Link
        : UploadType.Resource
    );
  };
  const resetEdit = () => {
    setEditResource(undefined);
    catIdRef.current = undefined;
    descriptionRef.current = '';
    resourceTypeRef.current = ResourceTypeEnum.sectionResource;
    setUploadVisible(false);
    setMarkdownValue('');
    setInitDescription('');
    setAIGenerated(false);
  };
  const handleEditResourceVisible = (v: boolean) => {
    if (!v) resetEdit();
  };
  const handleEditSave = async () => {
    if (editResource) {
      UpdateSectionResource({
        ...editResource,
        attributes: {
          ...editResource.attributes,
          description: descriptionRef.current,
        },
      });
      if (Boolean(related(editResource, 'passage')) !== isPassageResource()) {
        await memory.update((t) => [
          ...ReplaceRelatedRecord(
            t,
            editResource,
            'passage',
            'passage',
            isPassageResource() ? passage.id : ''
          ),
        ]);
      }
      const mf = mediafiles.find(
        (m) => m.id === related(editResource, 'mediafile')
      ) as MediaFileD | undefined;
      if (mf && textRef.current) {
        await memory.update((t) => [
          t.replaceAttribute(mf, 'originalFile', textRef.current),
        ]);
      }
      if (mf && catIdRef.current) {
        await memory.update((t) => [
          ...ReplaceRelatedRecord(
            t,
            mf,
            'artifactCategory',
            'artifactcategory',
            catIdRef.current
          ),
        ]);
      }
      if (mf && isPassageResource() !== Boolean(related(mf, 'passage'))) {
        await memory.update((t) => [
          ...ReplaceRelatedRecord(
            t,
            mf,
            'passage',
            'passage',
            isPassageResource() ? passage.id : ''
          ),
        ]);
      }
    }
    resetEdit();
  };
  const handleEditCancel = () => {
    resetEdit();
  };
  const handleAction = (what: string) => {
    artifactState.id = resourceType;
    resourceTypeRef.current = ResourceTypeEnum.sectionResource;
    if (what === 'upload') {
      mediaRef.current = undefined;
      setUploadType(UploadType.Resource);
      setRecordAudio(false);
      setUploadVisible(true);
    } else if (what === 'scripture') {
      setAudioScriptureVisible(true);
    } else if (what === 'link') {
      setUploadType(UploadType.Link);
      setRecordAudio(false);
      setUploadVisible(true);
    } else if (what === 'record') {
      setUploadType(UploadType.Resource);
      setRecordAudio(true);
      setUploadVisible(true);
    } else if (what === 'text') {
      setUploadType(UploadType.MarkDown);
      setRecordAudio(false);
      setUploadVisible(true);
    } else if (what === 'shared') {
      resourceTypeRef.current = ResourceTypeEnum.sectionResource;
      setSharedResourceVisible(true);
    }
  };

  const handleMarkdownValue = (
    query: string,
    audioUrl: string,
    transcript: string
  ) => {
    setInitDescription(query);
    descriptionRef.current = query;
    if (audioUrl) {
      setUploadType(UploadType.FaithbridgeLink);
    } else {
      setUploadType(UploadType.MarkDown);
    }
    setMarkdownValue(audioUrl ? `${audioUrl}||${transcript}` : transcript);
    setRecordAudio(false);
    setAIGenerated(true);
    setUploadVisible(true);
  };

  const passDesc = useMemo(
    () =>
      passageTypeFromRef(passage?.attributes?.reference) ===
      PassageTypeEnum.NOTE
        ? t.noteResource
        : t.passageResource,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [passage]
  );

  const getSectionType = () => {
    const level = section.attributes?.level;
    if (level === SheetLevel.Book) return 'BOOK';
    if (level === SheetLevel.Movement) return 'MOVE';
  };

  const sectDesc = useMemo(
    () =>
      getSectionType() === PassageTypeEnum.BOOK
        ? t.bookResource
        : getSectionType() === PassageTypeEnum.MOVEMENT
        ? t.movementResource
        : getOrganizedBy(true),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [section]
  );

  const listFilter = (r: IRow) =>
    r?.isResource &&
    (allResources || r.passageId === '' || r.passageId === passage.id);

  const [selectedRows, setSelectedRows] = useState<IRow[]>(
    rowData.filter(listFilter)
  );

  useEffect(() => {
    if (!busy && !remoteBusy) {
      setSelectedRows(rowData.filter(listFilter));
      setSortKey((sortKey) => sortKey + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowData, allResources, busy, remoteBusy]);

  const onSortEnd = ({
    oldIndex,
    newIndex,
  }: {
    oldIndex: number;
    newIndex: number;
  }) => {
    if (oldIndex === newIndex) return;
    const indexes = Array<number>();
    rowData.forEach((r, i) => {
      if (listFilter(r)) indexes.push(i);
    });
    const newIndexes = arrayMove(indexes, oldIndex, newIndex) as number[];
    for (let i = 0; i < newIndexes.length; i += 1) {
      const secResRec = sectionResources.find(
        (r) => related(r, 'mediafile') === rowData[newIndexes[i]].id
      );
      if (secResRec && secResRec.attributes?.sequenceNum !== i) {
        UpdateSectionResource({
          ...secResRec,
          attributes: { ...secResRec?.attributes, sequenceNum: i },
        });
      }
    }
    const newRows = rowData
      .map((r, i) => (listFilter(r) ? rowData[newIndexes[i]] : r))
      .filter((r) => r !== undefined);
    forceRefresh(newRows);
  };

  const afterUpload = async (planId: string, mediaRemoteIds?: string[]) => {
    let cnt = rowData.length;
    var projRes = new Array<MediaFileD>();
    if (mediaRemoteIds && mediaRemoteIds.length > 0) {
      for (const remId of mediaRemoteIds) {
        cnt += 1;
        const id =
          remoteIdGuid('mediafile', remId, memory?.keyMap as RecordKeyMap) ||
          remId;
        const mediaRecId = { type: 'mediafile', id };
        if (descriptionRef.current) {
          await memory.update((t) => [
            t.replaceAttribute(mediaRecId, 'topic', descriptionRef.current),
          ]);
        }
        if (catIdRef.current) {
          await memory.update((t) => [
            ...ReplaceRelatedRecord(
              t,
              mediaRecId,
              'artifactCategory',
              'artifactcategory',
              catIdRef.current
            ),
          ]);
        }
        if (isPassageResource()) {
          await memory.update((t) => [
            ...ReplaceRelatedRecord(
              t,
              mediaRecId,
              'passage',
              'passage',
              passage.id
            ),
          ]);
        }
        if (!isProjectResource()) {
          await AddSectionResource(
            cnt,
            descriptionRef.current,
            mediaRecId,
            isPassageResource() ? passage.id : null
          );
        } else {
          projRes.push(findRecord(memory, 'mediafile', id) as MediaFileD);
        }
      }
      if (projRes.length === 1) setProjResSetup(projRes);
      resetEdit();
    }
  };

  const resourceSourcePassages = useMemo(() => {
    const results: number[] = [];
    sectionResources.forEach((sr) => {
      const rec = findRecord(memory, 'mediafile', related(sr, 'mediafile')) as
        | MediaFile
        | undefined;
      if (rowData.find((r) => r.id === rec?.id)) {
        const passageId = rec?.attributes.resourcePassageId;
        if (passageId) results.push(passageId);
      }
    });
    return results;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionResources, rowData]);

  useEffect(() => {
    getArtifactCategorys(ArtifactCategoryType.Resource).then(
      (cats) => (catRef.current = cats)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectShared = async (res: Resource[]) => {
    let cnt = rowData.length;
    for (const r of res) {
      const catRec = catRef.current.find(
        (c) => c.slug === r?.attributes?.categoryName
      );
      const newMediaRec = await AddMediaFileResource(r, catRec?.id || '');
      cnt += 1;
      await AddSectionResource(
        cnt,
        r?.attributes?.title || r?.attributes?.reference,
        newMediaRec,
        isPassageResource() ? passage.id : null
      );
    }
  };

  const handleSelectProjectResource = (m: MediaFileD) => {
    setSelected(m.id, PlayInPlayer.yes);
    projMediaRef.current = m;
    setVisual(isVisual(m));
    setProjectResourceVisible(false);
    setProjResPassageVisible(true);
  };

  const writeVisualResource = async (items: RecordIdentity[]) => {
    const t = new RecordTransformBuilder();
    let cnt = 0;
    const total = items.length;
    for (let i of items) {
      const rec = memory.cache.query((q) => q.findRecord(i)) as
        | Passage
        | Section;
      const secRec =
        rec?.type === 'section'
          ? (rec as Section)
          : (memory.cache.query((q) =>
              q.findRecord({ type: 'section', id: related(rec, 'section') })
            ) as Section);
      const secNum = secRec?.attributes.sequencenum || 0;
      const topicIn =
        projMediaRef.current?.attributes?.topic ||
        removeExtension(projMediaRef.current?.attributes?.originalFile || '')
          ?.name;
      const passage = rec?.type === 'passage' ? (rec as Passage) : undefined;
      await projectResourceSave({
        t,
        media: projMediaRef.current as MediaFile,
        i: { secNum, section: secRec, passage },
        topicIn,
        limitValue: '',
        mediafiles,
        sectionResources,
      });
      cnt += 1;
      setComplete(Math.min((cnt * 100) / total, 100));
    }
    // Ensure setComplete(0) is always called after processing
    setComplete(0);
  };

  const handleTextChange = (text: string) => {
    textRef.current = text;
    const ct = mediaContentType(mediaRef.current);
    if (ct === MarkDownType) {
      const newAllow = text.trim() !== '';
      if (allowEditSave !== newAllow) {
        setAllowEditSave(newAllow);
      }
      return;
    }
    const validUrl = isUrl(text);
    if (ct === UriLinkType) {
      if (allowEditSave !== validUrl) {
        setAllowEditSave(validUrl);
      }
    }
  };

  useEffect(() => {
    if (!projResPassageVisible && !projResWizVisible && projMediaRef.current)
      setProjResSetup(projResSetup.filter((m) => m !== projMediaRef.current));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projResPassageVisible, projResWizVisible]);

  useEffect(() => {
    if (projResSetup.length) {
      handleSelectProjectResource(projResSetup[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projResSetup]);

  const handleSelectProjectResourcePassage = (items: RecordIdentity[]) => {
    projIdentRef.current = items;
    if (isVisual(projMediaRef.current)) {
      writeVisualResource(items).then(() => {
        setProjResPassageVisible(false);
      });
    } else {
      setProjResWizVisible(true);
      setProjResPassageVisible(false);
    }
  };

  const handleCategory = (categoryId: string) => {
    catIdRef.current = categoryId;
  };

  const handleDescription = (desc: string) => {
    descriptionRef.current = desc;
  };

  const handlePassRes = (newValue: ResourceTypeEnum) => {
    resourceTypeRef.current = newValue;
    if (isProjectResource()) {
      artifactState.id = projResourceType;
      setUploadType(UploadType.ProjectResource);
    } else if (
      artifactState.id === projResourceType ||
      uploadType === UploadType.ProjectResource
    ) {
      artifactState.id = resourceType;
      setUploadType(UploadType.Resource);
    }
  };

  const handleEnded = () => {
    setPlayItem('');
    handleItemPlayEnd();
  };

  const handleLoaded = () => {
    if (playItem !== '' && !itemPlaying) {
      setTimeout(() => handleItemTogglePlay(), 1000);
    }
  };

  const [hasProjRes, setHasProjRes] = useState(false);

  useEffect(() => {
    getProjectResources().then((res) => setHasProjRes(res.length > 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediafiles]);

  const isScripture = useMemo(
    () => planType(plan)?.scripture,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [plan]
  );

  const modifiable = useMemo(
    () => hasPermission && (!offline || offlineOnly),
    [hasPermission, offline, offlineOnly]
  );

  return (
    <>
      <Stack sx={{ width: '100%' }} direction="row" spacing={1}>
        <Grid container sx={{ display: 'flex', alignItems: 'center' }}>
          {isScripture && (
            <Grid item>
              <AltButton onClick={() => handleFindVisible(true)}>
                <Badge badgeContent={`(${ts.ai})`}>{t.research}</Badge>
              </AltButton>
            </Grid>
          )}
          {hasPermission && (!offline || offlineOnly) && (
            <>
              <Grid item>
                <AddResource action={handleAction} />
              </Grid>
              {hasProjRes && (
                <Grid item>
                  <AltButton onClick={() => setProjectResourceVisible(true)}>
                    {t.configure}
                  </AltButton>
                </Grid>
              )}
            </>
          )}
          {playItem !== '' && (
            <Grid item sx={{ flexGrow: 1 }}>
              <MediaContainer>
                <LimitedMediaPlayer
                  srcMediaId={playItem}
                  requestPlay={itemPlaying}
                  onEnded={handleEnded}
                  onLoaded={handleLoaded}
                  onTogglePlay={handleItemTogglePlay}
                  controls={playItem !== ''}
                  limits={{ start: mediaStart, end: mediaEnd }}
                />
              </MediaContainer>
            </Grid>
          )}
          {otherResourcesAvailable && (
            <Grid item>
              <PassageResourceButton
                value={allResources}
                label={t.allResources}
                cb={handleAllResources}
              />
            </Grid>
          )}
        </Grid>
      </Stack>
      <SortableHeader />
      <VertListDnd key={`sort-${sortKey}`} onDrop={onSortEnd} dragHandle>
        {selectedRows.map((value, index) => (
          <SortableItem
            key={`item-${index}`}
            value={value as any}
            contentType={mediaContentType(value.mediafile)}
            isPlaying={playItem === value.id && itemPlaying}
            onPlay={handlePlay}
            onView={handleDisplayId}
            onLink={handleLinkId}
            onMarkDown={handleMarkDownId}
            onDone={handleDone}
            onDelete={modifiable ? handleDelete : undefined}
            onEdit={modifiable ? handleEdit : undefined}
          />
        ))}
      </VertListDnd>
      <Uploader
        recordAudio={recordAudio}
        isOpen={uploadVisible}
        onOpen={handleUploadVisible}
        showMessage={showMessage}
        multiple={true}
        finish={afterUpload}
        cancelled={cancelled}
        cancelReset={resetEdit}
        artifactState={artifactState}
        uploadType={uploadType}
        ready={() => true}
        onNonAudio={handleNonAudio}
        performedBy={performedBy}
        onSpeakerChange={(value) => setPerformedBy(value)}
        inValue={markdownValue}
        eafUrl={aiGenerated ? AIGenerated : ''}
        metaData={
          <ResourceData
            uploadType={uploadType}
            catAllowNew={true} //if they can upload they can add cat
            initCategory=""
            onCategoryChange={handleCategory}
            initDescription={initDescription}
            onDescriptionChange={handleDescription}
            catRequired={false}
            initPassRes={isPassageResource()}
            onPassResChange={handlePassRes}
            allowProject={!nonAudio}
            sectDesc={sectDesc}
            passDesc={passDesc}
          />
        }
      />
      <BigDialog
        title={t.findResource.replace('{0}', passageRef(passage) || '')}
        description={<Typography>{t.findResourceDesc}</Typography>}
        isOpen={findOpen}
        onOpen={handleFindVisible}
        bp={BigDialogBp.sm}
      >
        <FindTabs
          onClose={() => handleFindVisible(false)}
          canAdd={hasPermission}
          onMarkdown={handleMarkdownValue}
        />
      </BigDialog>
      <BigDialog
        title={t.sharedResource.replace(
          '{0}',
          resourceTypeRef.current === ResourceTypeEnum.sectionResource
            ? getOrganizedBy(true)
            : t.passageResource
        )}
        isOpen={sharedResourceVisible}
        onOpen={handleSharedResourceVisible}
        bp={BigDialogBp.md}
      >
        <SelectSharedResource
          sourcePassages={resourceSourcePassages}
          scope={resourceTypeRef.current}
          onScope={(val) => (resourceTypeRef.current = val)}
          onSelect={handleSelectShared}
          onOpen={handleSharedResourceVisible}
        />
      </BigDialog>
      <BigDialog
        bp={BigDialogBp.lg}
        title={t.generalResources}
        isOpen={projectResourceVisible}
        onOpen={handleProjectResourceVisible}
      >
        <SelectProjectResource
          onSelect={handleSelectProjectResource}
          onOpen={handleProjectResourceVisible}
        />
      </BigDialog>
      <BigDialog
        title={t.projectResourcePassage.replace('{0}', getOrganizedBy(false))}
        isOpen={projResPassageVisible}
        onOpen={handleProjResPassageVisible}
      >
        {projResPassageVisible ? (
          <SelectSections
            title={mediaFileName(projMediaRef.current) ?? ''}
            visual={visual}
            onSelect={handleSelectProjectResourcePassage}
          />
        ) : (
          <></>
        )}
      </BigDialog>
      <BigDialog
        title={t.projectResourceConfigure}
        isOpen={projResWizVisible}
        onOpen={handleProjResWizVisible}
        bp={BigDialogBp.md}
      >
        {projResWizVisible ? (
          <ProjectResourceConfigure
            width={800}
            media={projMediaRef.current}
            items={projIdentRef.current}
            onOpen={handleProjResWizVisible}
          />
        ) : (
          <></>
        )}
      </BigDialog>
      <BigDialog
        title={t.editResource}
        isOpen={Boolean(editResource)}
        onOpen={handleEditResourceVisible}
        onSave={allowEditSave ? handleEditSave : undefined}
        onCancel={handleEditCancel}
        bp={BigDialogBp.sm}
      >
        <ResourceData
          media={mediaRef.current}
          uploadType={uploadType}
          catAllowNew={true}
          initCategory={catIdRef.current || ''}
          onCategoryChange={handleCategory}
          initDescription={descriptionRef.current}
          onDescriptionChange={handleDescription}
          catRequired={false}
          initPassRes={Boolean(resourceTypeRef.current)}
          onPassResChange={handlePassRes}
          allowProject={false}
          onTextChange={handleTextChange}
          sectDesc={sectDesc}
          passDesc={passDesc}
        />
      </BigDialog>
      {confirm && (
        <Confirm
          text={t.deleteConfirm}
          yesResponse={handleDeleteConfirmed}
          noResponse={handleDeleteRefused}
        />
      )}
      {displayId && (
        <MediaDisplay srcMediaId={displayId} finish={handleFinish} />
      )}
      {markDown && (
        <BigDialog
          title={t.textResource}
          isOpen={Boolean(markDown)}
          onOpen={(_open: boolean) => setMarkDoan('')}
          bp={BigDialogBp.sm}
        >
          <MarkDownView value={markDown} />
        </BigDialog>
      )}
      {audioScriptureVisible && (
        <BigDialog
          title={t.audioScripture}
          isOpen={Boolean(audioScriptureVisible)}
          onOpen={() => setAudioScriptureVisible(false)}
          bp={BigDialogBp.sm}
          setCloseRequested={setBiblebrainClose}
        >
          <FindBibleBrain
            handleLink={handleLink}
            onClose={() => setAudioScriptureVisible(false)}
            closeRequested={biblebrainClose}
          />
        </BigDialog>
      )}
      <LaunchLink url={link} reset={() => setLink('')} />
    </>
  );
}

export default PassageDetailArtifacts;
