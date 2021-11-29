import { useState, useContext, useMemo } from 'react';
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
import { QueryBuilder } from '@orbit/data';
import { useSnackBar } from '../../../hoc/SnackBar';
import Uploader, { IStatus } from '../../Uploader';
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
} from '../../../crud';
import BigDialog, { BigDialogBp } from '../../../hoc/BigDialog';
import SelectResource, { CatMap } from './SelectResource';

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
  const { sectionResources, artifactTypes, auth, t } = props;
  const [memory] = useGlobal('memory');
  const [projRole] = useGlobal('projRole');
  const [, setComplete] = useGlobal('progress');
  const ctx = useContext(PassageDetailContext);
  const { rowData, section, passage, setSelected, playItem, setPlaying } =
    ctx.state;
  const AddSectionResource = useSecResCreate(section);
  const AddMediaFileResource = useMediaResCreate(passage);
  const UpdateSectionResource = useSecResUpdate();
  const DeleteSectionResource = useSecResDelete();
  const [uploadVisible, setUploadVisible] = useState(false);
  const [status] = useState<IStatus>({ canceled: false });
  const [sharedResourceVisible, setSharedResourceVisible] = useState(false);
  const { showMessage } = useSnackBar();

  const resourceType = useMemo(() => {
    const resourceType = artifactTypes.find(
      (t) => t.attributes?.typename === 'resource'
    );
    return resourceType?.id;
  }, [artifactTypes]);

  const handlePlay = (id: string) => {
    if (playItem !== '') {
      setPlaying(false);
    } else setSelected(id);
  };

  const handleDone = (id: string) => {
    ctx.setState((state) => {
      return {
        ...state,
        rowData: (rowData as any).map((r: IRow) =>
          r.id === id ? { ...r, done: !r.done } : r
        ),
      };
    });
  };

  const handleDelete = (id: string) => {
    const secRes = sectionResources.find((r) => related(r, 'mediafile') === id);
    secRes && DeleteSectionResource(secRes);
  };

  const handleUploadVisible = (v: boolean) => {
    setUploadVisible(v);
  };

  const handleSharedResourceVisible = (v: boolean) => {
    setSharedResourceVisible(v);
  };

  const handleAction = (what: string) => {
    if (what === 'upload') {
      setUploadVisible(true);
    } else if (what === 'reference') {
      setSharedResourceVisible(true);
    } else if (what === 'activity') {
    }
  };

  const onSortEnd = ({
    oldIndex,
    newIndex,
  }: {
    oldIndex: number;
    newIndex: number;
  }) => {
    const newRows = arrayMove(rowData, oldIndex, newIndex) as IRow[];
    ctx.setState((state) => {
      return { ...state, rowData: newRows };
    });
    for (let i = 0; i < newRows.length; i += 1) {
      const secResRec = sectionResources.find(
        (r) => related(r, 'mediafile') === newRows[i].id
      );
      if (secResRec && secResRec.attributes?.sequenceNum !== i) {
        UpdateSectionResource({
          ...secResRec,
          attributes: { ...secResRec?.attributes, sequenceNum: i },
        });
      }
    }
  };

  const afterUpload = async (planId: string, mediaRemoteIds?: string[]) => {
    let cnt = rowData.length;
    if (mediaRemoteIds)
      for (const remId of mediaRemoteIds) {
        cnt += 1;
        const id = remoteIdGuid('mediafile', remId, memory.keyMap) || remId;
        await AddSectionResource(cnt, null, { type: 'mediafile', id });
      }
  };

  const handleSelectShared = async (res: Resource[], catMap: CatMap) => {
    let cnt = rowData.length;
    for (const r of res) {
      const medRec: any = { attributes: { ...r.attributes } };
      const catRecId = { type: 'artifactcategory', id: catMap[r.id] };
      const newMediaRec = await AddMediaFileResource(medRec, catRecId);
      cnt += 1;
      await AddSectionResource(cnt, r.attributes.reference, newMediaRec);
    }
  };

  return (
    <>
      {projRole === RoleNames.Admin && <AddResource action={handleAction} />}
      <SortableHeader />
      <SortableList onSortEnd={onSortEnd} useDragHandle>
        {rowData
          .filter((r) => r.isResource)
          .map((value, index) => (
            <SortableItem
              key={`item-${index}`}
              index={index}
              value={value as any}
              playItem={playItem}
              onPlay={handlePlay}
              onDone={handleDone}
              onDelete={handleDelete}
            />
          ))}
      </SortableList>
      <Uploader
        recordAudio={false}
        auth={auth}
        isOpen={uploadVisible}
        onOpen={handleUploadVisible}
        showMessage={showMessage}
        setComplete={setComplete}
        multiple={true}
        finish={afterUpload}
        status={status}
        artifactType={resourceType}
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
