import { Grid, GridProps, styled } from '@mui/material';

export const ToolbarGrid = styled(Grid)<GridProps>(() => ({
  flexDirection: 'row',
  alignItems: 'center',
  justifyItems: 'flex-start',
  display: 'flex',
}));
