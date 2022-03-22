import {
  createStyles,
  debounce,
  makeStyles,
  Theme,
  useTheme,
} from '@material-ui/core';
import { Stage } from '../../control/Stage';
import usePassageDetailContext from '../../context/usePassageDetailContext';
import { toCamel } from '../../utils';
import { useEffect, useState } from 'react';
import { SimpleWf } from '../../context/PassageDetailContext';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
      margin: theme.spacing(1),
    },
  })
);

export function WorkflowSteps() {
  const {
    workflow,
    stepComplete,
    currentstep,
    setCurrentStep,
    wfStr,
    firstStepIndex,
    setFirstStepIndex,
  } = usePassageDetailContext();
  const classes = useStyles();
  const theme = useTheme();
  const [shownWorkflow, setShownWorkflow] = useState<SimpleWf[]>([]);
  const [width, setWidth] = useState(0);
  const prevWF = {
    id: 'prev',
    label: '<<',
  };
  const nextWF = {
    id: 'next',
    label: '>>',
  };

  // keep track of screen width
  const setDimensions = () => {
    setWidth(window.innerWidth);
  };

  useEffect(() => {
    setDimensions();
    const handleResize = debounce(() => {
      setDimensions();
    }, 100);

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); //do this once to get the default;

  useEffect(() => {
    var show = Math.ceil(width / 200);
    if (!workflow || !workflow.length) return;
    var tempFirstStep = firstStepIndex;
    if (firstStepIndex < 0) {
      if (currentstep) {
        var stepIndex = workflow.findIndex((w) => w.id === currentstep);
        tempFirstStep = Math.floor(Math.max(stepIndex - show / 2, 0));
      } else tempFirstStep = 0;
      setFirstStepIndex(tempFirstStep);
    }
    var wf: SimpleWf[] = [];
    wf.push({ ...prevWF, label: tempFirstStep > 0 ? prevWF.label : '' });
    wf = wf.concat(workflow.slice(tempFirstStep, tempFirstStep + show));
    wf.push({
      ...nextWF,
      label: tempFirstStep + show < workflow.length ? nextWF.label : '',
    });
    setShownWorkflow(wf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentstep, firstStepIndex, workflow, width, setFirstStepIndex]);

  const curColor = (id: string) => {
    return id === currentstep
      ? theme.palette.secondary.light
      : stepComplete(id)
      ? theme.palette.grey[300]
      : undefined;
  };

  const handleSelect = (item: string) => {
    if (item === currentstep) {
      //do nothing;
    } else {
      setCurrentStep(item);
    }
  };
  const moveStep = (forward: boolean) => {
    if (forward)
      setFirstStepIndex(Math.min(workflow.length - 1, firstStepIndex + 1));
    else setFirstStepIndex(Math.max(0, firstStepIndex - 1));
  };
  return (
    <div className={classes.root}>
      {shownWorkflow.map((w) => {
        const cameLabel = toCamel(w.label);
        const label = wfStr.hasOwnProperty(cameLabel)
          ? wfStr.getString(cameLabel)
          : w.label;
        return (
          <Stage
            key={w.id}
            id={w.id}
            label={label}
            color={curColor(w.id)}
            textColor={
              w.id === currentstep
                ? theme.palette.secondary.contrastText
                : '#000000'
            }
            done={stepComplete(w.id)}
            select={handleSelect}
            moveStep={moveStep}
          />
        );
      })}
    </div>
  );
}
