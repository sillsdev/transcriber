import { IState, IWorkflowStepsStrings, OrgWorkflowStep } from '../../model';
import localStrings from '../../selector/localize';
import { shallowEqual, useSelector } from 'react-redux';
import { toCamel } from '../../utils';
import { SxProps, TextField } from '@mui/material';
import { StyledMenuItem } from '../../control/StyledMenu';

interface IProps {
  label: string;
  stepData: OrgWorkflowStep[];
  defaultChoice: string;
  onStepFilter: (chosen: string) => void;
}
const wfStepsSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'workflowSteps' });
const textFieldProps = {
  mx: 1,
  width: 'inherit',
  maxWidth: '400px',
  minWidth: '150px',
} as SxProps;
const smallTextProps = { fontSize: 'small' } as SxProps;

export function OrgWorkflowStepList(props: IProps) {
  const { stepData, onStepFilter, defaultChoice, label } = props;
  const t: IWorkflowStepsStrings = useSelector(wfStepsSelector, shallowEqual);

  const handleToggle = (e: any) => {
    onStepFilter(e.target.value);
  };

  const localName = (name: string) => {
    const lookUp = toCamel(name);
    return t.hasOwnProperty(lookUp) ? t.getString(lookUp) : name;
  };

  return (
    <TextField
      label={label}
      id={'steps' + label}
      select
      sx={textFieldProps}
      value={defaultChoice}
      onChange={handleToggle}
      InputProps={{
        sx: smallTextProps,
      }}
      InputLabelProps={{
        sx: smallTextProps,
      }}
      margin="normal"
      variant="filled"
    >
      {[
        <StyledMenuItem key="none" value="">
          {t.none}
        </StyledMenuItem>,
      ].concat(
        stepData.map((d, i) => (
          <StyledMenuItem key={i} value={d.id}>
            {localName(d.attributes.name)}
          </StyledMenuItem>
        ))
      )}
    </TextField>
  );
}
