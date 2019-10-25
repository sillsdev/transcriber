import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import { connect } from 'react-redux';
import {
  IState,
  Group,
  GroupMembership,
  Project,
  User,
  OrganizationMembership,
  Role,
  Section,
  Plan,
  IGroupSettingsStrings,
} from '../model';
import localStrings from '../selector/localize';
import { withData } from 'react-orbitjs';
import { QueryBuilder, TransformBuilder } from '@orbit/data';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import {
  TextField,
  FormLabel,
  FormControl,
  FormGroup,
  FormControlLabel,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemSecondaryAction,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Grid,
  Typography,
  MenuItem,
} from '@material-ui/core';
import SaveIcon from '@material-ui/icons/Save';
import AddIcon from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import { OptionType } from '../components/ReactSelect';
import UserAvatar from '../components/UserAvatar';
import SnackBar from './SnackBar';
import Confirm from './AlertDialog';
import { related } from '../utils';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    container: {
      display: 'flex',
    },
    grow: {
      flexGrow: 1,
    },
    paper: {
      display: 'flex',
      flexDirection: 'column',
      flexGrow: 1,
      paddingLeft: theme.spacing(4),
    },
    group: {
      paddingBottom: theme.spacing(3),
    },
    label: {
      display: 'flex',
      // color: theme.palette.primary.dark,
    },
    noProjects: {
      width: 400,
      marginLeft: theme.spacing(3),
      backgroundColor: theme.palette.grey[200],
    },
    textField: {
      marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
    },
    dense: {
      marginTop: 16,
    },
    actions: theme.mixins.gutters({
      paddingBottom: 16,
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'flex-end',
    }),
    button: {
      margin: theme.spacing(1),
    },
    addButton: {
      marginRight: theme.spacing(2),
    },
    icon: {
      marginLeft: theme.spacing(1),
    },
    detail: {
      paddingTop: 0,
      marginTop: 0,
    },
    avatar: {
      alignSelf: 'start',
    },
    menu: {
      width: 200,
    },
  })
);

interface IDeleteItem {
  id: string;
  name: string;
}

interface IStateProps {
  t: IGroupSettingsStrings;
  tableLoad: string[];
}

interface IRecordProps {
  groups: Array<Group>;
  groupMemberships: Array<GroupMembership>;
  projects: Array<Project>;
  users: Array<User>;
  orgMemberships: Array<OrganizationMembership>;
  roles: Array<Role>;
  sections: Section[];
  plans: Plan[];
}

interface IProps extends IStateProps, IRecordProps {
  userDetail: boolean;
}

