import { styled, Tooltip, TooltipProps } from '@mui/material';

export const LightTooltip = styled(Tooltip)<TooltipProps>(({ theme }) => ({
  backgroundColor: theme.palette.common.white,
  color: 'rgba(0, 0, 0, 0.87)',
  boxShadow: theme.shadows[1],
  fontSize: 11,
}));
