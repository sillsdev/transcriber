import { useMemo } from 'react';
import { useGlobal } from 'reactn';
import { Discussion, MediaFile } from '../model';
import { related, useRole } from '../crud';

interface IProps {
  discussions: Discussion[];
  mediafiles: MediaFile[];
}

export const useDiscussionCount = ({ discussions, mediafiles }: IProps) => {
  const [userId] = useGlobal('user');
  const [projRole] = useGlobal('projRole');
  const { getRoleRec } = useRole();

  const projRoleId = useMemo(
    () => {
      if (!projRole) return '';
      const roleRec = getRoleRec(projRole, false);
      return roleRec.length > 0 ? roleRec[0].id : '';
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [projRole]
  );

  return (passageId: string, stepId: string) => {
    const currentPassage = (d: Discussion) => {
      const mediaId = related(d, 'mediafile');
      const mediaRec = mediafiles.find((m) => m.id === mediaId);
      return mediaRec && related(mediaRec, 'passage') === passageId;
    };

    return discussions.filter(
      (d) =>
        (related(d, 'user') === userId || related(d, 'role') === projRoleId) &&
        !Boolean(d.attributes?.resolved) &&
        currentPassage(d) &&
        related(d, 'orgWorkflowStep') === stepId
    ).length;
  };
};
