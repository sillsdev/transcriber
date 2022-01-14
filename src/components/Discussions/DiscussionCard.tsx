import React, { useContext, useState } from 'react';
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
  Role,
  User,
  MediaFile,
  ISharedStrings,
  ArtifactCategory,
  RoleNames,
  Section,
  Plan,
  Passage,
} from '../../model';
import ResolveIcon from '@material-ui/icons/Check';
import HideIcon from '@material-ui/icons/ArrowDropUp';
import ShowIcon from '@material-ui/icons/ArrowDropDown';
import LocationIcon from '@material-ui/icons/LocationSearching';
import { connect } from 'react-redux';
import localStrings from '../../selector/localize';
import { Operation, QueryBuilder, TransformBuilder } from '@orbit/data';
import { withData } from '../../mods/react-orbitjs';
import { related } from '../../crud';
import CommentCard from './CommentCard';
import ReplyCard from './ReplyCard';
import UserAvatar from '../UserAvatar';
import RoleAvatar from '../RoleAvatar';
import DiscussionMenu from './DiscussionMenu';
import {
  AddRecord,
  UpdateRecord,
  UpdateRelatedRecord,
} from '../../model/baseModel';

import { useArtifactCategory } from '../../crud/useArtifactCategory';
import SelectRole from '../../control/SelectRole';
import SelectUser from '../../control/SelectUser';
import SelectArtifactCategory from '../Workflow/SelectArtifactCategory';
import { PassageDetailContext } from '../../context/PassageDetailContext';
import { removeExtension, useRemoteSave, waitForIt } from '../../utils';
import JSONAPISource from '@orbit/jsonapi';
import { useOrgWorkflowSteps } from '../../crud/useOrgWorkflowSteps';

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
    },
    card: {
      margin: theme.spacing(1),
      backgroundColor: theme.palette.primary.light,
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
    },
    editText: {
      margin: theme.spacing(1),
      marginTop: theme.spacing(3),
      color: theme.palette.primary.dark,
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
  roles: Array<Role>;
  users: Array<User>;
}
interface IStateProps {
  t: IDiscussionCardStrings;
  ts: ISharedStrings;
}
interface IProps extends IRecordProps, IStateProps {
  discussion: Discussion;
  collapsed: boolean;
  showStep: boolean;
  showReference: boolean;
  onAddComplete?: () => {};
}

