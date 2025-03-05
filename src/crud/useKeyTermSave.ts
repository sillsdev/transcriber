import {
  RecordOperation,
  RecordKeyMap,
  RecordTransformBuilder,
  RecordIdentity,
} from '@orbit/records';
import { useDispatch } from 'react-redux';
import { useGlobal } from '../context/GlobalContext';
import { findRecord, remoteIdGuid } from '.';
import {
  MediaFile,
  OrgKeytermTarget,
  IApiError,
  OrgKeytermTargetD,
} from '../model';
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
  return ({ termTargetId, term, termIndex, target, mediaRemId }: ISaveTerm) => {
    let mediaRec: MediaFile | undefined = undefined;
    if (mediaRemId) {
      const id =
        remoteIdGuid('mediafile', mediaRemId, memory?.keyMap as RecordKeyMap) ||
        mediaRemId;
      mediaRec = findRecord(memory, 'mediafile', id) as MediaFile;
    }

    const t = new RecordTransformBuilder();
    const ops: RecordOperation[] = [];
    var termTargetRec: OrgKeytermTarget;
    if (termTargetId) {
      termTargetRec = findRecord(
        memory,
        'comment',
        termTargetId
      ) as OrgKeytermTargetD;
      termTargetRec.attributes.term = term;
      termTargetRec.attributes.termIndex = termIndex;
      termTargetRec.attributes.target = target;
      ops.push(...UpdateRecord(t, termTargetRec as OrgKeytermTargetD, user));
    } else {
      termTargetRec = {
        type: 'orgkeytermtarget',
        attributes: { term, termIndex, target },
      } as any;
      ops.push(
        ...AddRecord(t, termTargetRec, user, memory),
        ...ReplaceRelatedRecord(
          t,
          termTargetRec as RecordIdentity,
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
          termTargetRec as OrgKeytermTargetD,
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
