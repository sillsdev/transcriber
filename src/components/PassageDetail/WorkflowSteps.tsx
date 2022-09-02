import { Box, debounce, useTheme } from '@mui/material';
import { Stage } from '../../control/Stage';
import usePassageDetailContext from '../../context/usePassageDetailContext';
import { toCamel } from '../../utils';
import { useEffect, useState } from 'react';
import { SimpleWf } from '../../context/PassageDetailContext';

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
  const theme = useTheme();
  const [shownWorkflow, setShownWorkflow] = useState<SimpleWf[]>([]);
  const [width, setWidth] = useState(0);
  const [stageWdith, setStageWidth] = useState(300);
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
    const show = Math.ceil(width / 200);
    // 24 for next/prev icon + 16 padding with 10 padding on bar = 100
    const newStageWdith = (width - 100) / show;
    if (newStageWdith !== stageWdith) setStageWidth(newStageWdith);
    if (!workflow || !workflow.length) return;
    let tempFirstStep = firstStepIndex;
    if (firstStepIndex < 0) {
      if (currentstep) {
        const stepIndex = workflow.findIndex((w) => w.id === currentstep);
        tempFirstStep = Math.floor(Math.max(stepIndex - show / 2, 0));
      } else tempFirstStep = 0;
      setFirstStepIndex(tempFirstStep);
    }
    let wf: SimpleWf[] = [];
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
    <Box sx={{ display: 'flex', m: 1, alignItems: 'center' }}>
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
            wid={stageWdith}
            done={stepComplete(w.id)}
            select={handleSelect}
            moveStep={moveStep}
          />
        );
      })}
    </Box>
  );
}
