import React, { useContext, useMemo, useRef, useState } from 'react';
import { useEffect, useGlobal } from 'reactn';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import {
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  IconButton,
  TextField,
  Typography,
} from '@material-ui/core';
import Confirm from '../AlertDialog';
import {
  Discussion,
  Comment,
  IDiscussionCardStrings,
  IState,
  Group,
  User,
  MediaFile,
  ISharedStrings,
  ArtifactCategory,
  RoleNames,
  Section,
  Plan,
  Passage,
  GroupMembership,
} from '../../model';
import ResolveIcon from '@mui/icons-material/Check';
import HideIcon from '@mui/icons-material/ArrowDropUp';
import ShowIcon from '@mui/icons-material/ArrowDropDown';
import LocationIcon from '@mui/icons-material/LocationSearching';
import { connect } from 'react-redux';
import localStrings from '../../selector/localize';
import { Operation, QueryBuilder, TransformBuilder } from '@orbit/data';
import { withData } from '../../mods/react-orbitjs';
import { PermissionName, related, usePermissions } from '../../crud';
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
import { useArtifactCategory } from '../../crud/useArtifactCategory';
import SelectGroup from '../../control/SelectPeerGroup';
import SelectUser from '../../control/SelectUser';
import { StageReport } from '../../control';
import SelectArtifactCategory, {
  ScriptureEnum,
} from '../Workflow/SelectArtifactCategory';
import { PassageDetailContext } from '../../context/PassageDetailContext';
import { removeExtension, startEnd, waitForIt } from '../../utils';
import JSONAPISource from '@orbit/jsonapi';
import { useOrgWorkflowSteps } from '../../crud/useOrgWorkflowSteps';
import { NewDiscussionToolId } from './DiscussionList';
import { UnsavedContext } from '../../context/UnsavedContext';
import GroupAvatar from '../GroupAvatar';
import SelectDiscussionAssignment from '../../control/SelectDiscussionAssignment';
import { usePeerGroups } from '../Peers/usePeerGroups';
import { OldVernVersion } from '../../control/OldVernVersion';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
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
    },
    card: {
      margin: theme.spacing(1),
      backgroundColor: theme.palette.primary.light,
      flexGrow: 1,
    },
    highlightedcard: {
      margin: theme.spacing(1),
      backgroundColor: theme.palette.secondary.light,
      flexGrow: 1,
    },
    resolvedcard: {
      margin: theme.spacing(1),
      backgroundColor: 'grey',
      flexGrow: 1,
    },
    content: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      color: theme.palette.primary.contrastText,
    },
    commentCount: {
      width: '100%',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    ref: {
      overflow: 'hidden',
    },
    topicItem: {
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'row',
    },
    topic: {
      marginRight: theme.spacing(2),
      alignSelf: 'center',
    },
    pos: {
      marginBottom: 12,
    },
    title: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      flexGrow: 1,
      flexWrap: 'unset',
    },
    titleControls: {
      display: 'flex',
      flexDirection: 'row',
    },
    row: {
      display: 'flex',
      flexDirection: 'row',
    },
    cardFlow: {
      paddingLeft: theme.spacing(2),
      paddingRight: theme.spacing(2),
      backgroundColor: theme.palette.background.paper,
      display: 'flex',
      flexDirection: 'column',
    },
    actionButton: {
      color: theme.palette.background.paper,
    },
    smallButton: {
      width: theme.spacing(3),
      height: theme.spacing(3),
      color: theme.palette.background.paper,
    },
    textField: {
      marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
      display: 'flex',
      flexGrow: 1,
    },
    menu: {},
    edit: {
      backgroundColor: theme.palette.background.paper,
      display: 'flex',
      flexDirection: 'column',
      flexGrow: 1,
      width: '100%',
    },
    editText: {
      margin: theme.spacing(1),
      marginTop: theme.spacing(3),
      color: theme.palette.primary.dark,
    },
    oldVersion: {
      display: 'flex',
      alignItems: 'center',
    },
  })
);
interface IRecordProps {
  comments: Array<Comment>;
  mediafiles: Array<MediaFile>;
  sections: Array<Section>;
  passages: Array<Passage>;
  plans: Array<Plan>;
  artifactcategorys: Array<ArtifactCategory>;
  groups: Array<Group>;
  users: Array<User>;
  memberships: Array<GroupMembership>;
}
interface IStateProps {
  t: IDiscussionCardStrings;
  ts: ISharedStrings;
}
interface IProps extends IRecordProps, IStateProps {
  id: string;
  discussion: Discussion;
  collapsed: boolean;
  showStep: boolean;
  showReference: boolean;
  onAddComplete?: () => {};
  setRef: (ref: any) => {};
}
export const DiscussionRegion = (discussion: Discussion) => {
  return startEnd(discussion.attributes?.subject);
};

