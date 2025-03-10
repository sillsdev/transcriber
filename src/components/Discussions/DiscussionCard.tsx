import { useEffect, useContext, useMemo, useRef, useState } from 'react';
import { useGlobal } from '../../context/GlobalContext';
import {
  alpha,
  Box,
  BoxProps,
  Button,
  Card,
  CardContent,
  CardProps,
  Chip,
  Grid,
  IconButton,
  IconButtonProps,
  styled,
  SxProps,
  TextField,
  Typography,
} from '@mui/material';
import Confirm from '../AlertDialog';
import {
  Discussion,
  DiscussionD,
  Comment,
  CommentD,
  IDiscussionCardStrings,
  MediaFile,
  ISharedStrings,
  ArtifactCategory,
  Section,
  Plan,
  Passage,
  GroupD,
  UserD,
  OrganizationD,
} from '../../model';
import ResolveIcon from '@mui/icons-material/Check';
import HideIcon from '@mui/icons-material/ArrowDropUp';
import ShowIcon from '@mui/icons-material/ArrowDropDown';
import LocationIcon from '@mui/icons-material/LocationSearching';
import { shallowEqual } from 'react-redux';
import {
  isPersonalTeam,
  PermissionName,
  related,
  usePermissions,
  useRole,
} from '../../crud';
import CommentCard from './CommentCard';
import ReplyCard from './ReplyCard';
import UserAvatar from '../UserAvatar';
import DiscussionMenu from './DiscussionMenu';
import {
  AddRecord,
  ReplaceRelatedRecord,
  UpdateRecord,
  UpdateRelatedRecord,
} from '../../model/baseModel';
import {
  ArtifactCategoryType,
  useArtifactCategory,
} from '../../crud/useArtifactCategory';
import SelectGroup from '../../control/SelectPeerGroup';
import SelectUser from '../../control/SelectUser';
import { LightTooltip, StageReport } from '../../control';
import SelectArtifactCategory, {
  ScriptureEnum,
} from '../Sheet/SelectArtifactCategory';
import { PassageDetailContext } from '../../context/PassageDetailContext';
import {
  removeExtension,
  startEnd,
  useWaitForRemoteQueue,
  waitForIt,
} from '../../utils';
import { useOrgWorkflowSteps } from '../../crud/useOrgWorkflowSteps';
import { NewDiscussionToolId, NewCommentToolId } from './DiscussionList';
import { UnsavedContext } from '../../context/UnsavedContext';
import GroupAvatar from '../GroupAvatar';
import SelectDiscussionAssignment from '../../control/SelectDiscussionAssignment';
import { usePeerGroups } from '../Peers/usePeerGroups';
import { OldVernVersion } from '../../control/OldVernVersion';
import { useSelector } from 'react-redux';
import { discussionCardSelector, sharedSelector } from '../../selector';
import { CommentEditor } from './CommentEditor';
import { useSaveComment } from '../../crud/useSaveComment';
import { useRecordComment } from './useRecordComment';
import BigDialog from '../../hoc/BigDialog';
import { DiscussionMove } from './DiscussionMove';
import { useOrbitData } from '../../hoc/useOrbitData';
import { RecordOperation, RecordTransformBuilder } from '@orbit/records';

const DiscussionCardRoot = styled(Box)<BoxProps>(() => ({
  width: '100%',
  display: 'flex',
  '&:hover button': {
    color: 'black',
  },
  '&:hover button[disabled]': {
    color: 'grey',
  },
  '& .MuiTypography-root': {
    cursor: 'default ',
  },
  '& button': {
    color: 'lightgrey',
  },
  '& .MuiChip-root': {
    backgroundColor: 'lightgrey',
  },
}));

const EditContainer = styled(Box)<BoxProps>(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  display: 'flex',
  flexDirection: 'column',
  flexGrow: 1,
  width: '100%',
}));

