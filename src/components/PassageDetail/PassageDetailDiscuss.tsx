import { useEffect, useState } from 'react';
import MarkDown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useOrbitData } from '../../hoc/useOrbitData';
import { OrgWorkflowStepD } from '../../model';
import { Box } from '@mui/material';

interface IProps {
  width: number;
  currentStep?: string;
}

export const PassageDetailDiscuss = ({ width, currentStep }: IProps) => {
  const [value, setValue] = useState<string>('');
  const orgSteps = useOrbitData<OrgWorkflowStepD[]>('orgworkflowstep');

  useEffect(() => {
    const step = orgSteps?.find((s) => s.id === currentStep);
    if (step) {
      var json = JSON.parse(step?.attributes?.tool || '{}');
      setValue(JSON.parse(json?.settings || '{}')?.markDown ?? '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgSteps]);

  return (
    <Box sx={{ maxWidth: width, whiteSpace: 'normal', overflow: 'auto' }}>
      <MarkDown remarkPlugins={[remarkGfm]}>{value}</MarkDown>
    </Box>
  );
};
