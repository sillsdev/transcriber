import { IStepEditorStrings } from '../../model';
import { shallowEqual, useSelector } from 'react-redux';
import { TextField } from '@mui/material';
import { useEffect, useState } from 'react';
import { stepEditorSelector } from './StepEditor';

interface IProps {
  name: string;
  onChange: (name: string) => void;
}

export const StepName = ({ name, onChange }: IProps) => {
  const [response, setResponse] = useState(name);
  const t: IStepEditorStrings = useSelector(stepEditorSelector, shallowEqual);

  const handleChange = (e: any) => {
    const name = e.target.value;
    setResponse(name);
    onChange(name);
  };

  useEffect(() => {
    setResponse(name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  return (
    <TextField
      id="stepName"
      label={t.name}
      value={response}
      onChange={handleChange}
      variant="filled"
      sx={{ mx: 1, display: 'flex', flexGrow: 1 }}
    />
  );
};

export default StepName;