export const DiscussionCard = (props: IProps) => {
  const classes = useStyles();
  const {
    t,
    ts,
    discussion,
    collapsed,
    showStep,
    showReference,
    onAddComplete,
    comments,
    mediafiles,
    sections,
    passages,
    plans,
    artifactcategorys,
    roles,
    users,
  } = props;
  const ctx = useContext(PassageDetailContext);
  const { currentstep, mediafileId, setPlayerSegments } = ctx.state;
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
  const [assignedRole, setAssignedRole] = useState<Role>();
  const [assignedUser, setAssignedUser] = useState<User>();
  const [sourceMediafile, setSourceMediafile] = useState<MediaFile>();
  const [editing, setEditing] = useState(false);
  const [confirmAction, setConfirmAction] = useState('');
  const [coordinator] = useGlobal('coordinator');
  const remote = coordinator.getSource('remote') as JSONAPISource;
  const [changed, setChanged] = useState(false);
  const [doSave] = useGlobal('doSave');
  const [, saveCompleted] = useRemoteSave();
  const [editSubject, setEditSubject] = useState(
    discussion.attributes?.subject
  );
  const [editRole, setEditRole] = useState<string>('');
  const [editUser, setEditUser] = useState<string>('');
  const [editCategory, setEditCategory] = useState('');
  const [editCard, setEditCard] = useState(false);
  const { localizedArtifactCategory } = useArtifactCategory();
  const { localizedWorkStepFromId } = useOrgWorkflowSteps();
  const handleSelect = (discussion: Discussion) => () => {
    selectDiscussion(discussion);
  };

  const handleEditCard = (val: boolean) => {
    if (val !== editCard) setEditCard(val);
  };

  useEffect(() => {
    if (comments)
      setMyComments(
        comments
          .filter((c) => related(c, 'discussion') === discussion.id)
          .sort((a, b) =>
            a.attributes.dateCreated < b.attributes.dateCreated ? -1 : 1
          )
      );
  }, [comments, discussion.id]);

  useEffect(() => {
    if (roles) {
      var r = roles.filter((r) => related(discussion, 'role') === r.id);
      if (r.length > 0) setAssignedRole(r[0]);
      else setAssignedRole(undefined);
    }
  }, [roles, discussion]);

  useEffect(() => {
    if (users) {
      var u = users.filter((u) => related(discussion, 'user') === u.id);
      if (u.length > 0) setAssignedUser(u[0]);
      else setAssignedUser(undefined);
    }
  }, [users, discussion]);

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
        `${planRec.attributes.name} ${sectionRec?.attributes.sequencenum}.${passageRec?.attributes.sequencenum} ${passageRec?.attributes.reference}`
      );
    } else setReference('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discussion, showReference]);

  useEffect(() => {
    setEditing(onAddComplete !== undefined);
    if (onAddComplete) setEditSubject(discussion.attributes?.subject);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onAddComplete]);

  function selectDiscussion(discussion: Discussion) {}
  function discussionDescription() {
    var media = '';
    if (sourceMediafile) {
      const parts = removeExtension(sourceMediafile.attributes.originalFile);
      media = parts.name;
    }
    return media;
  }
  const startEnd = (val: string) =>
    /^([0-9]+\.[0-9])-([0-9]+\.[0-9]) /.exec(val);

  const handleLocate = () => {
    const m = startEnd(discussion.attributes?.subject);
    if (m) {
      const regions = JSON.stringify([
        { start: parseFloat(m[1]), end: parseFloat(m[2]) },
      ]);
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
  const handleDiscussionAction = (what: string) => {
    if (what === 'edit') {
      setEditSubject(discussion.attributes.subject);
      setEditRole(related(discussion, 'role'));
      setEditUser(related(discussion, 'user'));
      setEditCategory(related(discussion, 'artifactCategory'));
      setEditing(true);
    } else if (what === 'delete') {
      setConfirmAction(what);
    } else if (what === 'resolve') {
      handleResolveDiscussion(true);
    } else if (what === 'reopen') {
      handleResolveDiscussion(false);
    }
  };

  const handleReset = () => {
    if (!onAddComplete) setEditSubject('');
    setEditRole('');
    setEditUser('');
    setEditCategory('');
  };

  useEffect(() => {
    handleReset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentstep, onAddComplete]);

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
  const handleSubjectChange = (e: any) => {
    setEditSubject(e.target.value);
    setChanged(true);
  };
  const handleRoleChange = (e: string) => {
    setEditRole(e);
    setEditUser('');
    setChanged(true);
  };
  const handleUserChange = (e: string) => {
    setEditUser(e);
    setEditRole('');
    setChanged(true);
  };
  const onCategoryChange = (cat: string) => {
    setEditCategory(cat);
    setChanged(true);
  };
  const handleSave = async () => {
    if (changed) {
      discussion.attributes.subject = editSubject;
      var ops: Operation[] = [];
      var t = new TransformBuilder();
      if (onAddComplete) {
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
        if (mediafileId)
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
        ...UpdateRelatedRecord(t, discussion, 'role', 'role', editRole, user),
        ...UpdateRelatedRecord(t, discussion, 'user', 'user', editUser, user)
      );
      await memory.update(ops);
    }
    onAddComplete && onAddComplete();
    setEditing(false);
    setChanged(false);
  };
  const handleCancel = (e: any) => {
    onAddComplete && onAddComplete();
    setEditing(false);
    setChanged(false);
  };

  useEffect(() => {
    if (doSave) {
      handleSave().then(() => {
        waitForIt(
          'category update',
          () => !remote || remote.requestQueue.length === 0,
          () => offline && !offlineOnly,
          200
        ).then(() => saveCompleted(''));
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doSave]);

  return (
    <div className={classes.root}>
      <Card
        key={discussion.id}
        id={`card-${discussion.id}`}
        className={
          discussion.attributes.resolved ? classes.resolvedcard : classes.card
        }
        onClick={handleSelect(discussion)}
      >
        <CardContent className={classes.content}>
          {editing ? (
            <div className={classes.edit}>
              <TextField
                autoFocus
                margin="dense"
                id="topic"
                value={editSubject}
                onChange={handleSubjectChange}
                placeholder={t.topic}
                required
                fullWidth
              />
              <div className={classes.row}>
                <SelectRole
                  org={false}
                  initRole={editRole}
                  onChange={handleRoleChange}
                  required={false}
                  label={t.assignRole}
                />
                <Typography
                  variant="h6"
                  component="h2"
                  className={classes.editText}
                >
                  {t.or}
                </Typography>
                <SelectUser
                  initUser={editUser}
                  onChange={handleUserChange}
                  required={false}
                  label={t.assignUser}
                />
              </div>
              <SelectArtifactCategory
                initCategory={editCategory}
                onCategoryChange={onCategoryChange}
                allowNew={
                  projRole === RoleNames.Admin && (!offline || offlineOnly)
                }
                required={false}
              />
              <div className={classes.row}>
                <Button
                  id="ok"
                  onClick={handleSave}
                  className={classes.actionButton}
                  disabled={editSubject === ''}
                >
                  {ts.save}
                </Button>
                <Button
                  id="cancel"
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
                {startEnd(discussion.attributes?.subject) &&
                  related(discussion, 'orgWorkflowStep') === currentstep &&
                  related(discussion, 'mediafile') === mediafileId && (
                    <IconButton
                      id="location"
                      size="small"
                      className={classes.actionButton}
                      title={t.locate}
                      onClick={handleLocate}
                    >
                      <LocationIcon fontSize="small" />
                    </IconButton>
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
                {assignedRole && (
                  <RoleAvatar roleRec={assignedRole} org={false} />
                )}

                {assignedUser && <UserAvatar userRec={assignedUser} />}

                {!discussion.attributes.resolved && (
                  <IconButton
                    id="resolveDiscussion"
                    className={classes.actionButton}
                    title={t.resolved}
                    onClick={handleResolveButton}
                  >
                    <ResolveIcon />
                  </IconButton>
                )}
                <DiscussionMenu
                  action={handleDiscussionAction}
                  resolved={discussion.attributes.resolved || false}
                />
              </Grid>
            </Grid>
          )}
          <div className={classes.commentCount}>
            <Typography variant="body2" component="p">
              {t.comments.replace('{0}', myComments.length.toString())}
            </Typography>
            {artifactCategory && artifactCategory !== '' && (
              <Chip
                size="small"
                label={t.category.replace('{0}', artifactCategory)}
              />
            )}
            {step && <Chip size="small" label={step} />}
            {reference && (
              <Typography variant="body2" component="p">
                {reference}
              </Typography>
            )}
            <IconButton
              id="collapseDiscussion"
              className={classes.smallButton}
              title={t.collapse}
              onClick={handleToggleCollapse}
            >
              {showComments ? <HideIcon /> : <ShowIcon />}
            </IconButton>
          </div>
          {showComments && !onAddComplete && (
            <Grid container className={classes.cardFlow}>
              {myComments.map((i, j) => (
                <CommentCard
                  key={i.id}
                  comment={i}
                  number={j}
                  onEditing={handleEditCard}
                />
              ))}
              {!discussion.attributes.resolved && !editCard && (
                <ReplyCard discussion={discussion} number={myComments.length} />
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
  roles: (q: QueryBuilder) => q.findRecords('role'),
  users: (q: QueryBuilder) => q.findRecords('user'),
};
const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'discussionCard' }),
  ts: localStrings(state, { layout: 'shared' }),
});
export default withData(mapRecordsToProps)(
  connect(mapStateToProps)(DiscussionCard) as any
) as any;
