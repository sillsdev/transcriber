import React, { useState } from 'react';
import { withStyles, Theme } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import TextField from '@material-ui/core/TextField';
import MenuItem from '@material-ui/core/MenuItem';
import Switch from '@material-ui/core/Switch';
import FormLabel from '@material-ui/core/FormLabel';
import FormControl from '@material-ui/core/FormControl';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Button from '@material-ui/core/Button';
import SaveIcon from '@material-ui/icons/Save';

export function ProjectSettings(props: any) {
    const { classes } = props;
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [projectType, setProjectType] = useState('');
    const [bcp47, setBcp47] = useState('en');
    const [languageName, setLanguageName] = useState('English');
    const [defaultFont, setDefaultFont] = useState('');
    const [rtl, setRtl] = useState(false);

    const handleNameChange = (e:any) => { setName(e.target.value) };
    const handleDescriptionChange = (e:any) => { setDescription(e.target.value) };
    const handleTypeChange = (e:any) => { setProjectType(e.target.value) };
    const handleBcp47Change = (e:any) => { alert('Language Picker') };
    const handleLanguageNameChange = (e:any) => { setLanguageName(e.target.value) };
    const handleDefaultFontChange = (e:any) => {
        setDefaultFont(e.target.value)
        setRtl(safeFonts.filter(option => option.label === e.target.value)[0].rtl);
    };
    const handleSave = () => { alert('saving...') }

    const projectTypes = [
        { value: 1, label: 'Oral Drafting' },
        { value: 2, label: 'Audio Scripture' },
    ];

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

    return (
      <div className={classes.container}>
        <Paper className={classes.paper}>
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
                    {projectTypes.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
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
                    label="Language"
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
                    label={"Language Name"}
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
                  <Switch
                    checked={rtl}
                    readOnly
                    color={rtl ? "secondary" : "default"}
                  />
                }
                label="Right to left"
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
        </Paper>
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
  
  export default withStyles(styles, { withTheme: true })(ProjectSettings);