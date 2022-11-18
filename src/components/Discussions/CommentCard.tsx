import {
  Checkbox,
  FormControlLabel,
  FormLabel,
  Grid,
  GridProps,
  IconButton,
  styled,
  TextField,
  TextFieldProps,
} from '@mui/material';
import { shallowEqual } from 'react-redux';
import {
  Comment,
  Discussion,
  Group,
  GroupMembership,
  ICommentCardStrings,
  MediaFile,
  User,
} from '../../model';
import Confirm from '../AlertDialog';
import { QueryBuilder, TransformBuilder } from '@orbit/data';
import { withData } from 'react-orbitjs';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  findRecord,
  PermissionName,
  related,
  usePermissions,
} from '../../crud';
import PlayIcon from '@mui/icons-material/PlayArrow';
import UserAvatar from '../UserAvatar';
import { dateOrTime } from '../../utils';
import { useGlobal } from 'reactn';
import { CommentEditor } from './CommentEditor';
import DiscussionMenu from './DiscussionMenu';
import { useRecordComment } from './useRecordComment';
import { PassageDetailContext } from '../../context/PassageDetailContext';
import { useSaveComment } from '../../crud/useSaveComment';
import { UnsavedContext } from '../../context/UnsavedContext';
import MediaPlayer from '../MediaPlayer';
import { OldVernVersion } from '../../control/OldVernVersion';
import { useArtifactType } from '../../crud';
import { useSelector } from 'react-redux';
import { commentCardSelector } from '../../selector';

const StyledWrapper = styled('div')(({ theme }) => ({
  display: 'flex',
  flexGrow: 1,
  '&:hover button': {
    color: 'primary',
  },
  '& .MuiTypography-root': {
    cursor: 'default ',
  },
}));

const GridContainerSpread = styled(Grid)<GridProps>(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
}));
const GridContainerRow = styled(Grid)<GridProps>(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
}));
const GridContainerBorderedRow = styled(Grid)<GridProps>(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  borderTop: '1px solid #dfdfdf',
}));
const GridContainerCol = styled(Grid)<GridProps>(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  color: theme.palette.primary.dark,
}));

const StyledText = styled(TextField)<TextFieldProps>(({ theme }) => ({
  wordBreak: 'break-word',
  '& .MuiInput-underline:before': {
    content: 'none',
  },
}));

interface IRecordProps {
  mediafiles: Array<MediaFile>;
  users: Array<User>;
  groups: Array<Group>;
  memberships: Array<GroupMembership>;
}

interface IProps {
  comment: Comment;
  discussion: Discussion;
  number: number;
  onEditing: (val: boolean) => void;
  approvalStatus: boolean | undefined;
}

