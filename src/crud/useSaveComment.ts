import { Operation, TransformBuilder } from '@orbit/data';
import { useGlobal } from 'reactn';
import { findRecord, remoteIdGuid } from '.';
import { MediaFile, Comment } from '../model';
import {
  AddRecord,
  UpdateRecord,
  UpdateRelatedRecord,
  UpdateLastModifiedBy,
  ReplaceRelatedRecord,
} from '../model/baseModel';
import { orbitErr } from '../utils';
import * as actions from '../store';

interface IDispatchProps {
  doOrbitError: typeof actions.doOrbitError;
}
interface IProps extends IDispatchProps {
  discussion: string;
  cb: () => void;
}

export const useSaveComment = (props: IProps) => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');
  const { discussion, cb, doOrbitError } = props;
  return (commentId: string, commentText: string, mediaRemId: string) => {
    var mediafile = undefined;
    if (mediaRemId) {
      const id =
        remoteIdGuid('mediafile', mediaRemId, memory.keyMap) || mediaRemId;
      mediafile = findRecord(memory, 'mediafile', id) as MediaFile;
    }
    const t = new TransformBuilder();
    const ops: Operation[] = [];
    var commentRec: Comment;
    if (commentId) {
      commentRec = findRecord(memory, 'comment', commentId) as Comment;
      commentRec.attributes.commentText = commentText;
      ops.push(...UpdateRecord(t, commentRec, user));
    } else {
      commentRec = {
        type: 'comment',
        attributes: {
          commentText: commentText,
        },
      } as Comment;
      ops.push(
        ...AddRecord(t, commentRec, user, memory),
        ...ReplaceRelatedRecord(
          t,
          commentRec,
          'discussion',
          'discussion',
          discussion
        )
      );
    }
    ops.push(
      ...UpdateLastModifiedBy(t, { type: 'discussion', id: discussion }, user)
    );
    if (mediafile) {
      ops.push(
        ...UpdateRelatedRecord(
          t,
          commentRec,
          'mediafile',
          'mediafile',
          mediafile.id,
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
        doOrbitError(orbitErr(err, 'attach comment media'));
      });
  };
};
