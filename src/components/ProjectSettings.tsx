import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { useGlobal } from 'reactn';
import ProjectType from '../model/projectType';
import * as action from '../store';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import {
  IState,
  Project,
  Role,
  RoleNames,
  Group,
  GroupMembership,
  PlanType,
  IProjectSettingsStrings,
} from '../model';
import localStrings from '../selector/localize';
import { withData, WithDataProps } from 'react-orbitjs';
import { QueryBuilder, TransformBuilder } from '@orbit/data';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import {
  TextField,
  MenuItem,
  FormLabel,
  FormControl,
  FormGroup,
  FormControlLabel,
  Button,
  Checkbox,
  Grid,
  RadioGroup,
  Radio,
} from '@material-ui/core';
import SaveIcon from '@material-ui/icons/Save';
import DeleteExpansion from './DeleteExpansion';
import SnackBar from './SnackBar';
import Confirm from './AlertDialog';
import { related } from '../utils';
import LanguagePicker from './LgPick/LanguagePicker';
import FontSize from './FontSize';
import { API_CONFIG } from '../api-variable';
import { getRoleId, getCreatedBy } from '../utils';
import { SelectPlanType } from '../control';
import { projectShortcut } from './ProjectShortcut';
import { saveNewProject } from '../crud/saveNewProject';
import { CSSProperties } from '@material-ui/core/styles/withStyles';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    container: {
      display: 'flex',
      margin: theme.spacing(4),
    },
    fullContainer: {
      margin: 0,
    },
    paper: {
      paddingLeft: theme.spacing(4),
      paddingRight: theme.spacing(4),
    },
    group: {
      paddingBottom: theme.spacing(3),
    },
    label: {
      // color: theme.palette.primary.dark,
    },
    textField: {
      marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
    },
    languageField: {
      marginLeft: 0,
    },
    menu: {
      width: 200,
    },
    actions: theme.mixins.gutters({
      paddingBottom: 16,
      display: 'flex',
      flexDirection: 'row',
    }) as any,
    next: {
      display: 'flex',
      flexDirection: 'column',
    },
    subHead: {
      marginTop: theme.spacing(2),
      marginBottom: 0,
    },
    button: {
      margin: theme.spacing(1),
    },
    icon: {
      marginLeft: theme.spacing(1),
    },
    sameLine: {
      display: 'flex',
    },
    sameCol: {
      flexDirection: 'column',
    },
    previewCol: {
      marginTop: theme.spacing(2),
    },
    grow: {
      flexGrow: 1,
    },
    stepOption: {
      paddingTop: theme.spacing(1),
    },
    typeSelect: {
      paddingLeft: theme.spacing(1),
    },
  })
);

interface IStateProps {
  t: IProjectSettingsStrings;
  saving: boolean;
}

interface IDispatchProps {
  orbitSaving: typeof action.orbitSaving;
}

interface IRecordProps {
  projects: Array<Project>;
  projectTypes: Array<ProjectType>;
  roles: Array<Role>;
  groups: Array<Group>;
  groupmemberships: Array<GroupMembership>;
  planTypes: Array<PlanType>;
}

export interface IAddArgs {
  to?: string;
  projectId?: string;
  planId?: string;
}

interface IProps
  extends IStateProps,
    IDispatchProps,
    IRecordProps,
    WithDataProps {
  noMargin?: boolean;
  add?: boolean;
  finishAdd?: (props: IAddArgs) => void;
}

enum NextOptions {
  Start = 'start',
  Configure = 'configure',
}

