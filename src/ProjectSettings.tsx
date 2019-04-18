import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import Project from './model/project';
import ProjectType from './model/projectType';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { withData } from 'react-orbitjs';
import { QueryBuilder, TransformBuilder } from '@orbit/data';
import Orbit from '@orbit/core';
import { withStyles, Theme } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import MenuItem from '@material-ui/core/MenuItem';
import Switch from '@material-ui/core/Switch';
import FormLabel from '@material-ui/core/FormLabel';
import FormControl from '@material-ui/core/FormControl';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Button from '@material-ui/core/Button';
import SaveIcon from '@material-ui/icons/Save';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import blue from '@material-ui/core/colors/blue';
import yellow from '@material-ui/core/colors/yellow';
import SnackBar from './SnackBar';

export class ProjectSettingsData extends React.Component<IRecordProps, object> {
    public render(): JSX.Element {
        return <ProjectSettings {...this.props} />
    }
  }

  interface IProps extends IRecordProps {
      classes?: any;
      updateStore?: any
  }
  
export function ProjectSettings(props: IProps) {
    const { classes, projects, projectTypes, updateStore } = props;
    const [project, setProject] = useGlobal('project');
    const [user, setUser] = useGlobal('user');
    const [organization, setOrganization] = useGlobal('organization');
    const currentProject = projects.filter((p: Project) => p.id === project)[0];
    const [name, setName] = useState((currentProject && currentProject.attributes.name) || '');
    const [description, setDescription] = useState((currentProject && currentProject.attributes.description) || '');
    const [projectType, setProjectType] = useState('');
    const [bcp47, setBcp47] = useState((currentProject && currentProject.attributes.language) || 'und');
    const [languageName, setLanguageName] = useState((currentProject && currentProject.attributes.languageName) || bcp47);
    const [defaultFont, setDefaultFont] = useState((currentProject && currentProject.attributes.defaultFont) || '');
    const [defaultFontSize, setDefaultFontSize] = useState((currentProject && currentProject.attributes.defaultFontSize) || 'large');
    const [rtl, setRtl] = useState((currentProject && currentProject.attributes.rtl) || false);
    const [message, setMessage] = useState(<></>);

    const handleNameChange = (e:any) => { setName(e.target.value) };
    const handleDescriptionChange = (e:any) => { setDescription(e.target.value) };
    const handleTypeChange = (e:any) => { setProjectType(e.target.value) };
    const handleBcp47Change = (e:any) => { alert('Language Picker') };
    const handleLanguageNameChange = (e:any) => { setLanguageName(e.target.value) };
    const handleDefaultFontChange = (e:any) => {
        setDefaultFont(e.target.value)
        setRtl(safeFonts.filter(option => option.value === e.target.value)[0].rtl);
    };
    const handleDefaultFontSizeChange = (e:any) => { setDefaultFontSize(e.target.value) };
    const handleRtlChange = () => { setRtl(!rtl) };
    const handleNeedFont = () => { setMessage(<span><a className={classes.link} href='https://community.scripture.software.sil.org/c/transcriber'>Contact developers</a> to request font</span>) };
    const handleMessageReset = () => { setMessage(<></>) }
    const handleSave = () => {
      updateStore((t: TransformBuilder) => t.replaceRecord({
        type: 'project',
        id: project,
        attributes: {
          name: name,
          projectTypeId: parseInt(projectType),
          description: description,
          ownerId: currentProject.attributes.ownerId,
          organizationId: currentProject.attributes.organizationId,
          uilanguagebcp47: currentProject.attributes.uilanguagebcp47,
          language: bcp47,
          languageName: languageName,
          defaultFont: defaultFont,
          defaultFontSize: defaultFontSize,
          rtl: rtl,
          allowClaim: currentProject.attributes.allowClaim,
          isPublic: currentProject.attributes.isPublic,
          dateCreated: currentProject.attributes.dateCreated,
          dateUpdated: new Date().toISOString(),
          dateArchived: currentProject.attributes.dateArchived,
        },
      }))
      // if (projectType !== currentProject.attributes.projectTypeId.toString()) {
      //   updateStore((t: TransformBuilder) => t.replaceRelatedRecord(
      //     { type: 'project', id: project },
      //     'type',
      //     { type: 'projecttype', id: projectType }
      //   ))
      // }
    };
    const handleAdd = () => {
      const newId = Orbit.uuid();
      updateStore((t: TransformBuilder) => t.addRecord({
        type: 'project',
        id: newId,
        attributes: {
          name: name,
          projectTypeId: parseInt(projectType),
          description: description,
          ownerId: user || 1,
          organizationId: organization || 1,
          uilanguagebcp47: null,
          language: bcp47,
          languageName: languageName,
          defaultFont: defaultFont,
          defaultFontSize: defaultFontSize,
          rtl: rtl,
          allowClaim: true,
          isPublic: true,
          dateCreated: new Date().toISOString(),
          dateUpdated: new Date().toISOString(),
          dateArchived: null,
        },
      }))
      // updateStore((t: TransformBuilder) => t.replaceRelatedRecord(
      //   { type: 'project', id: newId },
      //   'type',
      //   { type: 'projecttype', id: projectType }
      // ))
      // updateStore((t: TransformBuilder) => t.replaceRelatedRecord(
      //   { type: 'project', id: newId },
      //   'owner',
      //   { type: 'user', id: user || "1" }
      // ))
      // updateStore((t: TransformBuilder) => t.replaceRelatedRecord(
      //   { type: 'project', id: newId },
      //   'organization',
      //   { type: 'organization', id: organization }
      // ))
      setProject(newId);
    };

    useEffect(() => {
      if (projectTypes && projectTypes.length !== 0 && currentProject) {
        const t = projectTypes.filter((t: ProjectType) => (t.keys && t.keys.remoteId || t.id) === currentProject.attributes.projectTypeId.toString());
        if (t.length !== 0) {
          setProjectType((t[0].keys && t[0].keys.remoteId && t[0].keys.remoteId) || t[0].id);
        }
      }
      
    }, [currentProject])

    const safeFonts = [
        { value: 'Noto Sans', label: 'Noto Sans (Recommended)', rtl: false },
        { value: 'Annapurna SIL', label: 'Annapurna SIL (Indic)', rtl: false },
        { value: 'Scheherazade', label: 'Scheherazade (Arabic)', rtl: true },
        { value: 'SimSun', label: 'SimSun (Chinese)', rtl: false },
    ];

    const fontSizes = [
      "xx-small", "x-small", "small", "medium", "large", "x-large", "xx-large"
    ]

    return (
      <div className={classes.container}>
        <div className={classes.paper}>
          <FormControl>
            <FormLabel className={classes.label}>{"General"}</FormLabel>
            <FormGroup className={classes.group}>
              <FormControlLabel
                control={
                  <TextField
                    id="name"
                    label={"Name"}
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
                    label={"Description"}
                    className={classes.textField}
                    value={description}
                    onChange={handleDescriptionChange}
                    margin="normal"
                    style={{width: 400}}
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
                    label={"Project Type"}
                    className={classes.textField}
                    value={projectType}
                    onChange={handleTypeChange}
                    SelectProps={{
                      MenuProps: {
                        className: classes.menu
                      }
                    }}
                    helperText={"Please select your project type"}
                    margin="normal"
                    variant="filled"
                    required={true}
                  >
                    {projectTypes.map((option: ProjectType) => (
                      <MenuItem key={option.id} value={option.keys && option.keys.remoteId || option.id}>
                        {option.attributes.name}
                      </MenuItem>
                    ))}
                  </TextField>
                }
                label=""
              />
            </FormGroup>
            <FormLabel className={classes.label}>{"Language"}</FormLabel>
            <FormGroup className={classes.group}>
              <FormControlLabel
                control={
                  <TextField
                    id="language-picker"
                    label="Transcription Language"
                    defaultValue={bcp47}
                    className={classes.textField}
                    margin="normal"
                    onClick={handleBcp47Change}
                    InputProps={{
                      readOnly: true
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
                    label={"Preferred Language Name"}
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
              <FormLabel className={classes.info}>{"(User interface languages are set in the user profile.)"}</FormLabel>
            </FormGroup>
            <FormLabel className={classes.label}>{"Text Editor"}</FormLabel>
            <FormGroup>
              <FormControlLabel
                control={
                  <TextField
                    id="select-default-font"
                    select
                    label={"Default Font"}
                    className={classes.textField}
                    value={defaultFont}
                    onChange={handleDefaultFontChange}
                    SelectProps={{
                      MenuProps: {
                        className: classes.menu
                      }
                    }}
                    helperText={"Please select the preferred default font"}
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
                control={<Button
                    key="missing-font"
                    aria-label="Need Font"
                    color="secondary"
                    className={classes.moreButton}
                    onClick={handleNeedFont}
                    style={{lineHeight: 1}}
                  >
                    <HelpOutlineIcon className={classes.smallIcon} />
                    {"Can't find the font you need?"}
                  </Button>}
                label=""
              />
              <FormControlLabel
                control={
                  <TextField
                    id="select-default-font-size"
                    select
                    label={"Default Font Size"}
                    className={classes.textField}
                    value={defaultFontSize}
                    onChange={handleDefaultFontSizeChange}
                    SelectProps={{
                      MenuProps: {
                        className: classes.menu
                      }
                    }}
                    helperText={"Please select the default font size"}
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
                label={"Right to left?"}
              />
            </FormGroup>
          </FormControl>
          <div className={classes.actions}>
          <Button
              key="add"
              aria-label="Add"
              variant="contained"
              color="primary"
              className={classes.button}
              onClick={currentProject === undefined? handleAdd: handleSave}
            >
              {currentProject === undefined? 'Add': 'Save'}
              <SaveIcon className={classes.icon} />
            </Button>
            </div>
        </div>
        <SnackBar {...props} message={message} reset={handleMessageReset} />
      </div>
    );
}

const styles = (theme: Theme) => ({
    container: {
        display: 'flex',
        margin: theme.spacing.unit * 4,
    },
    paper: {
        paddingLeft: theme.spacing.unit * 4,
    },
    group: {
      paddingBottom: theme.spacing.unit * 3,
    },
    label: {
        color: blue[500],
    },
    info: {
        justifyContent: 'right',
    },
    textField: {
      marginLeft: theme.spacing.unit,
      marginRight: theme.spacing.unit,
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
        justifyContent: 'right'
      }),
    button: {
      margin: theme.spacing.unit
    },
    icon: {
      marginLeft: theme.spacing.unit
    },
    moreButton: {
    },
    smallIcon: {
      marginRight: theme.spacing.unit,
      fontSize: 12,
    },
    link: {
      color: yellow[500],
    },
    });

const mapStateToProps = () => ({});
const mapDispatchToProps = (dispatch: any) => ({
    ...bindActionCreators({
    }, dispatch),
});
  
interface IRecordProps {
    projects: Array<Project>;
    projectTypes: Array<ProjectType>;
}

const mapRecordsToProps = {
    projects: (q: QueryBuilder) => q.findRecords('project'),
    projectTypes: (q: QueryBuilder) => q.findRecords('projecttype'),
}

export default withStyles(styles, { withTheme: true })(
    withData(mapRecordsToProps)(
        connect(mapStateToProps, mapDispatchToProps)(ProjectSettings) as any
        ) as any
    ) as any;
      