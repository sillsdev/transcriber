import { Operation, TransformBuilder } from '@orbit/data';
import { useDispatch } from 'react-redux';
import { useGlobal } from 'reactn';
import { findRecord, remoteIdGuid } from '.';
import { MediaFile, OrgKeytermTarget, IApiError } from '../model';
import {
  AddRecord,
  UpdateRecord,
  UpdateRelatedRecord,
  ReplaceRelatedRecord,
} from '../model/baseModel';
import { orbitErr } from '../utils';
import * as actions from '../store';

interface ISaveTerm {
  termTargetId?: string;
  term: string;
  termIndex: number;
  target: string;
  mediaRemId: string;
}

interface IProps {
  cb: () => void;
}

export const useKeyTermSave = ({ cb }: IProps) => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');
  const [org] = useGlobal('organization');
  const dispatch = useDispatch();
  const doOrbitError = (ex: IApiError) => dispatch(actions.doOrbitError(ex));
  return ({
    termTargetId,
    term,
    termIndex: index,
    target,
    mediaRemId,
  }: ISaveTerm) => {
    let mediaRec: MediaFile | undefined = undefined;
    if (mediaRemId) {
      const id =
        remoteIdGuid('mediafile', mediaRemId, memory.keyMap) || mediaRemId;
      mediaRec = findRecord(memory, 'mediafile', id) as MediaFile;
    }

    const t = new TransformBuilder();
    const ops: Operation[] = [];
    var termTargetRec: OrgKeytermTarget;
    if (termTargetId) {
      termTargetRec = findRecord(
        memory,
        'comment',
        termTargetId
      ) as OrgKeytermTarget;
      termTargetRec.attributes.term = term;
      termTargetRec.attributes.termIndex = index;
      termTargetRec.attributes.target = target;
      ops.push(...UpdateRecord(t, termTargetRec, user));
    } else {
      termTargetRec = {
        type: 'orgkeytermtarget',
        attributes: { term, termIndex: index, target },
      } as any;
      ops.push(
        ...AddRecord(t, termTargetRec, user, memory),
        ...ReplaceRelatedRecord(
          t,
          termTargetRec,
          'organization',
          'organization',
          org
        )
      );
    }
    if (mediaRec) {
      ops.push(
        ...UpdateRelatedRecord(
          t,
          termTargetRec,
          'mediafile',
          'mediafile',
          mediaRec.id,
          user
        )
      );
    }
    memory
      .update(ops)
      .then(() => {
        cb && cb();
      })
      .catch((err: Error) => {
        doOrbitError(orbitErr(err, 'attach key term media'));
      });
  };
};
