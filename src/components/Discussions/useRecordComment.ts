import { QueryBuilder, TransformBuilder } from '@orbit/data';
import { useContext } from 'react';
import { useGlobal } from 'reactn';
import { PassageDetailContext } from '../../context/PassageDetailContext';
import { findRecord, related, remoteIdGuid, useArtifactType } from '../../crud';
import { Discussion, Comment, MediaFile } from '../../model';
import * as actions from '../../store';
import { AddRecord, UpdateRelatedRecord } from '../../model/baseModel';
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
    mediafile: MediaFile
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
    if (mediafile) {
      ops.push(
        ...UpdateRelatedRecord(
          t,
          comment,
          'mediafile',
          'mediafile',
          mediafile.id,
          user
        )
      );
      ops.push(
        ...UpdateRelatedRecord(
          t,
          mediafile,
          'artifactType',
          'artifacttype',
          commentId,
          user
        )
      );
      const passRecId = getPassRec(discussion, mediafile.id);
      ops.push(
        ...UpdateRelatedRecord(
          t,
          mediafile,
          'passage',
          'passage',
          passRecId.id,
          user
        )
      );
    }
    await memory.update(ops);
  };

  const updateCommentMedia = async (
    discussion: Discussion,
    comment: Comment,
    mediafile: MediaFile
  ) => {
    const t = new TransformBuilder();
    if (mediafile) {
      const ops = [];
      ops.push(
        ...UpdateRelatedRecord(
          t,
          comment,
          'mediafile',
          'mediafile',
          mediafile.id,
          user
        )
      );
      ops.push(
        ...UpdateRelatedRecord(
          t,
          mediafile,
          'artifactType',
          'artifacttype',
          commentId,
          user
        )
      );
      const passRecId = getPassRec(discussion, mediafile.id);
      ops.push(
        ...UpdateRelatedRecord(
          t,
          mediafile,
          'passage',
          'passage',
          passRecId.id,
          user
        )
      );
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
      if (mediaRemId && mediaRemId.length > 0) {
        const id =
          remoteIdGuid('mediafile', mediaRemId[0], memory.keyMap) ||
          mediaRemId[0];
        const mediafile = findRecord(memory, 'mediafile', id) as MediaFile;

        if (comment) {
          updateCommentMedia(discussion, comment, mediafile)
            .then(() => {
              cb && cb();
            })
            .catch((err: Error) => {
              doOrbitError(orbitErr(err, 'attach comment media'));
            });
        } else {
          attachNewCommentMedia(discussion, mediafile)
            .then(() => {
              cb && cb();
            })
            .catch((err: Error) => {
              doOrbitError(orbitErr(err, 'attach comment media'));
            });
        }
      }
    });
  };
};
