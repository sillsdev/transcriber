import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { useGlobal } from 'reactn';
import ProjectType from '../model/projectType';
import { connect } from 'react-redux';
import { IState, Project, Group, IProjectSettingsStrings } from '../model';
import localStrings from '../selector/localize';
import { withData, WithDataProps } from 'react-orbitjs';
import { QueryBuilder, TransformBuilder } from '@orbit/data';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import {
  TextField,
  MenuItem,
  Switch,
  FormLabel,
  FormControl,
  FormGroup,
  FormControlLabel,
  Button,
} from '@material-ui/core';
import SaveIcon from '@material-ui/icons/Save';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import SnackBar from './SnackBar';
import remoteId from '../utils/remoteId';
import { related } from '../utils';

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
    },
    group: {
      paddingBottom: theme.spacing(3),
    },
    label: {
      // color: theme.palette.primary.dark,
    },
    info: {
      justifyContent: 'flex-end',
    },
    textField: {
      marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
    },
    dense: {
      marginTop: 16,
    },
    menu: {
      width: 200,
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
    icon: {
      marginLeft: theme.spacing(1),
    },
    moreButton: {
      textDecoration: 'underline',
    },
    smallIcon: {
      marginRight: theme.spacing(1),
      fontSize: 12,
    },
    link: {
      color: theme.palette.primary.contrastText,
    },
  })
);

interface IStateProps {
  t: IProjectSettingsStrings;
}

interface IRecordProps {
  projects: Array<Project>;
  projectTypes: Array<ProjectType>;
  groups: Array<Group>;
}

interface IProps extends IStateProps, IRecordProps, WithDataProps {
  noMargin?: boolean;
  add?: boolean;
  finishAdd?: () => void;
}

