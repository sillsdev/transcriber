import { IStepEditorStrings } from '../../model';
import { shallowEqual, useSelector } from 'react-redux';
import { TextField } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { stepEditorSelector } from './StepEditor';

interface IProps {
  name: string;
  pos: number;
  isFocused: boolean;
  onChange: (name: string, pos: number) => void;
}

export const StepName = ({ name, pos, isFocused, onChange }: IProps) => {
  const [response, setResponse] = useState(name);
  const elRef = useRef<HTMLDivElement>(null);
  const t: IStepEditorStrings = useSelector(stepEditorSelector, shallowEqual);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setResponse(name);
    onChange(name, e.target.selectionStart || 0);
  };

  useEffect(() => {
    setResponse(name);
    const input = elRef.current?.childNodes[1]?.firstChild as HTMLInputElement;
    if (input) input.setSelectionRange(pos, pos);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, pos]);

  return (
    <TextField
      ref={elRef}
      autoFocus={isFocused}
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