// see: https://mui.com/material-ui/customization/how-to-customize/
interface StyledCardProps extends CardProps {
  resolved?: boolean;
  highlight?: boolean;
}
const StyledCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== 'resolved' && prop !== 'highlight',
})<StyledCardProps>(({ resolved, highlight, theme }) => ({
  ...(resolved
    ? {
        margin: theme.spacing(1),
        backgroundColor: 'grey',
        flexGrow: 1,
      }
    : highlight
    ? {
        margin: theme.spacing(1),
        backgroundColor: theme.palette.secondary.light,
        flexGrow: 1,
      }
    : {
        margin: theme.spacing(1),
        backgroundColor: alpha(theme.palette.primary.light, 0.4),
        flexGrow: 1,
      }),
}));

const SmallButton = styled(IconButton)<IconButtonProps>(({ theme }) => ({
  width: theme.spacing(3),
  height: theme.spacing(3),
  color: theme.palette.background.paper,
}));

const topicProps = { mr: 2, alignSelf: 'center' } as SxProps;
const topicItemProps = {
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'row',
} as SxProps;
const titleProps = {
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-between',
  flexGrow: 1,
  flexWrap: 'unset',
} as SxProps;
const titleCtrlProps = { display: 'flex', flexDirection: 'row' } as SxProps;
const cardFlowProps = {
  px: 2,
  bgColor: 'background.paper',
  display: 'flex',
  flexDirection: 'column',
} as SxProps;
const lightButton = { color: 'background.paper' } as SxProps;

interface IProps {
  id: string;
  discussion: DiscussionD;
  collapsed: boolean;
  showStep: boolean;
  showReference: boolean;
  onAddComplete?: (id: string) => void;
  setRef: (ref: any) => void;
  requestHighlight: string;
  refreshList: () => void;
}

export const DiscussionRegion = (discussion: Discussion) => {
  return startEnd(discussion.attributes?.subject);
};

