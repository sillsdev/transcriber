import { useMemo } from 'react';
import { useGlobal } from '../mods/reactn';
import { Discussion, GroupMembership, MediaFile } from '../model';
import { related } from '../crud';

interface IProps {
  discussions: Discussion[];
  mediafiles: MediaFile[];
  groupmemberships: GroupMembership[];
}

export const useDiscussionCount = ({
  discussions,
  mediafiles,
  groupmemberships,
}: IProps) => {
  const [userId] = useGlobal('user');

  const projGroups = useMemo(() => {
    const mygroups = groupmemberships?.filter(
      (gm) => related(gm, 'user') === userId
    );
    return mygroups?.map((g) => related(g, 'group'));
  }, [groupmemberships, userId]);

  return (passageId: string, stepId: string) => {
    const currentPassage = (d: Discussion) => {
      const mediaId = related(d, 'mediafile');
      const mediaRec = mediafiles.find((m) => m.id === mediaId);
      return mediaRec && related(mediaRec, 'passage') === passageId;
    };
    return discussions.filter(
      (d) =>
        (related(d, 'user') === userId ||
          projGroups?.includes(related(d, 'group'))) &&
        !Boolean(d.attributes?.resolved) &&
        currentPassage(d)
    ).length;
  };
};
