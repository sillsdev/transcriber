import { useState, useContext, useMemo, useRef } from 'react';
import { useGlobal } from 'reactn';
import { connect } from 'react-redux';
import {
  IPassageDetailArtifactsStrings,
  IState,
  RoleNames,
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
import Auth from '../../../auth/Auth';
import { withData } from '../../../mods/react-orbitjs';
import { arrayMoveImmutable as arrayMove } from 'array-move';
import { PassageDetailContext } from '../../../context/PassageDetailContext';
import { QueryBuilder, TransformBuilder } from '@orbit/data';
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
} from '../../../crud';
import BigDialog, { BigDialogBp } from '../../../hoc/BigDialog';
import MediaDisplay from '../../MediaDisplay';
import SelectResource, { CatMap } from './SelectResource';
import ResourceData from './ResourceData';
import { UploadType } from '../../MediaUpload';
import MediaPlayer from '../../MediaPlayer';
import { createStyles, makeStyles, Theme } from '@material-ui/core';
import { ReplaceRelatedRecord } from '../../../model/baseModel';
import { PassageResourceButton } from './PassageResourceButton';
import Confirm from '../../AlertDialog';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    row: {
      display: 'flex',
      flexDirection: 'row',
      flexGrow: 1,
      paddingRight: theme.spacing(2),
    },
    playStatus: {
      margin: theme.spacing(1),
      width: '100%',
      '& audio': {
        display: 'flex',
        width: 'inherit',
      },
    },
  })
);

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

interface IProps extends IStateProps, IRecordProps {
  auth: Auth;
}