export const DiscussionCard = (props: IProps) => {
  const classes = useStyles();
  const {
    id,
    t,
    ts,
    discussion,
    collapsed,
    showStep,
    showReference,
    onAddComplete,
    setRef,
    comments,
    mediafiles,
    sections,
    passages,
    plans,
    artifactcategorys,
    groups,
    users,
    memberships,
  } = props;
  const tdcs = t;
  const ctx = useContext(PassageDetailContext);
  const {
    currentstep,
    mediafileId,
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
  } = useContext(UnsavedContext).state;
  const [user] = useGlobal('user');
  const [memory] = useGlobal('memory');
  const [projRole] = useGlobal('projRole');
  const [offline] = useGlobal('offline');
  const [offlineOnly] = useGlobal('offlineOnly');
  const [myComments, setMyComments] = useState<Comment[]>([]);
  const [showComments, setShowComments] = useState(true);
  const [artifactCategory, setArtifactCategory] = useState('');
  const [step, setStep] = useState('');
  const [reference, setReference] = useState('');
  const [sourceMediafile, setSourceMediafile] = useState<MediaFile>();
  const [editing, setEditing] = useState(false);
  const [confirmAction, setConfirmAction] = useState('');
  const [coordinator] = useGlobal('coordinator');
  const remote = coordinator.getSource('remote') as JSONAPISource;
  const [myChanged, setMyChanged] = useState(false);
  const savingRef = useRef(false);
  const [editSubject, setEditSubject] = useState(
    discussion.attributes?.subject
  );
  const assignedToMeRef = useRef(false);
  const { permissions, canAccess, approvalStatus, getAuthor, hasPermission } =
    usePermissions({
      users,
      groups,
      memberships,
    });
  const { myGroups, citGroup, mentorGroup } = usePeerGroups({
    users,
    groups,
    memberships,
  });
  const [editAssigned, setEditAssigned] = useState<string>('');
  const [editCategory, setEditCategory] = useState('');
  const [editCard, setEditCard] = useState(false);
  const { localizedArtifactCategory } = useArtifactCategory();
  const { localizedWorkStepFromId } = useOrgWorkflowSteps();
  const cardRef = useRef<any>();
  const myToolId = useMemo(() => {
    if (discussion.id) return discussion.id;
    else return NewDiscussionToolId;
  }, [discussion]);
  const [changeAssignment, setChangeAssignment] = useState<
    boolean | undefined
  >();

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
  };

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

  useEffect(() => {
    //if any of my comments are changed, add the discussion to the toolChanged list so DiscussionList will pick it up
    if (!myChanged) {
      var myIds = myComments.map((d) => d.id);
      myIds.push(discussion.id + 'reply');
      var anyChanged = Object.keys(toolsChanged).some((t) => myIds.includes(t));
      toolChanged(myToolId, anyChanged);
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
    if (comments)
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
    return media;
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
    memory.update((t: TransformBuilder) => UpdateRecord(t, discussion, user));
  };
  const handleSetSegment = async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    let ops: Operation[] = [];
    let ops2: Operation[] = [];
    let t = new TransformBuilder();

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
            newCmt,
            'discussion',
            'discussion',
            discussion.id
          )
        );
        ops2.push(
          ...ReplaceRelatedRecord(
            t,
            newCmt,
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
    }
  };

  const handleDelete = () => {
    var ops: Operation[] = [];
    var t = new TransformBuilder();
    myComments.forEach((c) =>
      ops.push(
        t.removeRecord({
          type: 'comment',
          id: c.id,
        })
      )
    );
    ops.push(
      t.removeRecord({
        type: 'discussion',
        id: discussion.id,
      })
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
    } else if (!changed && myChanged) {
      saveCompleted(myToolId);
      setMyChanged(false);
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
    if (mediafileId && myChanged && editSubject.length > 0) {
      discussion.attributes.subject = editSubject;
      var ops: Operation[] = [];
      var t = new TransformBuilder();
      if (!discussion.id) {
        ops.push(...AddRecord(t, discussion, user, memory));
        ops.push(
          ...UpdateRelatedRecord(
            t,
            discussion,
            'orgWorkflowStep',
            'orgworkflowstep',
            currentstep,
            user
          )
        );
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
    onAddComplete && onAddComplete();
    setTimeout(() => {
      if (myRegion) handleHighlightDiscussion(myRegion.start);
    }, 2000);
    setEditing(false);
    setChanged(false);
  };

  const handleCancel = (e: any) => {
    onAddComplete && onAddComplete();
    setEditing(false);
    setChanged(false);
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
      savingRef.current = true;
      handleSave().then(() => {
        waitForIt(
          'category update',
          () => !remote || remote.requestQueue.length === 0,
          () => offline && !offlineOnly,
          200
        ).then(() => {
          savingRef.current = false;
        });
      });
    } else if (clearRequested(myToolId)) handleCancel('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolsChanged]);

  const myRegion = useMemo(() => {
    return DiscussionRegion(discussion);
  }, [discussion]);

  useEffect(() => {
    //locate my region
    if (highlightDiscussion === undefined) {
      if (id === 'card-0') setRef(cardRef);
    } else if (myRegion?.start === highlightDiscussion) {
      handleLocate();
      setRef(cardRef);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightDiscussion, myRegion?.start, refresh]);

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

  return (
    <div className={classes.root}>
      <Card
        ref={cardRef}
        key={discussion.id}
        id={id}
        className={
          discussion.attributes.resolved
            ? classes.resolvedcard
            : myRegion?.start && myRegion?.start === highlightDiscussion
            ? classes.highlightedcard
            : classes.card
        }
        onClick={handleSelect(discussion)}
      >
        <CardContent className={classes.content}>
          {editing ? (
            <div className={classes.edit}>
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
              <div className={classes.row}>
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
                  className={classes.editText}
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
              </div>
              <SelectArtifactCategory
                id={`category-${discussion.id}`}
                initCategory={editCategory}
                onCategoryChange={onCategoryChange}
                allowNew={
                  projRole === RoleNames.Admin && (!offline || offlineOnly)
                }
                required={false}
                scripture={ScriptureEnum.hide}
                discussion={true}
              />
              <div className={classes.row}>
                <Button
                  id={`ok-${discussion.id}`}
                  onClick={handleSave}
                  className={classes.actionButton}
                  disabled={editSubject === ''}
                >
                  {t.addComment}
                </Button>
                <Button
                  id={`cancel-${discussion.id}`}
                  onClick={handleCancel}
                  className={classes.actionButton}
                >
                  {ts.cancel}
                </Button>
              </div>
            </div>
          ) : (
            <Grid container className={classes.title}>
              <Grid item className={classes.topicItem}>
                {myRegion && related(discussion, 'mediafile') === mediafileId && (
                  <IconButton
                    id={`locate-${discussion.id}`}
                    size="small"
                    className={classes.actionButton}
                    title={t.locate}
                    onClick={handleLocateClick}
                  >
                    <LocationIcon fontSize="small" />
                  </IconButton>
                )}
                {myRegion && related(discussion, 'mediafile') !== mediafileId && (
                  <div className={classes.oldVersion}>
                    <OldVernVersion
                      id={discussion.id}
                      oldVernVer={version}
                      mediaId={related(discussion, 'mediafile')}
                      text={discussion.attributes?.subject}
                    />
                  </div>
                )}
                <Typography
                  variant="h6"
                  component="h2"
                  className={classes.topic}
                  title={discussionDescription()}
                >
                  {discussion.attributes?.subject}
                </Typography>
              </Grid>
              <Grid item className={classes.titleControls}>
                {assignedGroup && (
                  <IconButton onClick={handleAssignedClick}>
                    <GroupAvatar groupRec={assignedGroup} org={false} />
                  </IconButton>
                )}
                {assignedUser && (
                  <IconButton onClick={handleAssignedClick}>
                    <UserAvatar userRec={assignedUser} />
                  </IconButton>
                )}
                {changeAssignment && (
                  <SelectDiscussionAssignment
                    id={`group-${discussion.id}`}
                    org={false}
                    initAssigned={editAssigned}
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
                    className={classes.actionButton}
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

          <div className={classes.commentCount}>
            <IconButton
              id={`collapseDiscussion-${discussion.id}`}
              className={classes.smallButton}
              title={t.collapse}
              onClick={handleToggleCollapse}
            >
              {showComments ? <HideIcon /> : <ShowIcon />}
            </IconButton>
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
                className={classes.ref}
              >
                {reference}
              </Typography>
            )}
          </div>
          {showComments && !onAddComplete && (
            <Grid container className={classes.cardFlow}>
              {myComments.map((i, j) => (
                <CommentCard
                  key={i.id}
                  comment={i}
                  approvalStatus={approvalStatus(i.attributes?.visible)}
                  discussion={discussion}
                  number={j}
                  onEditing={handleEditCard}
                />
              ))}
              {!discussion.attributes.resolved && !editCard && (
                <ReplyCard
                  id={`reply-${discussion.id}`}
                  discussion={discussion}
                  number={myComments.length}
                />
              )}
            </Grid>
          )}
        </CardContent>
      </Card>
      {confirmAction === '' || (
        <Confirm
          text={t.confirmDelete}
          yesResponse={handleActionConfirmed}
          noResponse={handleActionRefused}
        />
      )}
    </div>
  );
};
const mapRecordsToProps = {
  comments: (q: QueryBuilder) => q.findRecords('comment'),
  mediafiles: (q: QueryBuilder) => q.findRecords('mediafile'),
  sections: (q: QueryBuilder) => q.findRecords('section'),
  passages: (q: QueryBuilder) => q.findRecords('passage'),
  plans: (q: QueryBuilder) => q.findRecords('plan'),
  artifactcategorys: (q: QueryBuilder) => q.findRecords('artifactcategory'),
  groups: (q: QueryBuilder) => q.findRecords('group'),
  users: (q: QueryBuilder) => q.findRecords('user'),
  memberships: (q: QueryBuilder) => q.findRecords('groupmembership'),
};
const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'discussionCard' }),
  ts: localStrings(state, { layout: 'shared' }),
});
export default withData(mapRecordsToProps)(
  connect(mapStateToProps)(DiscussionCard) as any
) as any;
