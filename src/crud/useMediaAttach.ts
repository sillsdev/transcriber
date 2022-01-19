import { useGlobal } from 'reactn';
import { ISharedStrings, ActivityStates, MediaFile, IState } from '../model';
import { orbitErr } from '../utils';
import * as actions from '../store';
import { TransformBuilder, Operation } from '@orbit/data';
import {
  findRecord,
  getMediaInPlans,
  related,
  UpdatePassageStateOps,
  useArtifactType,
} from '.';
import localStrings from '../selector/localize';
import { shallowEqual, useSelector } from 'react-redux';

interface IDispatchProps {
  doOrbitError: typeof actions.doOrbitError;
}

const sharedSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'shared' });

interface IProps extends IDispatchProps {}

export const useMediaAttach = (props: IProps) => {
  const { doOrbitError } = props;
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);
  const { vernacularId } = useArtifactType();

  const attach = async (
    passage: string,
    section: string,
    plan: string,
    mediaId: string
  ) => {
    var tb = new TransformBuilder();
    var ops: Operation[] = [];
    var mediaRI = { type: 'mediafile', id: mediaId };
    var mediaRec = findRecord(memory, 'mediafile', mediaId);
    if (!mediaRec) return;
    if (related(mediaRec, 'passage') !== passage) {
      var media = getMediaInPlans(
        [plan],
        memory.cache.query((q) => q.findRecords('mediafile')) as MediaFile[],
        vernacularId,
        true
      ).filter((m) => related(m, 'passage') === passage);
      ops.push(
        tb.replaceAttribute(
          mediaRI,
          'versionNumber',
          media.length > 0 ? media[0].attributes.versionNumber + 1 : 1
        )
      );
      ops.push(
        tb.replaceRelatedRecord(mediaRI, 'passage', {
          type: 'passage',
          id: passage,
        })
      );
    }
    ops = UpdatePassageStateOps(
      passage,
      section,
      plan,
      ActivityStates.TranscribeReady,
      ts.mediaAttached,
      user,
      tb,
      ops,
      memory
    );
    await memory.update(ops).catch((err: Error) => {
      doOrbitError(orbitErr(err, 'attach passage'));
    });
  };

  const detach = async (
    passage: string,
    section: string,
    plan: string,
    mediaId: string
  ) => {
    var tb = new TransformBuilder();
    var ops: Operation[] = [];
    const mediaRecId = { type: 'mediafile', id: mediaId };
    const mediaRec = memory.cache.query((q) =>
      q.findRecord(mediaRecId)
    ) as MediaFile;
    ops.push(
      tb.replaceAttribute(mediaRecId, 'versionNumber', 1),
      tb.replaceRelatedRecord(mediaRecId, 'passage', null)
    );
    ops = UpdatePassageStateOps(
      passage,
      section,
      plan,
      mediaRec?.attributes?.versionNumber === 1
        ? ActivityStates.NoMedia
        : ActivityStates.TranscribeReady,
      ts.mediaDetached,
      user,
      tb,
      ops,
      memory
    );
    await memory.update(ops).catch((err: Error) => {
      doOrbitError(orbitErr(err, 'detach passage'));
    });
  };

  return [attach, detach];
};
