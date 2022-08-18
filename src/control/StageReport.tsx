import { styled, useTheme } from '@mui/material';
import { Stage } from '.';

const ReportDiv = styled('div')(() => ({
  display: 'flex',
  flexDirection: 'column',
  '& svg': {
    height: '20px',
    width: '120px',
  },
}));

interface IProps {
  step: string;
  onClick?: any;
}

export const StageReport = ({ step, onClick }: IProps) => {
  const theme = useTheme();

  return (
    <ReportDiv id="stage-report">
      <Stage
        id=""
        label={step}
        color={theme.palette.grey[300]}
        select={onClick}
      />
    </ReportDiv>
  );
};
