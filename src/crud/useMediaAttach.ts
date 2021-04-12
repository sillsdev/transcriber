import { useGlobal } from 'reactn';
import { ISharedStrings, ActivityStates, MediaFile } from '../model';
import { orbitErr } from '../utils';
import * as actions from '../store';
import { TransformBuilder, Operation } from '@orbit/data';
import { UpdatePassageStateOps } from '../crud/updatePassageState';
import { getMediaInPlans, related } from '.';

interface IDispatchProps {
  doOrbitError: typeof actions.doOrbitError;
}
interface IStateProps {
  ts: ISharedStrings;
}

interface IProps extends IStateProps, IDispatchProps {}

export const useMediaAttach = (props: IProps) => {
  const { doOrbitError, ts } = props;
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');

  const attach = async (
    passage: string,
    section: string,
    plan: string,
    mediaId: string
  ) => {
    var tb = new TransformBuilder();
    var ops: Operation[] = [];
    var mediaRI = { type: 'mediafile', id: mediaId };
    var mediaRec = memory.cache.query((q) => q.findRecord(mediaRI));
    if (!mediaRec || related(mediaRec, 'passage') === passage) return;
    var media = getMediaInPlans(
      [plan],
      memory.cache.query((q) => q.findRecords('mediafile')) as MediaFile[]
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
      var x = orbitErr(err, 'attach passage');
      doOrbitError(x);
      console.log(err.message);
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
    ops.push(
      tb.replaceRelatedRecord(
        {
          type: 'mediafile',
          id: mediaId,
        },
        'passage',
        null
      )
    );
    ops = UpdatePassageStateOps(
      passage,
      section,
      plan,
      ActivityStates.NoMedia,
      'Media Detached',
      user,
      tb,
      ops,
      memory
    );
    await memory.update(ops).catch((err: Error) => {
      var x = orbitErr(err, 'detach passage');
      doOrbitError(x);
      console.log(err.message);
    });
  };

  return [attach, detach];
};
