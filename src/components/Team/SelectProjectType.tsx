import React from 'react';
import { ProjectType } from '../../model';
import { makeStyles } from '@material-ui/core/styles';
import { TextField, MenuItem } from '@material-ui/core';
import { TeamContext } from '../../context/TeamContext';

const useStyles = makeStyles({
  menu: {
    width: 200,
  },
});

interface IProps {
  projectType: string;
  disable?: boolean;
  handleTypeChange: (e: any) => void;
}
export const SelectProjectType = (props: IProps) => {
  const { projectType, handleTypeChange, disable } = props;
  const classes = useStyles();
  const ctx = React.useContext(TeamContext);
  const { projectTypes, controlStrings } = ctx.state;

  const t = controlStrings;

  return (
    <div>
      <TextField
        id="select-project-type"
        select
        label={t.contentType}
        className={classes.menu}
        value={projectType}
        onChange={handleTypeChange}
        SelectProps={{
          MenuProps: {
            className: classes.menu,
          },
        }}
        disabled={disable}
        margin="normal"
        variant="filled"
        required
      >
        {projectTypes
          .filter((t) => t.attributes)
          .sort((i, j) => (i.attributes.name < j.attributes.name ? -1 : 1))
          .map((option: ProjectType) => (
            <MenuItem key={option.id} value={option.id}>
              {option.attributes &&
                option.attributes.name &&
                t.getString(option.attributes.name.toLowerCase())}
            </MenuItem>
          ))}
      </TextField>
    </div>
  );
};
export default SelectProjectType;
