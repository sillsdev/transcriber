import {
  useState,
  useContext,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from 'react';
import { useGlobal } from 'reactn';
import { connect } from 'react-redux';
import {
  IPassageDetailArtifactsStrings,
  IState,
  Passage,
  Section,
} from '../../../model';
import localStrings from '../../../selector/localize';
import {
  SectionResource,
  MediaFile,
  ArtifactCategory,
  ArtifactType,
  SectionResourceUser,
  Resource,
} from '../../../model';
import { withData } from 'react-orbitjs';
import { arrayMoveImmutable as arrayMove } from 'array-move';
import { PassageDetailContext } from '../../../context/PassageDetailContext';
import { QueryBuilder, RecordIdentity, TransformBuilder } from '@orbit/data';
import { useSnackBar } from '../../../hoc/SnackBar';
import Uploader from '../../Uploader';
import AddResource from './AddResource';
import SortableHeader from './SortableHeader';
import { IRow } from '../../../context/PassageDetailContext';
import { SortableList, SortableItem } from '.';
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
  useRole,
  findRecord,
  useArtifactCategory,
  IArtifactCategory,
} from '../../../crud';
import BigDialog, { BigDialogBp } from '../../../hoc/BigDialog';
import MediaDisplay from '../../MediaDisplay';
import SelectSharedResource from './SelectSharedResource';
import SelectProjectResource from './SelectProjectResource';
import SelectSections from './SelectSections';
import ResourceData from './ResourceData';
import { UploadType } from '../../MediaUpload';
import MediaPlayer from '../../MediaPlayer';
import { Box, BoxProps, styled } from '@mui/material';
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
} from '../../../utils';

const MediaContainer = styled(Box)<BoxProps>(({ theme }) => ({
  margin: theme.spacing(1),
  width: '100%',
  '& audio': {
    display: 'flex',
    width: 'inherit',
  },
}));

interface IRecordProps {
  sectionResources: SectionResource[];
  mediafiles: MediaFile[];
  artifactTypes: ArtifactType[];
  categories: ArtifactCategory[]; // used by resourceRows
  userResources: SectionResourceUser[]; // used by resourceRows
}

interface IStateProps {
  t: IPassageDetailArtifactsStrings;
}

