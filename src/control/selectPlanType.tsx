import React from 'react';
import { connect } from 'react-redux';
import localStrings from '../selector/localize';
import { PlanType, IControlStrings, IState } from '../model';
import { createStyles, withStyles, WithStyles } from '@material-ui/core/styles';
import { TextField, MenuItem } from '@material-ui/core';

const styles = createStyles({
  menu: {
    width: 200,
  },
});

interface IStateProps {
  t: IControlStrings;
}

interface IProps extends IStateProps, WithStyles<typeof styles> {
  planType: string;
  planTypes: PlanType[];
  disable?: boolean;
  handleTypeChange: (e: any) => void;
}

function selectPlanType(props: IProps) {
  const { planType, planTypes, t, handleTypeChange, classes, disable } = props;

  return (
    <div>
      <TextField
        id="select-plan-type"
        select
        label={t.contentType}
        className={classes.menu}
        value={planType}
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
        {planTypes
          .filter(t => t.attributes)
          .sort((i, j) => (i.attributes.name < j.attributes.name ? -1 : 1))
          .map((option: PlanType) => (
            <MenuItem key={option.id} value={option.id}>
              {option?.attributes?.name &&
                t.getString(option.attributes.name.toLowerCase())}
            </MenuItem>
          ))}
      </TextField>
    </div>
  );
}
const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'control' }),
});

export const SelectPlanType = withStyles(styles)(
  connect(mapStateToProps)(selectPlanType)
);
export default SelectPlanType;
