import { Checkbox, FormControlLabel } from '@mui/material';

interface INoShowAgain {
  label?: string;
  checked?: boolean;
  setChecked?: (checked: boolean) => void;
}

export const NoShowAgain = ({ label, checked, setChecked }: INoShowAgain) => {
  return (
    <FormControlLabel
      control={
        <Checkbox
          checked={checked ?? false}
          onChange={(_e, checked) => setChecked && setChecked(checked)}
        />
      }
      label={label ?? 'Do not show again'}
    />
  );
};
