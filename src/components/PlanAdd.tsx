import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { IState, Plan, PlanType, IPlanAddStrings } from '../model';
import localStrings from '../selector/localize';
import { withData } from '../mods/react-orbitjs';
import { QueryBuilder } from '@orbit/data';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import {
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@material-ui/core';
import SnackBar from '../components/SnackBar';
import { SelectPlanType } from '../control';
import Related from '../utils/related';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    menu: {
      width: 300,
    },
  })
);

interface IStateProps {
  t: IPlanAddStrings;
}

interface IRecordProps {
  planTypes: Array<PlanType>;
}

interface IProps extends IRecordProps, IStateProps {
  planIn: Plan | null;
  visible: boolean;
  addMethod?: (planName: string, planType: string) => void;
  editMethod?: (planRec: any) => void;
  cancelMethod?: () => void;
}

function PlanAdd(props: IProps) {
  const {
    planTypes,
    t,
    visible,
    addMethod,
    editMethod,
    cancelMethod,
    planIn,
  } = props;
  const classes = useStyles();
  const [open, setOpen] = useState(visible);
  const [name, setName] = useState(
    (planIn && planIn.attributes.name) || t.newPlan
  );
  const [planType, setPlanType] = useState('');
  const [message, setMessage] = useState(<></>);
  const inProcess = React.useRef<boolean>(false);

  const handleAddOrSave = () => {
    inProcess.current = true;
    doAddOrSave();
  };
  const doAddOrSave = async () => {
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
    inProcess.current = false;
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
            className={classes.menu}
            label={t.name}
            value={name}
            onChange={handleNameChange}
            required
            fullWidth
          />
          <SelectPlanType
            planType={planType}
            planTypes={planTypes}
            handleTypeChange={handleTypeChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel} variant="outlined" color="primary">
            {t.cancel}
          </Button>
          <Button
            onClick={handleAddOrSave}
            variant="contained"
            color="primary"
            disabled={name === '' || planType === '' || inProcess.current}
          >
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

export default withData(mapRecordsToProps)(
  connect(mapStateToProps)(PlanAdd) as any
) as any;
