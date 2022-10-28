import { FormLabel, FormLabelProps, styled, SxProps } from '@mui/material';

export const ContainerDiv = styled('div')(({ theme }) => ({
  display: 'flex',
  paddingTop: theme.spacing(2),
}));

export const PaperDiv = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  flexGrow: 1,
  paddingLeft: theme.spacing(4),
}));

export const StyledFormLabel = styled(FormLabel)<FormLabelProps>(
  ({ theme }) => ({
    display: 'flex',
    marginBottom: theme.spacing(1),
  })
);

export const detailProps = { paddingTop: 0, marginTop: 0 } as SxProps;
export const menuProps = { width: '200px' } as SxProps;