export const CommentCard = (props: IProps & IRecordProps) => {
  const {
    comment,
    discussion,
    number,
    users,
    groups,
    memberships,
    onEditing,
    approvalStatus,
  } = props;
  const t: ICommentCardStrings = useSelector(commentCardSelector, shallowEqual);
  const [author, setAuthor] = useState<User>();
  const [lang] = useGlobal('lang');
  const [user] = useGlobal('user');
  const [memory] = useGlobal('memory');
  const savingRef = useRef(false);
  const {
    setSelected,
    commentPlaying,
    setCommentPlaying,
    commentPlayId,
    handleCommentPlayEnd,
    handleCommentTogglePlay,
  } = useContext(PassageDetailContext).state;
  const {
    toolChanged,
    toolsChanged,
    saveCompleted,
    saveRequested,
    clearRequested,
  } = useContext(UnsavedContext).state;
  const [editing, setEditing] = useState(false);
  const [canSaveRecording, setCanSaveRecording] = useState(false);
  const [editComment, setEditComment] = useState('');
  const [confirmAction, setConfirmAction] = useState('');
  const [approved, setApprovedx] = useState(approvalStatus);
  const approvedRef = useRef(approvalStatus);
  const { IsVernacularMedia } = useArtifactType();
  const setApproved = (value: boolean) => {
    setApprovedx(value);
    approvedRef.current = value;
  };
  const { getAuthor, hasPermission } = usePermissions({
    users,
    groups,
    memberships,
  });

  const reset = () => {
    setEditing(false);
    onEditing(false);
    setChanged(false);
    savingRef.current = false;
  };
  const setChanged = (changed: boolean) => {
    const valid = editComment !== '' || canSaveRecording;
    toolChanged(comment.id, changed && valid);
  };

  const saveComment = useSaveComment({
    discussion: discussion.id,
    cb: reset,
    users,
    groups,
    memberships,
  });
  const afterUploadcb = (mediaId: string) => {
    saveComment(
      comment.id,
      editComment,
      mediaId,
      approvedRef.current,
      comment.attributes?.visible
    );
  };
  const { uploadMedia, fileName } = useRecordComment({
    discussion,
    number,
    afterUploadcb,
  });
  const text = comment.attributes?.commentText;
  const [mediaId, setMediaId] = useState('');
  const [oldVernVer, setOldVernVer] = useState(0);

  useEffect(() => {
    setEditComment(comment.attributes.commentText);
  }, [comment]);

  useEffect(() => {
    if (saveRequested(comment.id) && !savingRef.current) {
      handleSaveEdit();
    } else if (clearRequested(comment.id)) handleCancelEdit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolsChanged]);

  useEffect(() => {
    if (canSaveRecording) {
      setChanged(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSaveRecording]);

  const handleCommentAction = (what: string) => {
    if (what === 'edit') {
      setEditing(true);
      onEditing(true);
    } else if (what === 'delete') {
      setConfirmAction(what);
    }
  };
  const handleDelete = () => {
    memory.update((t: TransformBuilder) =>
      t.removeRecord({
        type: 'comment',
        id: comment.id,
      })
    );
    reset();
  };

  const handleActionConfirmed = () => {
    if (confirmAction === 'delete') {
      handleDelete();
    }
    setConfirmAction('');
  };

  const handleActionRefused = () => {
    setConfirmAction('');
  };

  const handleSaveEdit = (approvedChange?: boolean) => {
    savingRef.current = true;
    //if we're recording and can save, the comment will save after upload
    if (!canSaveRecording) {
      if (editComment.length > 0 || approvedChange) afterUploadcb('');
      else saveCompleted(comment.id);
    }
  };
  const handleCancelEdit = () => {
    reset();
  };

  const handleTextChange = (newText: string) => {
    setEditComment(newText);
    setChanged(true);
  };
  const handleApprovedChange = () => {
    setApproved(!approvedRef.current);
    handleSaveEdit(true);
  };
  const media = useMemo(() => {
    if (!mediaId || mediaId === '') return null;
    const mediaRec = findRecord(memory, 'mediafile', mediaId) as
      | MediaFile
      | undefined;
    if (mediaRec) {
      if (IsVernacularMedia(mediaRec)) {
        setOldVernVer(mediaRec.attributes?.versionNumber);
      }
    }
    return mediaRec;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comment, mediaId]);

  const handlePlayComment = () => {
    if (mediaId === commentPlayId) setCommentPlaying(!commentPlaying);
    else setSelected(mediaId);
  };

  useEffect(() => {
    if (users) {
      var u = users.filter(
        (u) =>
          u.id ===
          (getAuthor(comment.attributes.visible) ??
            related(comment, 'lastModifiedByUser'))
      );
      if (u.length > 0) setAuthor(u[0]);
    }
    setMediaId(related(comment, 'mediafile'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comment, users]);

  return (
    <StyledWrapper>
      <GridContainerBorderedRow container>
        <GridContainerSpread container>
          <GridContainerRow item>
            <Grid item id="user" sx={{ margin: 1 }}>
              <UserAvatar {...props} userRec={author} />
            </Grid>
            {commentPlayId && mediaId === commentPlayId ? (
              <GridContainerCol item id="commentplayer">
                <MediaPlayer
                  srcMediaId={mediaId === commentPlayId ? commentPlayId : ''}
                  requestPlay={commentPlaying}
                  onEnded={handleCommentPlayEnd}
                  onTogglePlay={handleCommentTogglePlay}
                  controls={mediaId === commentPlayId}
                />
              </GridContainerCol>
            ) : (
              <>
                {media && (!oldVernVer || oldVernVer === 0) && (
                  <IconButton id="playcomment" onClick={handlePlayComment}>
                    <PlayIcon />
                  </IconButton>
                )}
                <GridContainerCol container>
                  <Grid item id="author">
                    {author?.attributes?.name}
                  </Grid>
                  <Grid item id="datecreated">
                    {dateOrTime(comment.attributes.dateUpdated, lang)}
                  </Grid>
                </GridContainerCol>
              </>
            )}
          </GridContainerRow>
          {approvalStatus !== undefined &&
            (hasPermission(PermissionName.Mentor) ? (
              <FormControlLabel
                sx={
                  approved
                    ? { color: 'secondary.light' }
                    : { color: 'warning.dark' }
                }
                control={
                  <Checkbox
                    id="checkbox-approved"
                    checked={approved}
                    onChange={handleApprovedChange}
                  />
                }
                label={approved ? t.approved : t.approve}
                labelPlacement="top"
              />
            ) : (
              !approved && (
                <FormLabel id="unapproved" color="secondary">
                  {t.unapproved}
                </FormLabel>
              )
            ))}
          {mediaId !== commentPlayId && author?.id === user && !oldVernVer && (
            <Grid item>
              <DiscussionMenu action={handleCommentAction} />
            </Grid>
          )}
        </GridContainerSpread>
        <Grid item xs={12}>
          {editing ? (
            <CommentEditor
              toolId={comment.id}
              refresh={0}
              comment={comment.attributes?.commentText}
              onCancel={handleCancelEdit}
              onOk={handleSaveEdit}
              setCanSaveRecording={setCanSaveRecording}
              onTextChange={handleTextChange}
              fileName={fileName}
              uploadMethod={uploadMedia}
            />
          ) : (
            text && (
              <>
                <OldVernVersion
                  id={comment.id}
                  oldVernVer={oldVernVer}
                  mediaId={mediaId}
                  text={text}
                />
                <StyledText
                  id="outlined-textarea"
                  value={text}
                  multiline
                  fullWidth
                  variant="standard"
                />
              </>
            )
          )}
        </Grid>
      </GridContainerBorderedRow>

      {confirmAction === '' || (
        <Confirm
          text={t.confirmDelete}
          yesResponse={handleActionConfirmed}
          noResponse={handleActionRefused}
        />
      )}
    </StyledWrapper>
  );
};
const mapRecordsToProps = {
  mediafiles: (q: QueryBuilder) => q.findRecords('mediafile'),
  users: (q: QueryBuilder) => q.findRecords('user'),
  groups: (q: QueryBuilder) => q.findRecords('group'),
  memberships: (q: QueryBuilder) => q.findRecords('groupmembership'),
};
export default withData(mapRecordsToProps)(CommentCard) as any as (
  props: IProps
) => JSX.Element;
