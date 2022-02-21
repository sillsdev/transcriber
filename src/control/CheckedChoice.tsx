import { Checkbox, FormControlLabel } from '@material-ui/core';

interface IProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

export const CheckedChoice = ({ label, value, onChange, disabled }: IProps) => {
  const handleChange = () => {
    onChange(!value);
  };
  return (
    <FormControlLabel
      control={
        <Checkbox checked={value} onChange={handleChange} name={label} />
      }
      label={label}
      disabled={disabled}
    />
  );
};