export function ProjectSettings(props: IProps) {
  const {
    add,
    projects,
    projectTypes,
    groups,
    groupmemberships,
    roles,
    planTypes,
    t,
    noMargin,
    finishAdd,
    saving,
    orbitSaving,
  } = props;
  const classes = useStyles();
  const [schema] = useGlobal('schema');
  const [memory] = useGlobal('memory');
  const [keyMap] = useGlobal('keyMap');
  const [orgRole] = useGlobal('orgRole');
  const [projRole] = useGlobal('projRole');
  const [project, setProject] = useGlobal('project');
  const [user] = useGlobal('user');
  const [organization] = useGlobal('organization');
  const [currentProject, setCurrentProject] = useState<Project | undefined>();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [projectType] = useState(
    projectTypes && projectTypes.length > 0 ? projectTypes[0].id : ''
  );
  const [bcp47, setBcp47] = useState('und');
  const [languageName, setLanguageName] = useState(bcp47);
  const [defaultFont, setDefaultFont] = useState('');
  const [defaultFontSize, setDefaultFontSize] = useState('large');
  const [rtl, setRtl] = useState(false);
  const [planType, setPlanType] = useState('');
  const [createdBy, setCreatedBy] = useState('');
  const [projectGroup, setProjectGroup] = useState('');
  const [deleteItem, setDeleteItem] = useState('');
  const [message, setMessage] = useState(<></>);
  const [nextOption, setNextOption] = useState<NextOptions>(NextOptions.Start);
  const langEl = React.useRef<any>();

  const AdminRoleId = getRoleId(roles, RoleNames.Admin);

  const handleNameChange = (e: any) => {
    setName(e.target.value);
  };
  const handleDescriptionChange = (e: any) => {
    setDescription(e.target.value);
  };

  const setGroup = (value: string) => {
    setProjectGroup(value);
    if (value !== '') {
      let gms = groupmemberships.filter(
        gm => related(gm, 'group') === value && related(gm, 'user') === user
      );
      if (gms.length === 0 || related(gms[0], 'role') !== AdminRoleId) {
        setMessage(<span>{t.notAdminInGroup}</span>);
      }
    }
  };
  const handleGroupChange = (e: any) => {
    setGroup(e.target.value);
  };
  const handleSize = (v: string) => {
    setDefaultFontSize(v);
  };
  const handleRtlChange = () => {
    setRtl(!rtl);
  };

  const TAB = 9;
  const SHIFT = 16;
  const CTRL = 17;

  const handleDefaultFont = (e: any) => {
    if (e.keyCode && [TAB, SHIFT, CTRL].includes(e.keyCode)) return;
    langEl.current.click();
  };
  const handleMessageReset = () => {
    setMessage(<></>);
  };
  const handleSave = () => {
    memory.update((t: TransformBuilder) => [
      t.updateRecord({
        type: 'project',
        id: project,
        attributes: {
          name: name,
          description: description,
          uilanguagebcp47: currentProject
            ? currentProject.attributes.uilanguagebcp47
            : 'en',
          language: bcp47,
          languageName: languageName,
          defaultFont: defaultFont,
          defaultFontSize: defaultFontSize,
          rtl: rtl,
          allowClaim: currentProject
            ? currentProject.attributes.allowClaim
            : true,
          isPublic: currentProject ? currentProject.attributes.isPublic : true,
        },
      }),
      t.replaceRelatedRecord({ type: 'project', id: project }, 'projecttype', {
        type: 'projecttype',
        id: projectType,
      }),
      t.replaceRelatedRecord({ type: 'project', id: project }, 'group', {
        type: 'group',
        id: projectGroup ? projectGroup : '',
      }),
      //we aren't allowing them to change owner or oraganization currently
    ]);
  };
  const handleAdd = () => {
    if (saving) return;
    orbitSaving(true);
    saveNewProject({
      name,
      description,
      language: bcp47,
      languageName,
      defaultFont,
      defaultFontSize,
      rtl,
      projectType,
      projectGroup,
      organization,
      user,
      schema,
      memory,
    }).then(project => {
      if (finishAdd) finishAdd({ projectId: project.id });
      orbitSaving(false);
    });
  };
  const handleDelete = () => {
    if (currentProject !== undefined) setDeleteItem(currentProject.id);
  };
  const handleDeleteConfirmed = () => {
    memory.update((t: TransformBuilder) =>
      t.removeRecord({ type: 'project', id: deleteItem })
    );
    setProject('');
    if (finishAdd) {
      finishAdd({});
    }
  };
  const handleDeleteRefused = () => {
    setDeleteItem('');
  };
  const handleLanguageName = (lang: string) => {
    setLanguageName(lang);
    if (name === t.myProject) setName(lang);
  };
  const handleTypeChange = (e: any) => {
    setPlanType(e.target.value);
  };
  const handleNextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNextOption((e.target as HTMLInputElement).value as NextOptions);
  };
  const handleUpload = () => {
    if (saving) return;
    orbitSaving(true);
    saveNewProject({
      name,
      description,
      language: bcp47,
      languageName,
      defaultFont,
      defaultFontSize,
      rtl,
      projectType,
      projectGroup,
      organization,
      user,
      schema,
      memory,
    }).then(project => {
      projectShortcut({
        organization,
        project: project.id,
        planType,
        planTypes,
        planName: t.defaultPlanName,
        sectionName: t.defaultSectionName,
        reference: t.defaultReference,
        schema,
        memory,
        keyMap,
        user,
      }).then(({ url, planId }) => {
        if (finishAdd) finishAdd({ to: url, projectId: project.id, planId });
        orbitSaving(false);
      });
    });
  };

  useEffect(() => {
    let proj = {
      type: 'project',
      id: '',
      attributes: {
        name: t.myProject,
        slug: '',
        description: '',
        uilanguagebcp47: '',
        language: 'und',
        languageName: '',
        defaultFont: '',
        defaultFontSize: '',
        rtl: false,
        allowClaim: true,
        isPublic: true,
        dateCreated: '',
        dateUpdated: '',
        dateArchived: '',
        lastModifiedBy: 0,
      },
    } as Project;
    if (add) {
      setCurrentProject(undefined);
      const allUsers = groups.filter(
        g => related(g, 'owner') === organization && g.attributes.allUsers
      );
      setGroup(allUsers.length > 0 ? allUsers[0].id : '');
    } else {
      const curProj = projects.filter((p: Project) => p.id === project);
      if (curProj.length === 1) {
        proj = curProj[0];
        setGroup(related(proj, 'group'));
      } else {
        setGroup('');
      }
      setCurrentProject(proj);
    }
    const attr = proj.attributes;
    setName(attr.name);
    setDescription(attr.description ? attr.description : '');
    setBcp47(attr.language);
    setLanguageName(attr.languageName ? attr.languageName : bcp47);
    setDefaultFont(attr.defaultFont ? attr.defaultFont : '');
    setDefaultFontSize(attr.defaultFontSize ? attr.defaultFontSize : 'large');
    setRtl(attr.rtl);
    setCreatedBy(getCreatedBy(related(proj, 'owner'), memory));
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [add, project, projects]);

  useEffect(() => {
    if (planType === '') {
      const general = planTypes.filter(
        pt =>
          pt.attributes &&
          pt.attributes.name &&
          /other/i.test(pt.attributes.name)
      );
      if (general.length > 0) setPlanType(general[0].id);
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [planType, planTypes]);

  if (saving) return <></>;

  const widthStyle: CSSProperties = { width: 400 };
  const previewStyle: CSSProperties = {
    fontSize: defaultFontSize,
    fontFamily: defaultFont,
    width: 400,
  };
  const selectProps = { MenuProps: { className: classes.menu } };
  const adminOnly =
    API_CONFIG.isApp || (orgRole !== 'admin' && projRole !== 'admin');

  return (
    <div
      className={clsx(classes.container, {
        [classes.fullContainer]: noMargin,
      })}
    >
      <div className={classes.paper}>
        <Grid container>
          <Grid item>
            <FormControl>
              <FormLabel className={classes.label}>{t.general}</FormLabel>
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
                      variant="filled"
                      required={true}
                      helperText={t.createdBy.replace('{0}', createdBy)}
                      disabled={adminOnly}
                    />
                  }
                  label=""
                />
                <FormControlLabel
                  control={
                    <TextField
                      id="description"
                      label={t.description}
                      className={classes.textField}
                      value={description}
                      onChange={handleDescriptionChange}
                      margin="normal"
                      style={widthStyle}
                      variant="filled"
                      required={false}
                      disabled={adminOnly}
                    />
                  }
                  label=""
                />
                <FormControlLabel
                  control={
                    <TextField
                      id="select-group"
                      select
                      label={t.group}
                      className={classes.textField}
                      value={projectGroup}
                      onChange={handleGroupChange}
                      SelectProps={selectProps}
                      helperText={t.selectProjectGroup}
                      margin="normal"
                      variant="filled"
                      required={true}
                      disabled={adminOnly}
                    >
                      {groups
                        .filter(g => related(g, 'owner') === organization)
                        .sort((i, j) =>
                          i.attributes.name < j.attributes.name ? -1 : 1
                        )
                        .map((option: Group) => (
                          <MenuItem key={option.id} value={option.id}>
                            {option.attributes.name}
                          </MenuItem>
                        ))}
                    </TextField>
                  }
                  label=""
                />
              </FormGroup>
              <FormLabel className={classes.label}>{t.language}</FormLabel>
              <FormGroup className={classes.group}>
                <div className={classes.sameLine}>
                  <FormControlLabel
                    ref={langEl}
                    className={classes.languageField}
                    control={
                      <LanguagePicker
                        value={bcp47}
                        name={languageName}
                        font={defaultFont}
                        setCode={setBcp47}
                        setName={handleLanguageName}
                        setFont={setDefaultFont}
                        disabled={adminOnly}
                      />
                    }
                    label=""
                  />
                  <FormControlLabel
                    className={classes.textField}
                    control={
                      <Checkbox
                        id="checkbox-rtl"
                        checked={rtl}
                        onChange={handleRtlChange}
                        disabled={adminOnly}
                      />
                    }
                    label={t.rightToLeft}
                  />
                </div>
                <div className={classes.sameLine}>
                  <div className={classes.sameCol}>
                    <FormControlLabel
                      control={
                        <TextField
                          id="default-font"
                          label={t.defaultFont}
                          className={classes.textField}
                          value={defaultFont}
                          onClick={handleDefaultFont}
                          onKeyDown={handleDefaultFont}
                          margin="normal"
                          style={widthStyle}
                          variant="filled"
                          required={false}
                          disabled={adminOnly}
                        />
                      }
                      label=""
                    />
                    <br />
                    <FormControlLabel
                      className={classes.textField}
                      control={
                        <FontSize
                          label={t.defaultFontSize}
                          value={defaultFontSize}
                          font={defaultFont}
                          setSize={handleSize}
                          disabled={adminOnly}
                        />
                      }
                      label=""
                    />
                  </div>
                  <div className={classes.previewCol}>
                    <FormLabel className={classes.label}>{t.preview}</FormLabel>
                    <div style={previewStyle}>
                      The quick, brown fox jumped over the lazy dog.
                    </div>
                  </div>
                </div>
              </FormGroup>
            </FormControl>
          </Grid>
          <Grid item>
            {!API_CONFIG.isApp &&
              (orgRole === 'admin' || projRole === 'admin') && (
                <div className={classes.next}>
                  {currentProject === undefined ? (
                    <FormControl>
                      <FormLabel className={classes.label}>
                        {t.nextSteps}
                      </FormLabel>
                      <RadioGroup
                        aria-label={t.nextSteps}
                        value={nextOption}
                        onChange={handleNextChange}
                      >
                        <FormControlLabel
                          value={NextOptions.Start}
                          control={<Radio color="primary" />}
                          label={t.startNow}
                        />
                        <div className={classes.typeSelect}>
                          <SelectPlanType
                            planType={planType}
                            planTypes={planTypes}
                            disable={nextOption !== NextOptions.Start}
                            handleTypeChange={handleTypeChange}
                          />
                        </div>
                        <Button
                          key="upload"
                          aria-label={t.add}
                          variant="contained"
                          color="primary"
                          className={classes.button}
                          disabled={
                            nextOption !== NextOptions.Start ||
                            name === '' ||
                            projectType === '' ||
                            projectGroup === '' ||
                            bcp47 === '' ||
                            bcp47 === 'und' ||
                            defaultFont === '' ||
                            planType === ''
                          }
                          onClick={handleUpload}
                        >
                          {t.upload}
                        </Button>
                        <FormControlLabel
                          value={NextOptions.Configure}
                          control={<Radio color="primary" />}
                          label={t.configure}
                        />
                        <Button
                          key="add"
                          aria-label={t.add}
                          variant="contained"
                          color="primary"
                          className={classes.button}
                          disabled={
                            nextOption !== NextOptions.Configure ||
                            name === '' ||
                            projectType === '' ||
                            projectGroup === '' ||
                            bcp47 === '' ||
                            bcp47 === 'und' ||
                            defaultFont === ''
                          }
                          onClick={handleAdd}
                        >
                          {t.add}
                        </Button>
                      </RadioGroup>
                    </FormControl>
                  ) : (
                    <Button
                      key="save"
                      aria-label={t.save}
                      variant="contained"
                      color="primary"
                      className={classes.button}
                      disabled={
                        name === '' ||
                        projectType === '' ||
                        projectGroup === '' ||
                        bcp47 === '' ||
                        bcp47 === 'und' ||
                        defaultFont === ''
                      }
                      onClick={handleSave}
                    >
                      {t.save}
                      <SaveIcon className={classes.icon} />
                    </Button>
                  )}
                </div>
              )}
          </Grid>
        </Grid>
        {!API_CONFIG.isApp &&
          (orgRole === 'admin' || projRole === 'admin') &&
          currentProject !== undefined && (
            <DeleteExpansion
              title={t.deleteProject}
              explain={t.deleteExplained}
              handleDelete={() => handleDelete()}
            />
          )}
      </div>
      {deleteItem !== '' ? (
        <Confirm
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
  t: localStrings(state, { layout: 'projectSettings' }),
  saving: state.orbit.saving,
});

const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
  ...bindActionCreators(
    {
      orbitSaving: action.orbitSaving,
    },
    dispatch
  ),
});

const mapRecordsToProps = {
  projects: (q: QueryBuilder) => q.findRecords('project'),
  projectTypes: (q: QueryBuilder) => q.findRecords('projecttype'),
  roles: (q: QueryBuilder) => q.findRecords('role'),
  groups: (q: QueryBuilder) => q.findRecords('group'),
  groupmemberships: (q: QueryBuilder) => q.findRecords('groupmembership'),
  planTypes: (q: QueryBuilder) => q.findRecords('plantype'),
};

export default withData(mapRecordsToProps)(
  connect(mapStateToProps, mapDispatchToProps)(ProjectSettings) as any
) as any;
