import { useState, useContext, useEffect, useMemo } from 'react';
import { useGlobal } from 'reactn';
import { connect } from 'react-redux';
import { IPassageDetailArtifactsStrings, IState } from '../../../model';
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
import { getResources, IRow, resourceRows } from '.';
import { SortableList, SortableItem } from '.';
import {
  remoteIdGuid,
  useSecResCreate,
  useMediaResCreate,
  useSecResUpdate,
  related,
} from '../../../crud';
import BigDialog from '../../../hoc/BigDialog';
import SelectResource from './SelectResource';

const t2 = {
  sharedResource: 'Select Shared Resource',
};

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
  const { sectionResources, mediafiles, artifactTypes, auth, t } = props;
  const [memory] = useGlobal('memory');
  const [, setComplete] = useGlobal('progress');
  const [user] = useGlobal('user');
  const ctx = useContext(PassageDetailContext);
  const { rowData, section, passage } = ctx.state;
  const AddSectionResource = useSecResCreate(section);
  const AddMediaFileResource = useMediaResCreate(passage);
  const UpdateSectionResource = useSecResUpdate();
  const [resources, setResources] = useState<IRow[]>([]);
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
    setResources((res) =>
      res.map((r) =>
        r.id === id ? { ...r, playItem: r.playItem === '' ? id : '' } : r
      )
    );
  };

  const handleDone = (id: string) => {
    setResources((res) =>
      res.map((r) => (r.id === id ? { ...r, done: !r.done } : r))
    );
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
    // TODO: decide if rowData should also contain resources
    ctx.setState((state) => {
      return { ...state, rowData: arrayMove(rowData, oldIndex, newIndex) };
    });
    const newRows = arrayMove(resources, oldIndex, newIndex) as IRow[];
    setResources(newRows);
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
    let cnt = resources.length;
    if (mediaRemoteIds)
      for (const remId of mediaRemoteIds) {
        cnt += 1;
        const id = remoteIdGuid('mediafile', remId, memory.keyMap) || remId;
        await AddSectionResource(cnt, null, { type: 'mediafile', id });
      }
  };

  const handleSelectShared = async (res: Resource[]) => {
    let cnt = resources.length;
    for (const r of res) {
      const medRec: any = { attributes: { ...r.attributes } };
      const newMediaRec = await AddMediaFileResource(medRec);
      cnt += 1;
      await AddSectionResource(cnt, r.attributes.reference, newMediaRec);
    }
  };

  useEffect(() => {
    let res = getResources(sectionResources, mediafiles, section.id);
    const newRow = resourceRows({ ...props, res, user, t });
    setResources(newRow);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionResources, mediafiles, section]);

  return (
    <>
      <AddResource action={handleAction} />
      <SortableHeader />
      <SortableList onSortEnd={onSortEnd} useDragHandle>
        {resources.map((value, index) => (
          <SortableItem
            key={`item-${index}`}
            index={index}
            value={value}
            handlePlay={handlePlay}
            handleDone={handleDone}
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
        title={t2.sharedResource}
        isOpen={sharedResourceVisible}
        onOpen={handleSharedResourceVisible}
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
