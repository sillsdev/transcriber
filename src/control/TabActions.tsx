import { styled } from '@mui/material';

export const TabActions = styled('div')(() => ({
  paddingBottom: 14,
  display: 'flex',
  justifyContent: 'flex-end',
  '& .MuiButton-label': { fontSize: '.8rem' },
  '& .MuiButtonBase-root': { margin: '5px', padding: '2px 10px' },
  '& .MuiSvgIcon-root': { fontSize: '.9rem' },
  '& .MuiFormControl-root': { margin: '5px' },
  '& #select-export-type': { padding: '4px 24px' },
}));
