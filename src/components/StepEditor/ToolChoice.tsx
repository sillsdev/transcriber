import { IStepEditorStrings, OptionType } from '../../model';
import { shallowEqual, useSelector } from 'react-redux';
import { TextField, MenuItem } from '@mui/material';
import { useTools } from '../../crud';
import { stepEditorSelector } from './StepEditor';

interface IProps {
  tool: string;
  onChange: (tool: string) => void;
}

export const ToolChoice = ({ tool, onChange }: IProps) => {
  const { getToolOptions } = useTools();
  const t: IStepEditorStrings = useSelector(stepEditorSelector, shallowEqual);

  const handleChange = (e: any) => {
    onChange(e.target.value);
  };

  return (
    <TextField
      id="stepTool"
      select
      label={t.tool}
      value={tool}
      onChange={handleChange}
      variant="filled"
      sx={{ mx: 1, display: 'flex', flexGrow: 1 }}
      SelectProps={{
        MenuProps: {
          sx: { width: '300px' },
        },
      }}
    >
      {getToolOptions().map((option: OptionType, i) => (
        <MenuItem key={i} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </TextField>
  );
};

export default ToolChoice;
