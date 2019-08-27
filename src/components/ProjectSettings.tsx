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
  FormLabel,
  FormControl,
  FormGroup,
  FormControlLabel,
  Button,
  Checkbox,
  Typography,
} from '@material-ui/core';
import SaveIcon from '@material-ui/icons/Save';
import SnackBar from './SnackBar';
import { related } from '../utils';
import LanguagePicker from './LanguagePicker';
import FontSize from './FontSize';

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
    languageField: {
      marginLeft: 0,
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
    sameLine: {
      display: 'flex',
    },
    sameCol: {
      flexDirection: 'column',
    },
    previewCol: {
      marginTop: theme.spacing(2),
    },
    dangerGroup: {
      display: 'flex',
      flexDirection: 'row',
      flexGrow: 1,
      padding: '20px',
      border: '1px solid',
      borderColor: theme.palette.secondary.main,
    },
    grow: {
      flexGrow: 1,
    },
    dangerHeader: {
      paddingBottom: '10px',
    },
    deletePos: {
      alignSelf: 'center',
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
  const { add, projects, projectTypes, groups, t, noMargin, finishAdd } = props;
  const classes = useStyles();
  const [schema] = useGlobal('schema');
  const [memory] = useGlobal('memory');
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
  const [projectGroup, setProjectGroup] = useState('');
  const [message, setMessage] = useState(<></>);
  const langEl = React.useRef<any>();

  const handleNameChange = (e: any) => {
    setName(e.target.value);
  };
  const handleDescriptionChange = (e: any) => {
    setDescription(e.target.value);
  };
  const handleGroupChange = (e: any) => {
    setProjectGroup(e.target.value);
  };
  // const handleDefaultFontChange = (e: any) => {
  //   setDefaultFont(e.target.value);
  //   setRtl(safeFonts.filter(option => option.value === e.target.value)[0].rtl);
  // };
  const handleSize = (v: string) => {
    setDefaultFontSize(v);
  };
  const handleRtlChange = () => {
    setRtl(!rtl);
  };
  const handleMessageReset = () => {
    setMessage(<></>);
  };
  const handleSave = () => {
    memory.update((t: TransformBuilder) => [
      t.replaceRecord({
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
    let project: Project = {
      type: 'project',
      attributes: {
        name: name,
        description: description,
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
    memory.update((t: TransformBuilder) => [
      t.addRecord(project),
      t.replaceRelatedRecord(
        { type: 'project', id: project.id },
        'projecttype',
        {
          type: 'projecttype',
          id: projectType,
        }
      ),
      t.replaceRelatedRecord({ type: 'project', id: project.id }, 'group', {
        type: 'group',
        id: projectGroup ? projectGroup : '',
      }),
      t.replaceRelatedRecord(
        { type: 'project', id: project.id },
        'organization',
        {
          type: 'organization',
          id: organization,
        }
      ),
      t.replaceRelatedRecord({ type: 'project', id: project.id }, 'owner', {
        type: 'user',
        id: user,
      }),
    ]);
    setProject(project.id);
    if (finishAdd) {
      finishAdd();
    }
  };

  const handleDelete = (p: Project | undefined) => () => {
    if (p !== undefined)
      memory.update((t: TransformBuilder) =>
        t.removeRecord({ type: 'project', id: p.id })
      );
  };

  useEffect(() => {
    let proj: Project = {
      type: 'project',
      id: '',
      attributes: {
        name: '',
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
      },
    };
    if (add) {
      setCurrentProject(undefined);
      setProjectGroup('');
    } else {
      const curProj = projects.filter((p: Project) => p.id === project);
      if (curProj.length === 1) {
        proj = curProj[0];
        setProjectGroup(related(proj, 'group'));
      } else {
        setProjectGroup('');
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
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [add, project, projects]);

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
                    setName={setLanguageName}
                    setFont={setDefaultFont}
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
                      onClick={() => langEl.current.click()}
                      onKeyDown={(e: any) => {
                        if (e.keyCode !== 9) langEl.current.click();
                      }}
                      margin="normal"
                      style={{ width: 400 }}
                      variant="filled"
                      required={false}
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
                    />
                  }
                  label=""
                />
              </div>
              <div className={classes.previewCol}>
                <FormLabel className={classes.label}>{t.preview}</FormLabel>
                <div
                  style={{ fontSize: defaultFontSize, fontFamily: defaultFont }}
                >
                  The quick, brown fox jumped over the lazy dog.
                </div>
              </div>
            </div>
          </FormGroup>
        </FormControl>
        <div className={classes.actions}>
          <Button
            key="add"
            aria-label={t.add}
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
            onClick={currentProject === undefined ? handleAdd : handleSave}
          >
            {currentProject === undefined ? t.add : t.save}
            <SaveIcon className={classes.icon} />
          </Button>
        </div>
        <FormLabel className={classes.label}>
          <Typography variant="h5" className={classes.dangerHeader}>
            {t.dangerZone}
          </Typography>
        </FormLabel>
        <FormGroup className={classes.dangerGroup}>
          <div>
            <FormLabel className={classes.label}>
              <Typography variant="h6">{t.deleteProject}</Typography>
            </FormLabel>
            <FormLabel className={classes.label}>
              <p>{t.deleteExplained}</p>
            </FormLabel>
          </div>
          <div className={classes.grow}>{'\u00A0'}</div>
          <div className={classes.deletePos}>
            <Button
              key="delete"
              color="secondary"
              aria-label={t.delete}
              variant="contained"
              className={classes.button}
              disabled={currentProject === undefined}
              onClick={handleDelete(currentProject)}
            >
              {t.delete}
            </Button>
          </div>
        </FormGroup>
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
