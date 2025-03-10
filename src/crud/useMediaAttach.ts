import { useGlobal } from '../context/GlobalContext';
import {
  ISharedStrings,
  ActivityStates,
  MediaFile,
  MediaFileD,
} from '../model';
import { orbitErr } from '../utils';
import * as actions from '../store';
import {
  AddPassageStateChangeToOps,
  findRecord,
  getMediaInPlans,
  related,
  UpdateRelatedPassageOps,
  useArtifactType,
  VernacularTag,
} from '.';
import { sharedSelector } from '../selector';
import { shallowEqual, useSelector } from 'react-redux';
import { ReplaceRelatedRecord, UpdateLastModifiedBy } from '../model/baseModel';
import { useDispatch } from 'react-redux';
import { RecordOperation, RecordTransformBuilder } from '@orbit/records';

export const useMediaAttach = () => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);
  const dispatch = useDispatch();
  const doOrbitError = actions.doOrbitError;
  const { IsVernacularMedia, localizedArtifactTypeFromId } = useArtifactType();

  const attach = async (
    passage: string,
    section: string,
    plan: string,
    mediaId: string
  ) => {
    var tb = new RecordTransformBuilder();
    var ops: RecordOperation[] = [];
    var mediaRI = { type: 'mediafile', id: mediaId };
    var mediaRec = findRecord(memory, 'mediafile', mediaId) as MediaFile;
    if (!mediaRec) return;
    var isVernacular = IsVernacularMedia(mediaRec);
    if (related(mediaRec, 'passage') !== passage) {
      if (isVernacular && plan) {
        var media = getMediaInPlans(
          [plan],
          memory?.cache.query((q) =>
            q.findRecords('mediafile')
          ) as MediaFileD[],
          VernacularTag,
          true
        ).filter((m) => related(m, 'passage') === passage);
        ops.push(
          tb
            .replaceAttribute(
              mediaRI,
              'versionNumber',
              media.length > 0 ? media[0].attributes.versionNumber + 1 : 1
            )
            .toOperation()
        );
        const passRecId = { type: 'passage', id: passage };
        ops.push(...UpdateLastModifiedBy(tb, passRecId, user));
        UpdateRelatedPassageOps(section, plan, user, tb, ops);
      }
      ops.push(
        ...ReplaceRelatedRecord(tb, mediaRI, 'passage', 'passage', passage)
      );
    }
    AddPassageStateChangeToOps(
      tb,
      ops,
      passage,
      isVernacular ? ActivityStates.TranscribeReady : '',
      isVernacular
        ? ts.mediaAttached
        : localizedArtifactTypeFromId(related(mediaRec, 'artifactType')),
      user,
      memory
    );

    await memory.update(ops).catch((err: Error) => {
      dispatch(doOrbitError(orbitErr(err, 'attach passage')));
    });
  };

  //this is only called for vernacular
  const detach = async (
    passage: string,
    section: string,
    plan: string,
    mediaId: string
  ) => {
    var tb = new RecordTransformBuilder();
    var ops: RecordOperation[] = [];
    const mediaRecId = { type: 'mediafile', id: mediaId };
    const mediaRec = memory?.cache.query((q) =>
      q.findRecord(mediaRecId)
    ) as MediaFile;

    AddPassageStateChangeToOps(
      tb,
      ops,
      passage,
      mediaRec?.attributes?.versionNumber === 1 ? ActivityStates.NoMedia : '',
      ts.mediaDetached,
      user,
      memory
    );

    ops.push(
      tb.replaceAttribute(mediaRecId, 'versionNumber', 1).toOperation(),
      ...ReplaceRelatedRecord(tb, mediaRecId, 'passage', 'passage', null)
    );
    const passRecId = { type: 'passage', id: passage };
    ops.push(...UpdateLastModifiedBy(tb, passRecId, user));
    UpdateRelatedPassageOps(section, plan, user, tb, ops);

    await memory.update(ops).catch((err: Error) => {
      dispatch(doOrbitError(orbitErr(err, 'detach passage')));
    });
  };

  return [attach, detach];
};
