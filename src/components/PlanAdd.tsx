import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { IState, Plan, PlanType, IPlanAddStrings } from '../model';
import localStrings from '../selector/localize';
import { withData } from 'react-orbitjs';
import { QueryBuilder } from '@orbit/data';
import { withStyles, WithStyles } from '@material-ui/core/styles';
import {
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  MenuItem,
} from '@material-ui/core';
import SnackBar from '../components/SnackBar';
import Related from '../utils/related';

const styles = {
  menu: {
    width: 200,
  },
};

interface IStateProps {
  t: IPlanAddStrings;
}

interface IRecordProps {
  planTypes: Array<PlanType>;
}

interface IProps extends IRecordProps, IStateProps, WithStyles<typeof styles> {
  planIn: Plan | null;
  visible: boolean;
  addMethod?: (planName: string, planType: string) => void;
  editMethod?: (planRec: any) => void;
  cancelMethod?: () => void;
}

function PlanAdd(props: IProps) {
  const {
    planTypes,
    classes,
    t,
    visible,
    addMethod,
    editMethod,
    cancelMethod,
    planIn,
  } = props;
  const [open, setOpen] = useState(visible);
  const [name, setName] = useState(
    (planIn && planIn.attributes.name) || t.newPlan
  );
  const [planType, setPlanType] = useState('');
  const [message, setMessage] = useState(<></>);

  const handleAddOrSave = () => {
    if (planType === '') {
      setMessage(<span>{t.selectAPlanType}</span>);
      return;
    }
    if (
      !planIn ||
      name !== planIn.attributes.name ||
      planType !== Related(planIn, 'plantype')
    ) {
      if (!planIn) {
        if (addMethod) {
          addMethod(name, planType);
        }
      } else {
        let plan = {
          ...planIn,
          attributes: {
            name,
            planType,
          },
        };
        if (editMethod) {
          editMethod(plan);
        }
      }
    }
    setOpen(false);
  };
  const handleCancel = () => {
    if (cancelMethod) {
      cancelMethod();
    }
    setOpen(false);
  };
  const handleNameChange = (e: any) => {
    setName(e.target.value);
  };
  const handleTypeChange = (e: any) => {
    setPlanType(e.target.value);
  };
  const handleMessageReset = () => {
    setMessage(<></>);
  };

  useEffect(() => {
    setName(planIn ? planIn.attributes.name : t.newPlan);
    setPlanType(planIn ? Related(planIn, 'plantype') : '');
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [planIn]);

  useEffect(() => {
    setOpen(visible);
  }, [visible]);

  return (
    <div>
      <Dialog
        open={open}
        onClose={handleCancel}
        aria-labelledby="form-dialog-title"
      >
        <DialogTitle id="form-dialog-title">
          {planIn ? t.editPlan : t.addPlan}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>{t.newPlanTask}</DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            variant="filled"
            id="name"
            label={t.name}
            value={name}
            onChange={handleNameChange}
            fullWidth
          />
          <TextField
            id="select-plan-type"
            select
            label={t.planType}
            value={planType}
            onChange={handleTypeChange}
            SelectProps={{
              MenuProps: {
                className: classes.menu,
              },
            }}
            helperText={t.selectPlanType}
            margin="normal"
            variant="filled"
            required={true}
          >
            {planTypes.map((option: PlanType) => (
              <MenuItem key={option.id} value={option.id}>
                {option.attributes.name}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel} variant="outlined" color="primary">
            {t.cancel}
          </Button>
          <Button onClick={handleAddOrSave} variant="contained" color="primary">
            {!planIn ? t.add : t.save}
          </Button>
        </DialogActions>
      </Dialog>
      <SnackBar {...props} message={message} reset={handleMessageReset} />
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'planAdd' }),
});

const mapRecordsToProps = {
  planTypes: (q: QueryBuilder) => q.findRecords('plantype'),
};

export default withStyles(styles, { withTheme: true })(withData(
  mapRecordsToProps
)(connect(mapStateToProps)(PlanAdd) as any) as any) as any;
