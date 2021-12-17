import { TransformBuilder } from '@orbit/data';
import { useContext } from 'react';
import { useGlobal } from 'reactn';
import { PassageDetailContext } from '../../context/PassageDetailContext';
import { remoteIdGuid } from '../../crud';
import { Discussion, Comment } from '../../model';
import { AddRecord } from '../../model/baseModel';
import { cleanFileName } from '../../utils';

export const useRecordComment = () => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');
  const { showRecord } = useContext(PassageDetailContext).state;

  return (discussion: Discussion, number: number, cb?: () => void) => {
    const name = `${cleanFileName(
      discussion.attributes?.subject
    )}${discussion.id.slice(0, 4)}-${number}`;
    showRecord(name, '', (planId: string, mediaRemId?: string[]) => {
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
      }
      memory.update(ops);
      cb && cb();
    });
  };
};