interface IProps extends IStateProps, IRecordProps {}
export enum ResourceTypeEnum {
  sectionResource,
  passageResource,
  projectResource,
}
export function PassageDetailArtifacts(props: IProps) {
  const { sectionResources, mediafiles, artifactTypes, t } = props;
  const [memory] = useGlobal('memory');
  const [offline] = useGlobal('offline');
  const [offlineOnly] = useGlobal('offlineOnly');
  const [complete, setComplete] = useGlobal('progress');
  const ctx = useContext(PassageDetailContext);
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
    handleItemPlayEnd,
    handleItemTogglePlay,
  } = ctx.state;
  const { getOrganizedBy } = useOrganizedBy();
  const AddSectionResource = useSecResCreate(section);
  const AddSectionResourceUser = useSecResUserCreate();
  const ReadSectionResourceUser = useSecResUserRead();
  const RemoveSectionResourceUser = useSecResUserDelete();
  const AddMediaFileResource = useMediaResCreate(passage, currentstep);
  const UpdateSectionResource = useSecResUpdate();
  const DeleteSectionResource = useSecResDelete();
  const { getArtifactCategorys } = useArtifactCategory();
  const catRef = useRef<IArtifactCategory[]>([]);
  const [uploadVisible, setUploadVisible] = useState(false);
  const [visual, setVisual] = useState(false);
  const cancelled = useRef(false);
  const [displayId, setDisplayId] = useState('');
  const [sharedResourceVisible, setSharedResourceVisible] = useState(false);
  const [projectResourceVisible, setProjectResourceVisible] = useState(false);
  const [projResPassageVisible, setProjResPassageVisible] = useState(false);
  const [projResWizVisible, setProjResWizVisible] = useState(false);
  const [projResSetup, setProjResSetup] = useState(new Array<MediaFile>());
  const [editResource, setEditResource] = useState<
    SectionResource | undefined
  >();
  const [artifactTypeId, setArtifactTypeId] = useState<string>();
  const [uploadType, setUploadType] = useState<UploadType>(UploadType.Resource);

  const catIdRef = useRef<string>();
  const descriptionRef = useRef<string>('');

  const resourceTypeRef = useRef<ResourceTypeEnum>(
    ResourceTypeEnum.sectionResource
  );
  const projIdentRef = useRef<RecordIdentity[]>([]);
  const projMediaRef = useRef<MediaFile>();
  const [allResources, setAllResources] = useState(false);
  const { showMessage } = useSnackBar();
  const [confirm, setConfirm] = useState('');
  const { checkSavedFn } = useContext(UnsavedContext).state;
  const mediaStart = useRef<number | undefined>();
  const mediaEnd = useRef<number | undefined>();
  const mediaPosition = useRef<number | undefined>();
  const projectResourceSave = useProjectResourceSave();
  const { userIsAdmin } = useRole();
  const resourceType = useMemo(() => {
    const resourceType = artifactTypes.find(
      (t) =>
        t.attributes?.typename === 'resource' &&
        Boolean(t?.keys?.remoteId) === !offlineOnly
    );
    setArtifactTypeId(resourceType?.id);
    return resourceType?.id;
  }, [artifactTypes, offlineOnly]);

  const otherResourcesAvailable = useMemo(
    () =>
      rowData.filter((r) => r.passageId && r.passageId !== passage.id).length >
      0,
    [passage, rowData]
  );

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
          mediaStart.current = start;
          mediaEnd.current = end;
          setMediaSelected(id, start, end);
          return;
        }
      }
      setSelected(id);
    }
  };

  const handleDisplayId = (id: string) => {
    setDisplayId(id);
  };

  const handleFinish = () => {
    setDisplayId('');
  };

  const handleDone = async (id: string, res: SectionResource | null) => {
    if (!res) return;
    const rec = await ReadSectionResourceUser(res);
    if (rec !== null) {
      await RemoveSectionResourceUser(res, rec);
    } else {
      await AddSectionResourceUser(res);
    }
    ctx.setState((state) => ({
      ...state,
      rowData: (rowData as any).map((r: IRow) =>
        r?.id === id ? { ...r, done: !r.done } : r
      ),
    }));
  };

  const handleDelete = (id: string) => setConfirm(id);
  const handleDeleteRefused = () => setConfirm('');
  const handleDeleteConfirmed = () => {
    const secRes = sectionResources.find(
      (r) => related(r, 'mediafile') === confirm
    );
    secRes && DeleteSectionResource(secRes);
    setConfirm('');
  };
  const handleUploadVisible = (v: boolean) => {
    setUploadVisible(v);
  };

  const handleSharedResourceVisible = (v: boolean) => {
    setSharedResourceVisible(v);
  };

  const handleProjectResourceVisible = (v: boolean) => {
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
      checkSavedFn(() => {
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
    const secRes = sectionResources.find((r) => related(r, 'mediafile') === id);
    setEditResource(secRes);
    resourceTypeRef.current = Boolean(related(secRes, 'passage'))
      ? ResourceTypeEnum.passageResource
      : ResourceTypeEnum.sectionResource;
    descriptionRef.current = secRes?.attributes.description || '';
    const mf = mediafiles.find((m) => m.id === related(secRes, 'mediafile'));
    catIdRef.current = mf ? related(mf, 'artifactCategory') : undefined;
  };
  const resetEdit = () => {
    setEditResource(undefined);
    catIdRef.current = undefined;
    descriptionRef.current = '';
    resourceTypeRef.current = ResourceTypeEnum.sectionResource;
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
      );
      if (mf && catIdRef.current) {
        await memory.update((t: TransformBuilder) => [
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
        await memory.update((t: TransformBuilder) => [
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
    if (what === 'upload') {
      setUploadVisible(true);
    } else if (what === 'ref-passage') {
      resourceTypeRef.current = ResourceTypeEnum.passageResource;
      setSharedResourceVisible(true);
    } else if (what === 'ref-section') {
      resourceTypeRef.current = ResourceTypeEnum.sectionResource;
      setSharedResourceVisible(true);
    } else if (what === 'activity') {
    } else if (what === 'wizard') {
      setProjectResourceVisible(true);
    } else if (what === 'sheet') {
    }
  };

  const listFilter = useCallback(
    (r: IRow) =>
      r?.isResource &&
      (allResources || r.passageId === '' || r.passageId === passage.id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allResources, passage]
  );

  const onSortEnd = ({
    oldIndex,
    newIndex,
  }: {
    oldIndex: number;
    newIndex: number;
  }) => {
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
    ctx.setState((state) => {
      return { ...state, rowData: newRows };
    });
  };

  const afterUpload = async (planId: string, mediaRemoteIds?: string[]) => {
    let cnt = rowData.length;
    var projRes = new Array<MediaFile>();
    if (mediaRemoteIds) {
      for (const remId of mediaRemoteIds) {
        cnt += 1;
        const id = remoteIdGuid('mediafile', remId, memory.keyMap) || remId;
        const mediaRecId = { type: 'mediafile', id };
        if (descriptionRef.current) {
          await memory.update((t: TransformBuilder) => [
            t.replaceAttribute(mediaRecId, 'topic', descriptionRef.current),
          ]);
        }
        if (catIdRef.current) {
          await memory.update((t: TransformBuilder) => [
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
          await memory.update((t: TransformBuilder) => [
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
          projRes.push(findRecord(memory, 'mediafile', id) as MediaFile);
        }
      }
      if (projRes.length) setProjResSetup(projRes);
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
  }, [sectionResources]);

  useEffect(() => {
    getArtifactCategorys(true, false).then((cats) => (catRef.current = cats));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectShared = async (res: Resource[]) => {
    let cnt = rowData.length;
    for (const r of res) {
      const catRec = catRef.current.find(
        (c) => c.slug === r.attributes.categoryName
      );
      const newMediaRec = await AddMediaFileResource(r, catRec?.id || '');
      cnt += 1;
      await AddSectionResource(
        cnt,
        r.attributes.title || r.attributes.reference,
        newMediaRec,
        isPassageResource() ? passage.id : null
      );
    }
  };

  const handleSelectProjectResource = (m: MediaFile) => {
    setSelected(m.id);
    projMediaRef.current = m;
    setVisual(isVisual(m));
    setProjectResourceVisible(false);
    setProjResPassageVisible(true);
  };

  const writeVisualResource = async (items: RecordIdentity[]) => {
    const t = new TransformBuilder();
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
      await projectResourceSave({
        t,
        media: projMediaRef.current as MediaFile,
        i: { rec, secNum },
        topicIn,
        limitValue: '',
        mediafiles,
        sectionResources,
      });
      cnt += 1;
      setComplete(Math.min((cnt * 100) / total, 100));
    }
    setComplete(0);
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
    setArtifactTypeId(isProjectResource() ? projResourceType : resourceType);
    setUploadType(
      isProjectResource() ? UploadType.ProjectResource : UploadType.Resource
    );
  };

  const handleEnded = () => {
    mediaStart.current = undefined;
    mediaEnd.current = undefined;
    mediaPosition.current = undefined;
    setPlayItem('');
    handleItemPlayEnd();
  };

  const handleDuration = (duration: number) => {
    if (mediaStart.current) {
      mediaPosition.current = mediaStart.current;
      mediaStart.current = undefined;
    }
    setItemPlaying(true);
  };

  const handlePosition = (position: number) => {
    if (mediaEnd.current) {
      if (position >= mediaEnd.current) {
        handleEnded();
      }
    }
  };
  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'row', flexGrow: 1, pr: 2 }}>
        {userIsAdmin && (!offline || offlineOnly) && (
          <AddResource action={handleAction} />
        )}
        <MediaContainer>
          <MediaPlayer
            srcMediaId={playItem}
            requestPlay={itemPlaying}
            onEnded={handleEnded}
            onDuration={handleDuration}
            onPosition={handlePosition}
            position={mediaPosition.current}
            onTogglePlay={handleItemTogglePlay}
            controls={playItem !== ''}
          />
        </MediaContainer>
        {otherResourcesAvailable && (
          <PassageResourceButton
            value={allResources}
            label={t.allResources}
            cb={handleAllResources}
          />
        )}
      </Box>
      <SortableHeader />
      <SortableList onSortEnd={onSortEnd} useDragHandle>
        {rowData
          .filter((r) => listFilter(r))
          .map((value, index) => (
            <SortableItem
              key={`item-${index}`}
              index={index}
              value={value as any}
              isPlaying={playItem === value.id && itemPlaying}
              onPlay={handlePlay}
              onView={handleDisplayId}
              onDone={handleDone}
              onDelete={handleDelete}
              onEdit={
                userIsAdmin && (!offline || offlineOnly)
                  ? handleEdit
                  : undefined
              }
            />
          ))}
      </SortableList>
      <Uploader
        recordAudio={false}
        isOpen={uploadVisible}
        onOpen={handleUploadVisible}
        showMessage={showMessage}
        multiple={true}
        finish={afterUpload}
        cancelled={cancelled}
        artifactTypeId={artifactTypeId}
        uploadType={uploadType}
        metaData={
          <ResourceData
            catAllowNew={true} //if they can upload they can add cat
            initCategory=""
            onCategoryChange={handleCategory}
            initDescription=""
            onDescriptionChange={handleDescription}
            catRequired={false}
            initPassRes={isPassageResource()}
            onPassResChange={handlePassRes}
            allowProject={true}
          />
        }
      />
      <BigDialog
        title={t.sharedResource}
        isOpen={sharedResourceVisible}
        onOpen={handleSharedResourceVisible}
        bp={BigDialogBp.md}
      >
        <SelectSharedResource
          sourcePassages={resourceSourcePassages}
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
            title={projMediaRef.current?.attributes?.originalFile ?? ''}
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
        onSave={handleEditSave}
        onCancel={handleEditCancel}
        bp={BigDialogBp.sm}
      >
        <ResourceData
          catAllowNew={true}
          initCategory={catIdRef.current || ''}
          onCategoryChange={handleCategory}
          initDescription={descriptionRef.current}
          onDescriptionChange={handleDescription}
          catRequired={false}
          initPassRes={Boolean(resourceTypeRef.current)}
          onPassResChange={handlePassRes}
          allowProject={false}
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
    </>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'passageDetailArtifacts' }),
});

const mapRecordsToProps = {
  sectionResources: (q: QueryBuilder) => q.findRecords('sectionresource'),
  mediafiles: (q: QueryBuilder) => q.findRecords('mediafile'),
  categories: (q: QueryBuilder) => q.findRecords('artifactcategory'),
  artifactTypes: (q: QueryBuilder) => q.findRecords('artifacttype'),
  userResources: (q: QueryBuilder) => q.findRecords('sectionresourceuser'),
};

export default withData(mapRecordsToProps)(
  connect(mapStateToProps)(PassageDetailArtifacts) as any as any
) as any;
