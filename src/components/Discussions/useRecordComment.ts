import { QueryBuilder, TransformBuilder } from '@orbit/data';
import { useContext } from 'react';
import { useGlobal } from 'reactn';
import { PassageDetailContext } from '../../context/PassageDetailContext';
import { related, remoteIdGuid, useArtifactType } from '../../crud';
import { Discussion, Comment, MediaFile } from '../../model';
import * as actions from '../../store';
import { AddRecord } from '../../model/baseModel';
import { cleanFileName, orbitErr } from '../../utils';

interface IDispatchProps {
  doOrbitError: typeof actions.doOrbitError;
}
interface IProps extends IDispatchProps {}

export const useRecordComment = ({ doOrbitError }: IProps) => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');
  const { showRecord } = useContext(PassageDetailContext).state;
  const { commentId } = useArtifactType();

  const getPassRec = (discussion: Discussion, id: string) => {
    const vernMediaId = related(discussion, 'mediafile');
    const vernRecId = { type: 'mediafile', id: vernMediaId };
    const vernRec = memory.cache.query((q: QueryBuilder) =>
      q.findRecord(vernRecId)
    ) as MediaFile;
    const passageId = related(vernRec, 'passage') as string;
    return { type: 'passage', id: passageId };
  };

  const attachNewCommentMedia = async (
    discussion: Discussion,
    mediaRemId?: string[]
  ) => {
    const comment: Comment = {
      type: 'comment',
      attributes: {
        commentText: '',
      },
    } as any;
    const t = new TransformBuilder();
    const ops = [
      ...AddRecord(t, comment, user, memory),
      t.replaceRelatedRecord(comment, 'discussion', discussion),
    ];
    if (mediaRemId && mediaRemId.length > 0) {
      const id =
        remoteIdGuid('mediafile', mediaRemId[0], memory.keyMap) ||
        mediaRemId[0];
      const recId = { type: 'mediafile', id };
      ops.push(t.replaceRelatedRecord(comment, 'mediafile', recId));
      const cmtRecId = { type: 'artifacttype', id: commentId };
      ops.push(t.replaceRelatedRecord(recId, 'artifactType', cmtRecId));
      const passRecId = getPassRec(discussion, id);
      ops.push(t.replaceRelatedRecord(recId, 'passage', passRecId));
    }
    await memory.update(ops);
  };

  const updateCommentMedia = async (
    discussion: Discussion,
    comment: Comment,
    mediaRemId?: string[]
  ) => {
    const t = new TransformBuilder();
    if (mediaRemId && mediaRemId.length > 0) {
      const ops = [];
      const id =
        remoteIdGuid('mediafile', mediaRemId[0], memory.keyMap) ||
        mediaRemId[0];
      const recId = { type: 'mediafile', id };
      ops.push(t.replaceRelatedRecord(comment, 'mediafile', recId));
      const cmtRecId = { type: 'artifacttype', id: commentId };
      ops.push(t.replaceRelatedRecord(recId, 'artifactType', cmtRecId));
      const passRecId = getPassRec(discussion, id);
      ops.push(t.replaceRelatedRecord(recId, 'passage', passRecId));
      await memory.update(ops);
    }
  };

  return (
    discussion: Discussion,
    number: number,
    comment: Comment | null,
    cb?: () => void
  ) => {
    const name = `${cleanFileName(
      discussion.attributes?.subject
    )}${discussion.id.slice(0, 4)}-${number}`;
    showRecord(name, '', (planId: string, mediaRemId?: string[]) => {
      if (comment) {
        updateCommentMedia(discussion, comment, mediaRemId)
          .then(() => {
            cb && cb();
          })
          .catch((err: Error) => {
            doOrbitError(orbitErr(err, 'attach comment media'));
          });
      } else {
        attachNewCommentMedia(discussion, mediaRemId)
          .then(() => {
            cb && cb();
          })
          .catch((err: Error) => {
            doOrbitError(orbitErr(err, 'attach comment media'));
          });
      }
    });
  };
};