export function GroupSettings(props: IProps) {
  const {
    groups,
    groupMemberships,
    projects,
    users,
    orgMemberships,
    roles,
    sections,
    plans,
    userDetail,
    tableLoad,
    t,
  } = props;
  const [memory] = useGlobal('memory');
  const classes = useStyles();
  const [group, setGroup] = useGlobal('group');
  const [organization] = useGlobal('organization');
  const [project] = useGlobal('project');
  const [schema] = useGlobal('schema');
  const [name, setName] = useState('');
  const [abbreviation, setAbbreviation] = useState('');
  const [message, setMessage] = useState(<></>);
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState('');
  const [detail, setDetail] = useState(userDetail);
  const [currentPerson, setCurrentPerson] = useState<string | null>(null);
  const [orgPeople, setOrgPeople] = useState(Array<OptionType>());
  const [confirmItem, setConfirmItem] = useState<IDeleteItem | null>(null);
  const [loading, setLoading] = useState(false);

  const handleNameChange = (e: any) => {
    setName(e.target.value);
  };
  const handleDescriptionChange = (e: any) => {
    setAbbreviation(e.target.value);
  };
  const handleMessageReset = () => {
    setMessage(<></>);
  };
  const handleSave = () => {
    memory.update((t: TransformBuilder) =>
      t.updateRecord({
        type: 'group',
        id: group,
        attributes: {
          name: name,
          abbreviation: abbreviation,
        },
      } as Group)
    );
    setGroup('');
  };
  const handleRemoveMember = (user: IDeleteItem) => () => {
    setConfirmItem(user);
  };
  const handleDeleteConfirmed = () => {
    const userId = confirmItem ? confirmItem.id : '';
    const ids = groupMemberships
      .filter(
        gm => related(gm, 'group') === group && related(gm, 'user') === userId
      )
      .map(gm => gm.id);
    if (ids.length > 0) {
      memory.update((t: TransformBuilder) =>
        t.removeRecord({ type: 'groupmembership', id: ids[0] })
      );
    }
    setConfirmItem(null);
  };
  const handleDeleteRefused = () => setConfirmItem(null);

  const handleAdd = (role: string) => () => {
    setRole(role);
    setOpen(true);
  };

  const handleCommit = (e: any) => {
    setCurrentPerson(e.target.value);
  };

  const handleCancel = () => {
    setCurrentPerson(null);
    setOpen(false);
  };

  const handleAddMember = async () => {
    setOpen(false);
    const fileRole = role === 'coordinator' ? 'admin' : role;
    const roleRec = roles.filter(
      r => r.attributes.roleName.toLowerCase() === fileRole
    );
    if (roleRec.length === 0) {
      //error
      setMessage(<span>{t.invalidRole}</span>);
      return;
    }
    const groupMemberRec: GroupMembership = {
      type: 'groupmembership',
    } as any;
    schema.initializeRecord(groupMemberRec);
    await memory.update((t: TransformBuilder) => [
      t.addRecord(groupMemberRec),
      t.replaceRelatedRecord(
        { type: 'groupmembership', id: groupMemberRec.id },
        'user',
        { type: 'user', id: currentPerson ? currentPerson : '' }
      ),
      t.replaceRelatedRecord(
        { type: 'groupmembership', id: groupMemberRec.id },
        'group',
        { type: 'group', id: group }
      ),
      t.replaceRelatedRecord(
        { type: 'groupmembership', id: groupMemberRec.id },
        'role',
        { type: 'role', id: roleRec[0].id }
      ),
    ]);
    if (role === 'reviewer') {
      setMessage(<span>{t.allReviewersCanTranscribe}</span>);
    }
  };

  useEffect(() => {
    if (group === '' && userDetail) {
      const curProj = projects.filter(p => p.id === project);
      if (curProj.length === 1) setGroup(related(curProj[0], 'group'));
      setDetail(true);
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [group]);

  useEffect(() => {
    const curGroup = groups.filter((p: Group) => p.id === group);
    if (curGroup.length === 1) {
      const attr = curGroup[0].attributes;
      setName(attr.name);
      setAbbreviation(attr.abbreviation ? attr.abbreviation : '');
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [group, groups]);

  useEffect(() => {
    const allOrgUserIds = orgMemberships
      .filter(om => related(om, 'organization') === organization)
      .map(om => related(om, 'user'));
    const groupUserIds = groupMemberships
      .filter(gm => related(gm, 'group') === group)
      .map(gm => related(gm, 'user'));
    setOrgPeople(
      users
        .filter(
          u =>
            u.attributes &&
            allOrgUserIds.indexOf(u.id) !== -1 &&
            groupUserIds.indexOf(u.id) === -1
        )
        .sort((i, j) => (i.attributes.name < j.attributes.name ? -1 : 1))
        .map(u => {
          return { label: u.attributes.name, value: u.id } as OptionType;
        })
    );
  }, [orgMemberships, groupMemberships, users, organization, group]);

  useEffect(() => {
    if (tableLoad.length > 0 && !tableLoad.includes('section') && !loading) {
      setMessage(<span>{t.loadingTable}</span>);
      setLoading(true);
    } else if (loading) {
      setMessage(<></>);
      setLoading(false);
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [tableLoad]);

  const projectItems = projects
    .filter(p => related(p, 'group') === group)
    .sort((i, j) => (i.attributes.name < j.attributes.name ? -1 : 1))
    .map(p => (
      <ListItem>
        <ListItemText
          primary={p.attributes.name}
          secondary={detail ? p.attributes.languageName : null}
        />
      </ListItem>
    ));

  const projectsRendered = projectItems.length ? (
    projectItems
  ) : (
    <div className={classes.noProjects}>
      <p>{t.groupExplain}</p>
      <ul>
        <li>{t.case1}</li>
        <li>{t.case2}</li>
      </ul>
    </div>
  );

  const adminId = roles
    .filter(r => r.attributes.roleName.toLowerCase() === 'admin')
    .map(r => r.id);
  const coordinatorIds = groupMemberships
    .filter(
      gm => related(gm, 'group') === group && related(gm, 'role') === adminId[0]
    )
    .map(gm => related(gm, 'user'));
  const transcriberId = roles
    .filter(r => r.attributes.roleName.toLowerCase() === 'transcriber')
    .map(r => r.id);
  const reviewerIds = groupMemberships
    .filter(
      gm =>
        related(gm, 'group') === group &&
        related(gm, 'role') !== transcriberId[0]
    )
    .map(gm => related(gm, 'user'));

  const transcriberIds = groupMemberships
    .filter(gm => related(gm, 'group') === group)
    .map(gm => related(gm, 'user'));

  interface IPlanData {
    [plan: string]: string[];
  }

  const getPlan = (sec: Section) => {
    const plan = plans.filter(p => p.id === related(sec, 'plan'));
    if (plan.length < 1 || !plan[0].attributes) return undefined;
    if (related(plan[0], 'project') !== project) return undefined;
    return plan[0].attributes.name;
  };

  const involvement = (user: string, rev: boolean) => {
    let planData: IPlanData = {};
    sections
      .filter(
        s =>
          (rev && related(s, 'reviewer') === user) ||
          (!rev && related(s, 'transcriber') === user)
      )
      .forEach(s => {
        const planName = getPlan(s);
        if (planName) {
          if (planData.hasOwnProperty(planName)) {
            if (!planData[planName].includes(s.id)) {
              planData[planName].push(s.id);
            }
          } else {
            planData[planName] = [s.id];
          }
        }
      });
    return Object.keys(planData)
      .sort((i, j) => (i < j ? -1 : 1))
      .map(p => {
        return (
          <ListItem className={classes.detail}>
            <ListItemText
              primary={
                <>
                  <Typography>- {p}</Typography>
                  <Typography>
                    {t.assignedSections}
                    {planData[p].length}
                  </Typography>
                </>
              }
            />
          </ListItem>
        );
      });
  };

  const getDetail = (user: string, rev: boolean) => {
    const userInvolvement = involvement(user, rev);
    if (userInvolvement && userInvolvement.length > 0)
      return (
        <>
          <Typography>{t.projectPlans}</Typography>
          <List className={classes.detail}>{userInvolvement}</List>
        </>
      );
  };

  const getPersonItems = (ids: Array<string>, rev: boolean) =>
    users
      .filter(u => u.attributes && ids.indexOf(u.id) !== -1)
      .sort((i, j) => (i.attributes.name < j.attributes.name ? -1 : 1))
      .map(u => (
        <ListItem>
          <ListItemAvatar className={classes.avatar}>
            <UserAvatar {...props} userRec={u} />
          </ListItemAvatar>
          <ListItemText
            primary={u.attributes.name}
            secondary={detail ? getDetail(u.id, rev) : null}
          />
          {!detail && (
            <ListItemSecondaryAction>
              <IconButton
                edge="end"
                aria-label="Delete"
                onClick={handleRemoveMember({
                  id: u.id,
                  name: u.attributes.name,
                })}
              >
                <DeleteIcon />
              </IconButton>
            </ListItemSecondaryAction>
          )}
        </ListItem>
      ));

  return (
    <div className={classes.container}>
      <div className={classes.paper}>
        {!detail && (
          <FormControl>
            <FormGroup className={classes.group}>
              <FormControlLabel
                control={
                  <TextField
                    id="name"
                    label={t.name}
                    className={classes.textField}
                    value={name}
                    onChange={handleNameChange}
                    margin="normal"
                    style={{ width: 400 }}
                    variant="filled"
                    required={true}
                  />
                }
                label=""
              />
              <FormControlLabel
                control={
                  <TextField
                    id="abbreviation"
                    label={t.abbreviation}
                    className={classes.textField}
                    value={abbreviation}
                    onChange={handleDescriptionChange}
                    margin="normal"
                    variant="filled"
                    required={false}
                  />
                }
                label=""
              />
            </FormGroup>
            <FormLabel className={classes.label}>{t.projects}</FormLabel>
            <FormGroup className={classes.group}>
              <List dense={true}>{projectsRendered}</List>
            </FormGroup>
          </FormControl>
        )}
        <Grid container spacing={8}>
          <Grid item xs={12} md={4}>
            <FormGroup className={classes.group}>
              <FormLabel className={classes.label}>
                {t.coordinators} <div className={classes.grow}>{'\u00A0'}</div>
                {!detail && (
                  <IconButton
                    size="small"
                    className={classes.addButton}
                    onClick={handleAdd('coordinator')}
                  >
                    <AddIcon />
                  </IconButton>
                )}
              </FormLabel>
              <List dense={true}>{getPersonItems(coordinatorIds, true)}</List>
            </FormGroup>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormGroup className={classes.group}>
              <FormLabel className={classes.label}>
                {t.reviewers} <div className={classes.grow}>{'\u00A0'}</div>
                {!detail && (
                  <IconButton
                    size="small"
                    className={classes.addButton}
                    onClick={handleAdd('reviewer')}
                  >
                    <AddIcon />
                  </IconButton>
                )}
              </FormLabel>
              <List dense={true}>{getPersonItems(reviewerIds, true)}</List>
            </FormGroup>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormGroup className={classes.group}>
              <FormLabel className={classes.label}>
                {t.transcribers} <div className={classes.grow}>{'\u00A0'}</div>
                {!detail && (
                  <IconButton
                    size="small"
                    className={classes.addButton}
                    onClick={handleAdd('transcriber')}
                  >
                    <AddIcon />
                  </IconButton>
                )}
              </FormLabel>
              <List dense={true}>{getPersonItems(transcriberIds, false)}</List>
            </FormGroup>
          </Grid>
        </Grid>
        {!detail && (
          <div className={classes.actions}>
            <Button
              key="save"
              aria-label={t.save}
              variant="contained"
              color="primary"
              className={classes.button}
              onClick={handleSave}
            >
              {t.save}
              <SaveIcon className={classes.icon} />
            </Button>
          </div>
        )}
      </div>
      <Dialog
        open={open}
        onClose={handleCancel}
        aria-labelledby="form-dialog-title"
      >
        <DialogTitle id="form-dialog-title">{t.addGroupMember}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t.addMemberInstruction}</DialogContentText>
          <TextField
            id="choos-group-member"
            select
            value={currentPerson}
            className={classes.menu}
            onChange={handleCommit}
            SelectProps={{
              MenuProps: {
                className: classes.menu,
              },
            }}
            margin="normal"
            variant="filled"
            required
          >
            {orgPeople.map((option: OptionType) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={handleCancel} color="primary">
            {t.cancel}
          </Button>
          <Button
            variant="outlined"
            onClick={handleAddMember}
            color="primary"
            disabled={!currentPerson}
          >
            {t.add}
          </Button>
        </DialogActions>
      </Dialog>
      {confirmItem !== null ? (
        <Confirm
          title={t.delete}
          text={confirmItem.name}
          yesResponse={handleDeleteConfirmed}
          noResponse={handleDeleteRefused}
        />
      ) : (
        <></>
      )}
      <SnackBar {...props} message={message} reset={handleMessageReset} />
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'groupSettings' }),
  tableLoad: state.orbit.tableLoad,
});

const mapRecordsToProps = {
  groups: (q: QueryBuilder) => q.findRecords('group'),
  groupMemberships: (q: QueryBuilder) => q.findRecords('groupmembership'),
  projects: (q: QueryBuilder) => q.findRecords('project'),
  users: (q: QueryBuilder) => q.findRecords('user'),
  orgMemberships: (q: QueryBuilder) => q.findRecords('organizationmembership'),
  roles: (q: QueryBuilder) => q.findRecords('role'),
  sections: (q: QueryBuilder) => q.findRecords('section'),
  plans: (q: QueryBuilder) => q.findRecords('plan'),
};

export default withData(mapRecordsToProps)(connect(mapStateToProps)(
  GroupSettings
) as any) as any;