export function PassageDetailArtifacts(props: IProps) {
  const classes = useStyles();
  const { sectionResources, mediafiles, artifactTypes, auth, t } = props;
  const [memory] = useGlobal('memory');
  const [projRole] = useGlobal('projRole');
  const [offline] = useGlobal('offline');
  const [offlineOnly] = useGlobal('offlineOnly');
  const ctx = useContext(PassageDetailContext);
  const {
    rowData,
    section,
    passage,
    setSelected,
    playItem,
    setPlayItem,
    itemPlaying,
    setItemPlaying,
    currentstep,
    handleItemPlayEnd,
    handleItemTogglePlay,
  } = ctx.state;
  const AddSectionResource = useSecResCreate(section);
  const AddSectionResourceUser = useSecResUserCreate();
  const ReadSectionResourceUser = useSecResUserRead();
  const RemoveSectionResourceUser = useSecResUserDelete();
  const AddMediaFileResource = useMediaResCreate(passage, currentstep);
  const UpdateSectionResource = useSecResUpdate();
  const DeleteSectionResource = useSecResDelete();
  const [uploadVisible, setUploadVisible] = useState(false);
  const cancelled = useRef(false);
  const [displayId, setDisplayId] = useState('');
  const [sharedResourceVisible, setSharedResourceVisible] = useState(false);
  const [editResource, setEditResource] = useState<SectionResource>();
  const catIdRef = useRef<string>();
  const descriptionRef = useRef<string>('');
  const passRes = useRef(false);
  const [allResources, setAllResources] = useState(false);
  const { showMessage } = useSnackBar();
  const [confirm, setConfirm] = useState('');

  const resourceType = useMemo(() => {
    const resourceType = artifactTypes.find(
      (t) =>
        t.attributes?.typename === 'resource' &&
        Boolean(t?.keys?.remoteId) === !offlineOnly
    );
    return resourceType?.id;
  }, [artifactTypes, offlineOnly]);

  const handlePlay = (id: string) => {
    if (id === playItem) {
      setItemPlaying(!itemPlaying);
    } else setSelected(id);
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

  const handleAllResources = () => {
    setAllResources(!allResources);
  };

  const handleEdit = (id: string) => {
    const secRes = sectionResources.find((r) => related(r, 'mediafile') === id);
    setEditResource(secRes);
    passRes.current = Boolean(related(secRes, 'passage'));
    descriptionRef.current = secRes?.attributes.description || '';
    const mf = mediafiles.find((m) => m.id === related(secRes, 'mediafile'));
    catIdRef.current = mf ? related(mf, 'artifactCategory') : undefined;
  };
  const resetEdit = () => {
    setEditResource(undefined);
    catIdRef.current = undefined;
    descriptionRef.current = '';
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
      if (passRes.current !== Boolean(related(editResource, 'passage'))) {
        await memory.update((t) => [
          ...ReplaceRelatedRecord(
            t,
            editResource,
            'passage',
            'passage',
            passRes.current ? passage.id : ''
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
      if (mf && passRes.current !== Boolean(related(mf, 'resourcePassage'))) {
        await memory.update((t: TransformBuilder) => [
          ...ReplaceRelatedRecord(
            t,
            mf,
            'resourcePassage',
            'passage',
            passRes.current ? passage.id : ''
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
    } else if (what === 'reference') {
      setSharedResourceVisible(true);
    } else if (what === 'activity') {
    }
  };

  const listFilter = (r: IRow) =>
    r?.isResource &&
    (allResources ||
      r.passageResource === '' ||
      r.passageResource === passage.id);

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
    if (mediaRemoteIds) {
      for (const remId of mediaRemoteIds) {
        cnt += 1;
        const id = remoteIdGuid('mediafile', remId, memory.keyMap) || remId;
        const mediaRecId = { type: 'mediafile', id };
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
        if (passRes.current) {
          await memory.update((t: TransformBuilder) => [
            ...ReplaceRelatedRecord(
              t,
              mediaRecId,
              'resourcePassage',
              'passage',
              passage.id
            ),
          ]);
        }
        await AddSectionResource(
          cnt,
          descriptionRef.current,
          mediaRecId,
          passRes.current ? passage.id : null
        );
      }
      resetEdit();
    }
  };

  const handleSelectShared = async (res: Resource[], catMap: CatMap) => {
    let cnt = rowData.length;
    for (const r of res) {
      const newMediaRec = await AddMediaFileResource(r, catMap[r.id]);
      cnt += 1;
      await AddSectionResource(
        cnt,
        r.attributes.reference,
        newMediaRec,
        passRes.current ? passage.id : null
      );
    }
  };

  const handleCategory = (categoryId: string) => {
    catIdRef.current = categoryId;
  };

  const handleDescription = (desc: string) => {
    descriptionRef.current = desc;
  };

  const handlePassRes = () => {
    passRes.current = !passRes.current;
  };

  const handleEnded = () => {
    setPlayItem('');
    handleItemPlayEnd();
  };
  return (
    <>
      <div className={classes.row}>
        {projRole === RoleNames.Admin && (!offline || offlineOnly) && (
          <AddResource action={handleAction} />
        )}
        <div className={classes.playStatus}>
          <MediaPlayer
            auth={auth}
            srcMediaId={playItem}
            requestPlay={itemPlaying}
            onEnded={handleEnded}
            onTogglePlay={handleItemTogglePlay}
            controls={playItem !== ''}
          />
        </div>
        <PassageResourceButton
          value={allResources}
          label={t.allResources}
          cb={handleAllResources}
        />
      </div>
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
              onEdit={handleEdit}
            />
          ))}
      </SortableList>
      <Uploader
        recordAudio={false}
        auth={auth}
        isOpen={uploadVisible}
        onOpen={handleUploadVisible}
        showMessage={showMessage}
        multiple={true}
        finish={afterUpload}
        cancelled={cancelled}
        artifactTypeId={resourceType}
        uploadType={UploadType.Resource}
        metaData={
          <ResourceData
            catAllowNew={true} //if they can upload they can add cat
            initCategory=""
            onCategoryChange={handleCategory}
            initDescription=""
            onDescriptionChange={handleDescription}
            catRequired={false}
            initPassRes={passRes.current}
            onPassResChange={handlePassRes}
          />
        }
      />
      <BigDialog
        title={t.sharedResource}
        isOpen={sharedResourceVisible}
        onOpen={handleSharedResourceVisible}
        bp={BigDialogBp.md}
      >
        <SelectResource
          onSelect={handleSelectShared}
          onOpen={handleSharedResourceVisible}
        />
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
          initCategory={catIdRef.current}
          onCategoryChange={handleCategory}
          initDescription={descriptionRef.current}
          onDescriptionChange={handleDescription}
          catRequired={false}
          initPassRes={passRes.current}
          onPassResChange={handlePassRes}
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
        <MediaDisplay
          srcMediaId={displayId}
          finish={handleFinish}
          auth={auth}
        />
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