export const DiscussionCard = (props: IProps) => {
  const {
    id,
    discussion,
    collapsed,
    showStep,
    showReference,
    onAddComplete,
    setRef,
    requestHighlight,
    refreshList,
  } = props;
  const comments = useOrbitData<CommentD[]>('comment');
  const mediafiles = useOrbitData<MediaFile[]>('mediafile');
  const passages = useOrbitData<Passage[]>('passage');
  const sections = useOrbitData<Section[]>('section');
  const plans = useOrbitData<Plan[]>('plan');
  const artifactcategorys =
    useOrbitData<ArtifactCategory[]>('artifactcategory');
  const users = useOrbitData<UserD[]>('user');
  const groups = useOrbitData<GroupD[]>('group');
  const teams = useOrbitData<OrganizationD[]>('organization');
  const t: IDiscussionCardStrings = useSelector(
    discussionCardSelector,
    shallowEqual
  );
  const tdcs = t;
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);
  const ctx = useContext(PassageDetailContext);
  const {
    currentstep,
    playerMediafile,
    setPlayerSegments,
    currentSegment,
    handleHighlightDiscussion,
    highlightDiscussion,
    refresh,
  } = ctx.state;
  const {
    toolChanged,
    toolsChanged,
    saveCompleted,
    saveRequested,
    clearRequested,
    clearCompleted,
    startSave,
    startClear,
  } = useContext(UnsavedContext).state;
  const [user] = useGlobal('user');
  const [team] = useGlobal('organization');
  const [memory] = useGlobal('memory');
  const [offline] = useGlobal('offline'); //verified this is not used in a function 2/18/25
  const [offlineOnly] = useGlobal('offlineOnly'); //will be constant here
  const [myComments, setMyComments] = useState<CommentD[]>([]);
  const [showComments, setShowComments] = useState(true);
  const [artifactCategory, setArtifactCategory] = useState('');
  const [step, setStep] = useState('');
  const [reference, setReference] = useState('');
  const [sourceMediafile, setSourceMediafile] = useState<MediaFile>();
  const [editing, setEditing] = useState(false);
  const [confirmAction, setConfirmAction] = useState('');
  const changeRef = useRef(false);
  const [myChanged, setMyChanged] = useState(false);
  const savingRef = useRef(false);
  const [showMove, setShowMove] = useState(false);
  const [moveTo, setMoveTo] = useState<string>();
  const waitForRemoteQueue = useWaitForRemoteQueue();
  const [editSubject, setEditSubject] = useState(
    discussion.attributes?.subject
  );
  const assignedToMeRef = useRef(false);
  const { permissions, canAccess, approvalStatus, getAuthor, hasPermission } =
    usePermissions();
  const { myGroups, citGroup, mentorGroup } = usePeerGroups();
  const [editAssigned, setEditAssigned] = useState<string>('');
  const [editCategory, setEditCategory] = useState('');
  const [editCard, setEditCard] = useState(false);
  const { localizedArtifactCategory } = useArtifactCategory();
  const { localizedWorkStepFromId } = useOrgWorkflowSteps();
  const cardRef = useRef<any>();
  const commentText = useRef('');
  const [comment, setComment] = useState('');
  const commentMediaId = useRef('');
  const [canSaveRecording, setCanSaveRecording] = useState(false);

  const mediafileId = useMemo(() => {
    return playerMediafile?.id ?? '';
  }, [playerMediafile]);

  const myToolId: string = useMemo(() => {
    if (discussion.id) return discussion.id;
    else return NewDiscussionToolId;
  }, [discussion]);

  const afterSaveCommentcb = () => {
    saveCompleted(NewCommentToolId);
  };
  const saveComment = useSaveComment({ cb: afterSaveCommentcb });
  const saveMyComment = async (mediaId: string) => {
    commentMediaId.current = mediaId;
    if (discussion.id) {
      if (commentText.current || commentMediaId.current)
        saveComment(
          discussion.id,
          '',
          commentText.current,
          commentMediaId.current,
          undefined
        );
      else saveCompleted(NewCommentToolId);
      commentText.current = '';
      commentMediaId.current = '';
    }
  };
  const { uploadMedia, fileName } = useRecordComment({
    mediafileId: mediafileId,
    commentNumber: -1,
    afterUploadcb: saveMyComment,
  });

  const [changeAssignment, setChangeAssignment] = useState<
    boolean | undefined
  >();
  const { userIsAdmin } = useRole();

  const handleSelect = (discussion: Discussion) => () => {
    selectDiscussion(discussion);
  };
  const userPrefix = 'u:';
  const groupPrefix = 'g:';

  const handleEditCard = (val: boolean) => {
    if (val !== editCard) setEditCard(val);
  };

  const handleReset = () => {
    setEditSubject('');
    setEditAssigned('');
    setEditCategory('');
    setComment('');
    commentText.current = '';
    setMoveTo(undefined);
  };

  const isPersonal = useMemo(() => isPersonalTeam(team, teams), [teams, team]);

  useEffect(() => {
    if (canSaveRecording) {
      setChanged(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSaveRecording]);

  useEffect(() => {
    if (Boolean(onAddComplete) !== editing) {
      handleReset();
      setEditing(onAddComplete !== undefined);
    }
    if (Boolean(discussion.attributes?.subject) && !Boolean(discussion.id)) {
      //I'm adding but I have a subject already (target segment) so mark as changed
      setChanged(true);
    }
    setEditSubject(discussion.attributes?.subject);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentstep, discussion.id]);

  const myCommentIds = useMemo(() => {
    var myIds = myComments.map((d) => d.id);
    if (discussion.id) myIds.push(discussion.id + 'reply');
    else myIds.push(NewCommentToolId);
    return myIds;
  }, [myComments, discussion]);

  useEffect(() => {
    //if any of my comments are changed, add the discussion to the toolChanged list so DiscussionList will pick it up
    if (!changeRef.current) {
      var anyChanged = Object.keys(toolsChanged).some(
        (t) => myCommentIds.includes(t) && !toolsChanged[t].clearChanged
      );
      if (anyChanged)
        if (discussion.id) toolChanged(myToolId, anyChanged);
        //new discussion and my comment changed so set myChanged also
        else setChanged(true);
      else if (!changeRef.current) saveCompleted(myToolId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolsChanged, myComments, myChanged]);

  useEffect(() => {
    if (changeAssignment === false) {
      handleSave();
      setChangeAssignment(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [changeAssignment]);

  useEffect(() => {
    if (comments) {
      setMyComments(
        comments
          .filter(
            (c) =>
              related(c, 'discussion') === discussion.id &&
              canAccess(c.attributes.visible)
          )
          .sort((a, b) =>
            a.attributes.dateCreated <= b.attributes.dateCreated ? -1 : 1
          )
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comments, discussion.id, permissions]);

  useEffect(() => {
    var a = related(discussion, 'group');
    if (a) setEditAssigned(groupPrefix + a);
    a = related(discussion, 'user');
    if (a) setEditAssigned(userPrefix + a);
  }, [discussion]);

  useEffect(() => {
    if (mediafiles) {
      var u = mediafiles.filter(
        (u) => related(discussion, 'mediafile') === u.id
      );
      if (u.length > 0) setSourceMediafile(u[0]);
      else setSourceMediafile(undefined);
    }
  }, [mediafiles, discussion]);

  useEffect(() => {
    setShowComments(!collapsed && !discussion.attributes.resolved);
  }, [collapsed, discussion.attributes.resolved]);

  useEffect(() => {
    if (artifactcategorys && discussion.relationships?.artifactCategory) {
      var u = artifactcategorys.filter(
        (u) => related(discussion, 'artifactCategory') === u.id
      );
      if (u.length > 0) {
        setArtifactCategory(
          localizedArtifactCategory(u[0].attributes.categoryname)
        );
        return;
      }
    }
    setArtifactCategory('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artifactcategorys, discussion]);

  useEffect(() => {
    if (showStep && discussion.relationships?.orgWorkflowStep) {
      setStep(localizedWorkStepFromId(related(discussion, 'orgWorkflowStep')));
    } else setStep('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discussion, showStep]);

  useEffect(() => {
    if (showReference && discussion.relationships?.mediafile) {
      const mediaId = related(discussion, 'mediafile');
      const mediaRec = mediafiles.find((m) => m.id === mediaId);
      const passageRec = passages.find(
        (p) => p.id === related(mediaRec, 'passage')
      );
      const sectionRec = sections.find(
        (s) => s.id === related(passageRec, 'section')
      );
      const planRec = plans.find(
        (s) => s.id === related(sectionRec, 'plan')
      ) as Plan;
      setReference(
        `${planRec?.attributes?.name || ''} ${
          sectionRec?.attributes?.sequencenum || ''
        }.${passageRec?.attributes?.sequencenum || ''} ${
          passageRec?.attributes?.reference || ''
        }`
      );
    } else setReference('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discussion, showReference]);

  function selectDiscussion(discussion: Discussion) {}
  function discussionDescription() {
    var media = '';
    if (sourceMediafile) {
      const parts = removeExtension(sourceMediafile.attributes.originalFile);
      media = parts.name;
    }
    return `${discussion.attributes?.subject} (${media})`;
  }

  const handleLocateClick = () => {
    handleHighlightDiscussion(myRegion?.start);
  };

  const handleLocate = () => {
    if (myRegion) {
      const regions = JSON.stringify([myRegion]);
      setPlayerSegments(JSON.stringify({ regions }));
    }
  };

  const handleResolveButton = () => {
    handleResolveDiscussion(true);
  };
  const handleResolveDiscussion = (resolved: boolean) => {
    discussion.attributes.resolved = resolved;
    memory.update((t) => UpdateRecord(t, discussion, user));
    refreshList();
  };
  const handleSetSegment = async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    let ops: RecordOperation[] = [];
    let ops2: RecordOperation[] = [];
    let t = new RecordTransformBuilder();

    if (myRegion) {
      const subWords = editSubject.split(' ');
      const prevMedia = related(discussion, 'mediafile') as string;

      if (prevMedia !== mediafileId) {
        const newCmt = {
          type: 'comment',
          attributes: {
            commentText: `${subWords[0]} ${tdcs.earlierVersion}`,
          },
        } as Comment;
        ops2.push(...AddRecord(t, newCmt, user, memory));
        ops2.push(
          ...ReplaceRelatedRecord(
            t,
            newCmt as CommentD,
            'discussion',
            'discussion',
            discussion.id
          )
        );
        ops2.push(
          ...ReplaceRelatedRecord(
            t,
            newCmt as CommentD,
            'mediafile',
            'mediafile',
            prevMedia
          )
        );
      }
      subWords[0] = currentSegment.split(' ')[0];
      discussion.attributes.subject = subWords.join(' ');
    } else {
      discussion.attributes.subject =
        currentSegment + (discussion.attributes?.subject || '');
    }
    ops.push(...UpdateRecord(t, discussion, user));
    ops.push(
      ...UpdateRelatedRecord(
        t,
        discussion,
        'mediafile',
        'mediafile',
        mediafileId,
        user
      )
    );
    await memory.update(ops);
    if (ops2.length > 0) await memory.update(ops2);
    savingRef.current = false;
    setTimeout(() => {
      let start = parseFloat(currentSegment.split('-')[0]);
      if (!isNaN(start)) handleHighlightDiscussion(start);
    }, 2000);
  };

  const handleMove = () => {
    setShowMove(true);
  };

  const moveClose = () => {
    setShowMove(false);
  };

  const handleDoMove = (id: string) => {
    setMoveTo(id);
    setShowMove(false);
    handleDiscussionAction('edit');
    setTimeout(() => setChanged(true), 100);
  };

  const handleDiscussionAction = (what: string) => {
    if (what === 'edit') {
      setEditSubject(discussion.attributes.subject);
      setEditAssigned(currentAssigned());
      setEditCategory(related(discussion, 'artifactCategory') || '');
      setEditing(true);
    } else if (what === 'delete') {
      setConfirmAction(what);
    } else if (what === 'resolve') {
      handleResolveDiscussion(true);
    } else if (what === 'reopen') {
      handleResolveDiscussion(false);
    } else if (what === 'set') {
      handleSetSegment();
    } else if (what === 'move') {
      handleMove();
    }
  };

  const handleDelete = () => {
    var ops: RecordOperation[] = [];
    var t = new RecordTransformBuilder();
    myComments.forEach((c) =>
      ops.push(
        t
          .removeRecord({
            type: 'comment',
            id: c.id,
          })
          .toOperation()
      )
    );
    ops.push(
      t
        .removeRecord({
          type: 'discussion',
          id: discussion.id,
        })
        .toOperation()
    );
    memory.update(ops);
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
  const handleToggleCollapse = () => {
    setShowComments(!showComments);
  };
  const setChanged = (changed: boolean) => {
    if (changed && !myChanged) {
      toolChanged(myToolId);
      setMyChanged(true);
      changeRef.current = true;
    } else if (!changed && myChanged) {
      saveCompleted(myToolId);
      setMyChanged(false);
      changeRef.current = false;
    }
  };
  const handleSubjectChange = (e: any) => {
    if (e.target.value !== editSubject) {
      setEditSubject(e.target.value);
      setChanged(true);
    }
  };
  const handleAssignedChange = (e: string) => {
    setEditAssigned(e);
    setChanged(true);
    setChangeAssignment(false);
  };
  const handleGroupChange = (e: string) => {
    if (groupPrefix + e !== editAssigned) {
      setEditAssigned(groupPrefix + e);
      setChanged(true);
    }
  };
  const handleUserChange = (e: string) => {
    if (userPrefix + e !== editAssigned) {
      setEditAssigned(userPrefix + e);
      setChanged(true);
    }
  };
  const onCategoryChange = (cat: string) => {
    if (cat !== editCategory) {
      setEditCategory(cat);
      setChanged(true);
    }
  };
  const handleSave = async () => {
    //if there is an audio comment, start the upload
    if (canSaveRecording && !commentMediaId.current) {
      startSave(NewCommentToolId);
      await waitForIt(
        'comment upload',
        () => {
          return Boolean(commentMediaId.current);
        },
        () => false,
        500
      );
    }
    if (mediafileId && myChanged) {
      //we should only get here with no subject if they've clicked off the screen and then told us to save with no subject
      discussion.attributes.subject =
        editSubject.length > 0 ? editSubject : tdcs.topic;
      var ops: RecordOperation[] = [];
      var t = new RecordTransformBuilder();
      if (!discussion.id) {
        ops.push(...AddRecord(t, discussion, user, memory));

        ops.push(
          ...UpdateRelatedRecord(
            t,
            discussion,
            'mediafile',
            'mediafile',
            mediafileId,
            user
          )
        );
      } else ops.push(...UpdateRecord(t, discussion, user));
      ops.push(
        ...UpdateRelatedRecord(
          t,
          discussion,
          'orgWorkflowStep',
          'orgworkflowstep',
          moveTo ?? currentstep,
          user
        )
      );
      ops.push(
        ...UpdateRelatedRecord(
          t,
          discussion,
          'artifactCategory',
          'artifactcategory',
          editCategory,
          user
        ),
        ...UpdateRelatedRecord(
          t,
          discussion,
          'group',
          'group',
          assignedGroup?.id ?? '',
          user
        ),
        ...UpdateRelatedRecord(
          t,
          discussion,
          'user',
          'user',
          assignedUser?.id ?? '',
          user
        )
      );
      await memory.update(ops);
    }
    setMoveTo(undefined);
    saveMyComment(commentMediaId.current).then(() => {
      onAddComplete && onAddComplete(discussion.id);
      setEditing(false);
      setEditAssigned('');
      setChanged(false);
    });
  };

  const handleCancel = (e: any) => {
    commentText.current = '';
    commentMediaId.current = '';
    onAddComplete && onAddComplete('');
    setEditing(false);
    setChanged(false);
    setMoveTo(undefined);
    clearCompleted(myToolId);
  };
  const assignedGroup = useMemo(() => {
    return editAssigned.startsWith(groupPrefix)
      ? groups?.find((g) => g.id === editAssigned.substring(groupPrefix.length))
      : undefined;
  }, [editAssigned, groups]);

  const assignedUser = useMemo(() => {
    return editAssigned.startsWith(userPrefix)
      ? users?.find((u) => u.id === editAssigned.substring(userPrefix.length))
      : undefined;
  }, [editAssigned, users]);

  const version = useMemo(() => {
    const mediafile = mediafiles.find(
      (m) => m.id === related(discussion, 'mediafile')
    ) as MediaFile;
    return mediafile?.attributes?.versionNumber || 0;
  }, [discussion, mediafiles]);

  useEffect(() => {
    if (saveRequested(myToolId) && !savingRef.current) {
      myCommentIds.forEach((id) => startSave(id));
      savingRef.current = true;
      handleSave().then(() => {
        waitForRemoteQueue('discussion save').then(() => {
          savingRef.current = false;
        });
      });
    } else if (clearRequested(myToolId)) {
      handleCancel('');
      //if we're coming from unsavedcontext, this will be done already
      //but if we're coming from the discussion filter...we need to do it
      myCommentIds.forEach((id) => startClear(id));
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolsChanged]);

  const myRegion = useMemo(() => {
    return DiscussionRegion(discussion);
  }, [discussion]);

  useEffect(() => {
    //locate my region
    if (highlightDiscussion === undefined) {
      if (discussion.id === requestHighlight) setRef(cardRef);
    } else if (myRegion?.start === highlightDiscussion) {
      handleLocate();
      setRef(cardRef);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightDiscussion, myRegion?.start, refresh, requestHighlight]);

  const currentAssigned = () =>
    related(discussion, 'group')
      ? groupPrefix + related(discussion, 'group')
      : related(discussion, 'user')
      ? userPrefix + related(discussion, 'user')
      : '';

  useEffect(() => {
    const assigned = editAssigned || currentAssigned();
    assignedToMeRef.current =
      assigned === userPrefix + user ||
      myGroups.map((grp) => groupPrefix + grp.id).includes(assigned);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editAssigned, myGroups]);

  useEffect(() => {
    if (assignedToMeRef.current) {
      var sortedByUpdatedDesc = [...myComments];
      sortedByUpdatedDesc.sort((a, b) =>
        a.attributes.dateUpdated > b.attributes.dateUpdated ? -1 : 1
      );
      if (
        sortedByUpdatedDesc.length > 0 &&
        related(sortedByUpdatedDesc[0], 'lastModifiedByUser') === user
      ) {
        //If I'm a CIT, always assign to mentors group
        if (hasPermission(PermissionName.CIT) && mentorGroup) {
          handleGroupChange(mentorGroup.id);
          setChangeAssignment(false);
          //If I'm a mentor, always assign to CIT group
        } else if (hasPermission(PermissionName.Mentor) && citGroup) {
          handleGroupChange(citGroup.id);
          setChangeAssignment(false);
        } else {
          //otherwise find who commented before me...
          for (
            var ix = 0;
            ix < sortedByUpdatedDesc.length &&
            (getAuthor(sortedByUpdatedDesc[ix].attributes.visible) ??
              related(sortedByUpdatedDesc[ix], 'lastModifiedByUser')) === user;
            ix++
          );
          if (ix < sortedByUpdatedDesc.length) {
            handleUserChange(
              getAuthor(sortedByUpdatedDesc[ix].attributes.visible) ??
                related(sortedByUpdatedDesc[ix], 'lastModifiedByUser')
            );
            setChangeAssignment(false);
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myComments]);

  const handleAssignedClick = () => {
    setEditAssigned(currentAssigned());
    setChangeAssignment(!changeAssignment as boolean);
  };
  const handleTextChange = (newText: string) => {
    commentText.current = newText;
    setComment(newText);
    setChanged(true);
  };
  return (
    <DiscussionCardRoot>
      <>
        <StyledCard
          ref={cardRef}
          key={discussion.id}
          id={id}
          resolved={discussion.attributes.resolved}
          highlight={Boolean(
            myRegion?.start && myRegion?.start === highlightDiscussion
          )}
          onClick={handleSelect(discussion)}
        >
          <CardContent
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              color: 'primary.contrastText',
            }}
          >
            {editing ? (
              <EditContainer>
                <TextField
                  autoFocus
                  margin="dense"
                  id={`topic-${discussion.id || 'new'}`}
                  value={editSubject}
                  onChange={handleSubjectChange}
                  placeholder={t.topic}
                  required
                  fullWidth
                />
                {!isPersonal && (
                  <Box sx={{ display: 'flex', flexDirection: 'row' }}>
                    <SelectGroup
                      id={`group-${discussion.id}`}
                      org={false}
                      initGroup={assignedGroup?.id || ''}
                      onChange={handleGroupChange}
                      required={false}
                      label={t.assignGroup}
                    />
                    <Typography
                      variant="h6"
                      component="h2"
                      sx={{ m: 1, mt: 3, color: 'primary.dark' }}
                    >
                      {t.or}
                    </Typography>
                    <SelectUser
                      id={`user-${discussion.id}`}
                      initUser={assignedUser?.id || ''}
                      onChange={handleUserChange}
                      required={false}
                      label={t.assignUser}
                    />
                  </Box>
                )}
                <SelectArtifactCategory
                  id={`category-${discussion.id}`}
                  initCategory={editCategory}
                  onCategoryChange={onCategoryChange}
                  allowNew={userIsAdmin && (!offline || offlineOnly)}
                  required={false}
                  scripture={ScriptureEnum.hide}
                  type={ArtifactCategoryType.Discussion}
                />
                {onAddComplete && (
                  <CommentEditor
                    toolId={NewCommentToolId}
                    comment={commentText.current}
                    refresh={refresh}
                    setCanSaveRecording={setCanSaveRecording}
                    fileName={fileName(editSubject, '')}
                    uploadMethod={uploadMedia}
                    onTextChange={handleTextChange}
                    cancelOnlyIfChanged={true}
                  />
                )}
                <Box sx={{ display: 'flex', flexDirection: 'row' }}>
                  <Button
                    id={`ok-${discussion.id}`}
                    onClick={handleSave}
                    sx={lightButton}
                    disabled={
                      !mediafileId ||
                      editSubject === '' ||
                      !(canSaveRecording || myComments.length > 0 || comment)
                    }
                  >
                    {discussion.id ? ts.save : t.addComment}
                  </Button>
                  <Button
                    id={`cancel-${discussion.id}`}
                    onClick={handleCancel}
                    sx={lightButton}
                  >
                    {ts.cancel}
                  </Button>
                </Box>
              </EditContainer>
            ) : (
              <Grid container sx={titleProps}>
                <Grid item sx={topicItemProps}>
                  {myRegion &&
                    related(discussion, 'mediafile') === mediafileId && (
                      <IconButton
                        id={`locate-${discussion.id}`}
                        size="small"
                        sx={lightButton}
                        title={t.locate}
                        onClick={handleLocateClick}
                      >
                        <LocationIcon fontSize="small" />
                      </IconButton>
                    )}
                  {myRegion &&
                    related(discussion, 'mediafile') !== mediafileId && (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <OldVernVersion
                          id={discussion.id}
                          oldVernVer={version}
                          mediaId={related(discussion, 'mediafile')}
                          text={discussion.attributes?.subject}
                        />
                      </Box>
                    )}
                  <Typography
                    variant="h6"
                    component="h2"
                    sx={topicProps}
                    title={discussionDescription()}
                  >
                    {discussion.attributes?.subject}
                  </Typography>
                </Grid>
                <Grid item sx={titleCtrlProps}>
                  {!isPersonal && assignedGroup && (
                    <LightTooltip title={t.changeAssignment}>
                      <IconButton
                        onClick={handleAssignedClick}
                        sx={{ p: '1px' }}
                      >
                        <GroupAvatar groupRec={assignedGroup} />
                      </IconButton>
                    </LightTooltip>
                  )}
                  {!isPersonal && assignedUser && (
                    <LightTooltip title={t.changeAssignment}>
                      <IconButton
                        onClick={handleAssignedClick}
                        sx={{ p: '1px' }}
                      >
                        <UserAvatar userRec={assignedUser} />
                      </IconButton>
                    </LightTooltip>
                  )}
                  {!isPersonal && changeAssignment && (
                    <SelectDiscussionAssignment
                      id={`group-${discussion.id}`}
                      org={false}
                      initAssignment={editAssigned}
                      onChange={handleAssignedChange}
                      required={false}
                      label={t.assign}
                      userPrefix={userPrefix}
                      groupPrefix={groupPrefix}
                    />
                  )}
                  {!discussion.attributes.resolved && (
                    <IconButton
                      id={`resolveDiscussion-${discussion.id}`}
                      sx={lightButton}
                      title={t.resolved}
                      onClick={handleResolveButton}
                    >
                      <ResolveIcon />
                    </IconButton>
                  )}
                  <DiscussionMenu
                    id={`menu-${discussion.id}`}
                    action={handleDiscussionAction}
                    resolved={discussion.attributes.resolved || false}
                    canSet={Boolean(currentSegment)}
                  />
                </Grid>
              </Grid>
            )}

            <Box
              sx={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <SmallButton
                id={`collapseDiscussion-${discussion.id}`}
                title={t.collapse}
                onClick={handleToggleCollapse}
              >
                {showComments ? <HideIcon /> : <ShowIcon />}
              </SmallButton>
              <Typography variant="body2" component="p">
                {t.comments.replace('{0}', myComments.length.toString())}
              </Typography>
              {artifactCategory && artifactCategory !== '' && (
                <Chip
                  size="small"
                  label={t.category.replace('{0}', artifactCategory)}
                />
              )}
              {step && <StageReport step={step} />}
              {reference && (
                <Typography
                  variant="body2"
                  component="p"
                  title={reference}
                  sx={{ overflow: 'hidden' }}
                >
                  {reference}
                </Typography>
              )}
            </Box>
            {showComments && !onAddComplete && (
              <Grid container sx={cardFlowProps}>
                {myComments.map((i, j) => (
                  <CommentCard
                    key={i.id}
                    comment={i}
                    approvalStatus={approvalStatus(i.attributes?.visible)}
                    discussion={discussion}
                    commentNumber={j}
                    onEditing={handleEditCard}
                  />
                ))}
                {!discussion.attributes.resolved && !editCard && (
                  <ReplyCard
                    discussion={discussion}
                    commentNumber={myComments.length}
                  />
                )}
              </Grid>
            )}
          </CardContent>
        </StyledCard>
        {confirmAction === '' || (
          <Confirm
            text={t.confirmDelete}
            yesResponse={handleActionConfirmed}
            noResponse={handleActionRefused}
          />
        )}
        {showMove && (
          <BigDialog title={t.move} isOpen={showMove} onOpen={moveClose}>
            <DiscussionMove onSelect={handleDoMove} />
          </BigDialog>
        )}
      </>
    </DiscussionCardRoot>
  );
};
export default DiscussionCard;
