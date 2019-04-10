import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import Project from './model/project';
import ProjectType from './model/projectType';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { withData } from 'react-orbitjs';
import { QueryBuilder } from '@orbit/data';
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

export class ProjectSettingsData extends React.Component<IRecordProps, object> {
    public render(): JSX.Element {
        return <ProjectSettings {...this.props} />
    }
  }

  interface IProps extends IRecordProps {
      classes?: any;
  }
  
export function ProjectSettings(props: IProps) {
    const { classes, projects, projectTypes } = props;
    const [project, setProject] = useGlobal('project');
    const currentProject = projects.filter((p: Project) => p.id === project)[0];
    const [name, setName] = useState((currentProject && currentProject.attributes.name) || '');
    const [description, setDescription] = useState((currentProject && currentProject.attributes.description) || '');
    const [projectType, setProjectType] = useState('');
    const [uiBcp47, setUiBcp47] = useState((currentProject && currentProject.attributes.uilanguagebcp47) || 'en');
    const [bcp47, setBcp47] = useState((currentProject && currentProject.attributes.language) || 'und');
    const [languageName, setLanguageName] = useState((currentProject && currentProject.attributes.languageName) || bcp47);
    const [defaultFont, setDefaultFont] = useState((currentProject && currentProject.attributes.defaultFont) || '');
    const [defaultFontSize, setDefaultFontSize] = useState((currentProject && currentProject.attributes.defaultFontSize) || 'large');
    const [rtl, setRtl] = useState((currentProject && currentProject.attributes.rtl) || false);
    const [isPublic, setIsPublic] = useState((currentProject && currentProject.attributes.isPublic) || true);

    const handleNameChange = (e:any) => { setName(e.target.value) };
    const handleDescriptionChange = (e:any) => { setDescription(e.target.value) };
    const handleTypeChange = (e:any) => { setProjectType(e.target.value) };
    const handleUiBcp47Change = (e:any) => { alert('Language Picker') };
    const handleBcp47Change = (e:any) => { alert('Language Picker') };
    const handleLanguageNameChange = (e:any) => { setLanguageName(e.target.value) };
    const handleDefaultFontChange = (e:any) => {
        setDefaultFont(e.target.value)
        setRtl(safeFonts.filter(option => option.label === e.target.value)[0].rtl);
    };
    const handleDefaultFontSizeChange = (e:any) => { setDefaultFontSize(e.target.value) };
    const handleRtlChange = () => { setRtl(!rtl) };
    const handleIsPublicChange = () => { setIsPublic(!isPublic) };
    const handleSave = () => { alert('saving...') };

    useEffect(() => {
      if (projectTypes && projectTypes.length !== 0 && currentProject) {
        const t = projectTypes.filter((t: ProjectType) => t.id === currentProject.attributes.projectTypeId.toString());
        if (t.length !== 0) {
          setProjectType(t[0].id);
        }
      }
      
    }, [currentProject])

    const safeFonts = [
        { value: 'Roboto', label: 'Roboto', rtl: false },
        { value: 'Noto Sans', label: 'Noto Sans', rtl: false },
        { value: 'Segoe UI', label: 'Segoe UI', rtl: false },
        { value: 'Charis SIL', label: 'Charis SIL', rtl: false },
        { value: 'Ezra SIL', label: 'Ezra SIL', rtl: true },
        { value: 'Galatia SIL', label: 'Galatia SIL', rtl: false },
        { value: 'Annapurna SIL', label: 'Annapurna SIL', rtl: false },
        { value: 'Scheherazade', label: 'Scheherazade', rtl: true },
        { value: 'SimSun', label: 'SimSun', rtl: false },
    ];

    const fontSizes = [
      "xx-small", "x-small", "small", "medium", "large", "x-large", "xx-large"
    ]

    return (
      <div className={classes.container}>
        <div className={classes.paper}>
          <FormControl>
            <FormLabel>{"General"}</FormLabel>
            <FormGroup>
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
                    id="ui-language-picker"
                    label="User Interface Language"
                    defaultValue={uiBcp47}
                    className={classes.textField}
                    margin="normal"
                    onClick={handleUiBcp47Change}
                    InputProps={{
                      readOnly: true
                    }}
                    variant="filled"
                    required={true}
                  />
                }
                label=""
              />
            </FormGroup>
            <FormLabel className={classes.label}>{"Language"}</FormLabel>
            <FormGroup>
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
              <FormControlLabel
                control={
                  <Switch
                    id="switch-is-public"
                    checked={isPublic}
                    color="default"
                    onChange={handleIsPublicChange}
                  />
                }
                label={"Is Public?"}
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
              onClick={handleSave}
            >
              {'Save'}
              <SaveIcon className={classes.icon} />
            </Button>
            </div>
        </div>
      </div>
    );
}

const styles = (theme: Theme) => ({
    container: {
        display: 'flex',
        margin: theme.spacing.unit * 4,
    },
    paper: {
        paddingTop: theme.spacing.unit * 2,
        paddingLeft: theme.spacing.unit * 4,
    },
    label: {
        paddingTop: theme.spacing.unit * 2,
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
      