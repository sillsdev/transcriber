import { Operation, TransformBuilder } from '@orbit/data';
import { useDispatch } from 'react-redux';
import { useGlobal } from 'reactn';
import { findRecord, PermissionName, remoteIdGuid, usePermissions } from '.';
import {
  MediaFile,
  Comment,
  GroupMembership,
  Group,
  User,
  IApiError,
} from '../model';
import {
  AddRecord,
  UpdateRecord,
  UpdateRelatedRecord,
  UpdateLastModifiedBy,
  ReplaceRelatedRecord,
} from '../model/baseModel';
import { orbitErr } from '../utils';
import * as actions from '../store';

interface IProps {
  discussion: string;
  cb: () => void;
  users: User[];
  groups: Group[];
  memberships: GroupMembership[];
}

export const useSaveComment = (props: IProps) => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');
  const { users, groups, memberships } = props;
  const dispatch = useDispatch();
  const doOrbitError = (ex: IApiError) => dispatch(actions.doOrbitError(ex));
  const { hasPermission, addAccess, addNeedsApproval, approve } =
    usePermissions({
      users,
      groups,
      memberships,
    });
  const { discussion, cb } = props;
  return (
    commentId: string,
    commentText: string,
    mediaRemId: string,
    approved: boolean | undefined,
    permissions?: string
  ) => {
    var mediafile = undefined;
    if (mediaRemId) {
      const id =
        remoteIdGuid('mediafile', mediaRemId, memory.keyMap) || mediaRemId;
      mediafile = findRecord(memory, 'mediafile', id) as MediaFile;
    }
    interface IIndexable {
      [key: string]: any;
    }
    var visible: IIndexable = {};
    if (approved !== undefined) {
      visible = approve(approved, permissions);
    } else if (
      hasPermission(PermissionName.CIT) ||
      hasPermission(PermissionName.Mentor)
    ) {
      visible = addAccess(
        addAccess(visible, PermissionName.CIT),
        PermissionName.Mentor
      );
      if (hasPermission(PermissionName.CIT))
        visible = addNeedsApproval(visible);
    }

    const t = new TransformBuilder();
    const ops: Operation[] = [];
    var commentRec: Comment;
    if (commentId) {
      commentRec = findRecord(memory, 'comment', commentId) as Comment;
      commentRec.attributes.commentText = commentText;
      commentRec.attributes.visible = JSON.stringify(visible);
      ops.push(...UpdateRecord(t, commentRec, user));
    } else {
      commentRec = {
        type: 'comment',
        attributes: {
          commentText: commentText,
          visible: JSON.stringify(visible),
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
