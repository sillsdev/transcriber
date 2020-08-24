import { useGlobal } from 'reactn';
import { ISharedStrings, ActivityStates } from '../model';
import { orbitErr } from '../utils';

import * as actions from '../store';
import { TransformBuilder, Operation } from '@orbit/data';
import { UpdatePassageStateOps } from '../crud/updatePassageState';
import { remoteIdNum } from '.';

interface IDispatchProps {
  doOrbitError: typeof actions.doOrbitError;
}
interface IStateProps {
  ts: ISharedStrings;
}

interface IProps extends IStateProps, IDispatchProps {}

export const useMediaAttach = (props: IProps) => {
  const { doOrbitError } = props;
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');

  const attach = async (passage: string, mediaId: string) => {
    var tb = new TransformBuilder();
    var ops: Operation[] = [];
    ops.push(
      tb.replaceRelatedRecord({ type: 'mediafile', id: mediaId }, 'passage', {
        type: 'passage',
        id: passage,
      })
    );
    ops = UpdatePassageStateOps(
      passage,
      ActivityStates.TranscribeReady,
      'Media Attached',
      remoteIdNum('user', user, memory.keyMap),
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

  const detach = async (passage: string, mediaId: string) => {
    var tb = new TransformBuilder();
    var ops: Operation[] = [];
    ops.push(
      tb.replaceRelatedRecord(
        { type: 'mediafile', id: mediaId },
        'passage',
        null
      )
    );
    ops = UpdatePassageStateOps(
      passage,
      ActivityStates.NoMedia,
      'Media Detached',
      remoteIdNum('user', user, memory.keyMap),
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