export function ProjectSettings(props: IProps) {
  const {
    add,
    projects,
    projectTypes,
    groups,
    updateStore,
    t,
    noMargin,
    finishAdd,
  } = props;
  const classes = useStyles();
  const [schema] = useGlobal('schema');
  const [keyMap] = useGlobal('keyMap');
  const [project, setProject] = useGlobal('project');
  const [user] = useGlobal('user');
  const [organization] = useGlobal('organization');
  const [currentProject, setCurrentProject] = useState<Project | undefined>(
    add
      ? undefined
      : {
          type: 'project',
          id: '',
          attributes: {
            name: '',
            slug: '',
            projectTypeId: 0,
            groupId: 0,
            description: '',
            ownerId: 0,
            organizationId: 0,
            uilanguagebcp47: '',
            language: '',
            languageName: '',
            defaultFont: '',
            defaultFontSize: '',
            rtl: false,
            allowClaim: true,
            isPublic: true,
            dateCreated: '',
            dateUpdated: '',
            dateArchived: '',
          },
        }
  );
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [projectType, setProjectType] = useState('');
  const [bcp47, setBcp47] = useState('und');
  const [languageName, setLanguageName] = useState(bcp47);
  const [defaultFont, setDefaultFont] = useState('');
  const [defaultFontSize, setDefaultFontSize] = useState('large');
  const [rtl, setRtl] = useState(false);
  const [projectGroup, setProjectGroup] = useState('');
  const [message, setMessage] = useState(<></>);

  const handleNameChange = (e: any) => {
    setName(e.target.value);
  };
  const handleDescriptionChange = (e: any) => {
    setDescription(e.target.value);
  };
  const handleTypeChange = (e: any) => {
    setProjectType(e.target.value);
  };
  const handleGroupChange = (e: any) => {
    setProjectGroup(e.target.value);
  };
  const handleBcp47Change = (e: any) => {
    alert('Language Picker');
  };
  const handleLanguageNameChange = (e: any) => {
    setLanguageName(e.target.value);
  };
  const handleDefaultFontChange = (e: any) => {
    setDefaultFont(e.target.value);
    setRtl(safeFonts.filter(option => option.value === e.target.value)[0].rtl);
  };
  const handleDefaultFontSizeChange = (e: any) => {
    setDefaultFontSize(e.target.value);
  };
  const handleRtlChange = () => {
    setRtl(!rtl);
  };
  const handleNeedFont = () => {
    setMessage(
      <span>
        <a
          className={classes.link}
          href="https://community.scripture.software.sil.org/c/transcriber"
        >
          Contact developers
        </a>{' '}
        to request font
      </span>
    );
  };
  const handleMessageReset = () => {
    setMessage(<></>);
  };
  const handleSave = () => {
    const projectTypeId = keyMap.idToKey(
      'projecttype',
      'remoteId',
      projectType
    );
    const groupId = keyMap.idToKey('group', 'remoteId', projectGroup);
    updateStore((t: TransformBuilder) =>
      t.replaceRecord({
        type: 'project',
        id: project,
        attributes: {
          name: name,
          projectTypeId: parseInt(projectTypeId),
          groupId: parseInt(groupId),
          description: description,
          ownerId: currentProject ? currentProject.attributes.ownerId : 0,
          organizationId: currentProject
            ? currentProject.attributes.organizationId
            : 0,
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
          dateCreated: currentProject
            ? currentProject.attributes.dateCreated
            : null,
          dateUpdated: new Date().toISOString(),
        },
      })
    );
    if (projectType) {
      updateStore((t: TransformBuilder) =>
        t.replaceRelatedRecord(
          { type: 'project', id: project },
          'projecttype',
          {
            type: 'projecttype',
            id: projectType,
          }
        )
      );
    }
    if (projectGroup) {
      updateStore((t: TransformBuilder) =>
        t.replaceRelatedRecord({ type: 'project', id: project }, 'group', {
          type: 'group',
          id: projectGroup,
        })
      );
    }
  };
  const handleAdd = () => {
    const userId = remoteId('user', user);
    const organizationId = remoteId('organization', organization);
    const projectTypeId = keyMap.idToKey(
      'projecttype',
      'remoteId',
      projectType
    );
    const groupId = keyMap.idToKey('group', 'remoteId', projectGroup);
    let project: Project = {
      type: 'project',
      attributes: {
        name: name,
        projectTypeId: parseInt(projectTypeId),
        groupId: parseInt(groupId),
        description: description,
        ownerId: userId || 1,
        organizationId: organizationId || 1,
        uilanguagebcp47: null,
        language: bcp47,
        languageName: languageName,
        defaultFont: defaultFont,
        defaultFontSize: defaultFontSize,
        rtl: rtl,
        allowClaim: true,
        isPublic: true,
        dateCreated: new Date().toISOString(),
        dateUpdated: null,
      },
    } as any;
    schema.initializeRecord(project);
    updateStore((t: TransformBuilder) => t.addRecord(project));
    if (projectType) {
      updateStore((t: TransformBuilder) =>
        t.replaceRelatedRecord(
          { type: 'project', id: project.id },
          'projecttype',
          {
            type: 'projecttype',
            id: projectType,
          }
        )
      );
    }
    if (projectGroup) {
      updateStore((t: TransformBuilder) =>
        t.replaceRelatedRecord({ type: 'project', id: project.id }, 'group', {
          type: 'group',
          id: projectGroup,
        })
      );
    }
    setProject(project.id);
    if (finishAdd) {
      finishAdd();
    }
  };

  useEffect(() => {
    const curProj = projects.filter((p: Project) => p.id === project);
    if (curProj.length === 1) {
      setCurrentProject(curProj[0]);
      const attr = curProj[0].attributes;
      setName(attr.name);
      setDescription(attr.description ? attr.description : '');
      setBcp47(attr.language);
      setLanguageName(attr.languageName ? attr.languageName : bcp47);
      setDefaultFont(attr.defaultFont ? attr.defaultFont : '');
      setDefaultFontSize(attr.defaultFontSize ? attr.defaultFontSize : 'large');
      setRtl(attr.rtl);
      setProjectType(related(curProj[0], 'projecttype'));
      setProjectGroup(related(curProj[0], 'group'));
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [project, projects]);

  const safeFonts = [
    { value: 'Noto Sans', label: 'Noto Sans (Recommended)', rtl: false },
    { value: 'Annapurna SIL', label: 'Annapurna SIL (Indic)', rtl: false },
    { value: 'Scheherazade', label: 'Scheherazade (Arabic)', rtl: true },
    { value: 'SimSun', label: 'SimSun (Chinese)', rtl: false },
  ];

  const fontSizes = [
    'xx-small',
    'x-small',
    'small',
    'medium',
    'large',
    'x-large',
    'xx-large',
  ];

  return (
    <div
      className={clsx(classes.container, {
        [classes.fullContainer]: noMargin,
      })}
    >
      <div className={classes.paper}>
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
                  style={{ width: 400 }}
                  variant="filled"
                  required={false}
                />
              }
              label=""
            />
            <FormControlLabel
              control={
                <TextField
                  id="select-project-type"
                  select
                  label={t.projectType}
                  className={classes.textField}
                  value={projectType}
                  onChange={handleTypeChange}
                  SelectProps={{
                    MenuProps: {
                      className: classes.menu,
                    },
                  }}
                  helperText={t.selectProjectType}
                  margin="normal"
                  variant="filled"
                  required={true}
                >
                  {projectTypes.map((option: ProjectType) => (
                    <MenuItem key={option.id} value={option.id}>
                      {option.attributes.name}
                    </MenuItem>
                  ))}
                </TextField>
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
                  SelectProps={{
                    MenuProps: {
                      className: classes.menu,
                    },
                  }}
                  helperText={t.selectProjectGroup}
                  margin="normal"
                  variant="filled"
                  required={true}
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
            <FormControlLabel
              control={
                <TextField
                  id="language-picker"
                  label={t.transcriptionLanguage}
                  defaultValue={bcp47}
                  className={classes.textField}
                  margin="normal"
                  onClick={handleBcp47Change}
                  InputProps={{
                    readOnly: true,
                  }}
                  variant="filled"
                  required={true}
                />
              }
              label=""
            />
            <FormControlLabel
              control={
                <TextField
                  id="language-name"
                  label={t.preferredLanguageName}
                  className={classes.textField}
                  value={languageName}
                  onChange={handleLanguageNameChange}
                  margin="normal"
                  variant="filled"
                  required={true}
                />
              }
              label=""
            />
            <FormLabel className={classes.info}>
              {t.uiLanguagInUserProfile}
            </FormLabel>
          </FormGroup>
          <FormLabel className={classes.label}>{t.textEditor}</FormLabel>
          <FormGroup>
            <FormControlLabel
              control={
                <TextField
                  id="select-default-font"
                  select
                  label={t.defaultFont}
                  className={classes.textField}
                  value={defaultFont}
                  onChange={handleDefaultFontChange}
                  SelectProps={{
                    MenuProps: {
                      className: classes.menu,
                    },
                  }}
                  helperText={
                    <span>
                      <button
                        className={classes.moreButton}
                        onClick={handleNeedFont}
                      >
                        {t.addMissingFont}
                      </button>{' '}
                      <HelpOutlineIcon className={classes.smallIcon} />
                    </span>
                  }
                  margin="normal"
                  variant="filled"
                  required={true}
                >
                  {safeFonts.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              }
              label=""
            />
            <FormControlLabel
              control={
                <TextField
                  id="select-default-font-size"
                  select
                  label={t.defaultFontSize}
                  className={classes.textField}
                  value={defaultFontSize}
                  onChange={handleDefaultFontSizeChange}
                  SelectProps={{
                    MenuProps: {
                      className: classes.menu,
                    },
                  }}
                  helperText={t.selectFontSize}
                  margin="normal"
                  variant="filled"
                >
                  {fontSizes.map((v, i) => (
                    <MenuItem key={i} value={v}>
                      {v}
                    </MenuItem>
                  ))}
                </TextField>
              }
              label=""
            />
            <FormControlLabel
              control={
                <Switch
                  id="switch-rtl"
                  checked={rtl}
                  color="secondary"
                  onChange={handleRtlChange}
                />
              }
              label={t.rightToLeft}
            />
          </FormGroup>
        </FormControl>
        <div className={classes.actions}>
          <Button
            key="add"
            aria-label={t.add}
            variant="contained"
            color="primary"
            className={classes.button}
            onClick={currentProject === undefined ? handleAdd : handleSave}
          >
            {currentProject === undefined ? t.add : t.save}
            <SaveIcon className={classes.icon} />
          </Button>
        </div>
      </div>
      <SnackBar {...props} message={message} reset={handleMessageReset} />
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'projectSettings' }),
});

const mapRecordsToProps = {
  projects: (q: QueryBuilder) => q.findRecords('project'),
  projectTypes: (q: QueryBuilder) => q.findRecords('projecttype'),
  groups: (q: QueryBuilder) => q.findRecords('group'),
};

export default withData(mapRecordsToProps)(connect(mapStateToProps)(
  ProjectSettings
) as any) as any;
