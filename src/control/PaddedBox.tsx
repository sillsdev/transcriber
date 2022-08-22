import { styled } from '@mui/material';
import { ActionHeight } from '.';

export const PaddedBox = styled('div')(({ theme }) => ({
  paddingTop: `calc(${ActionHeight}px + ${theme.spacing(2)})`,
}));
