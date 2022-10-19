import { Box, BoxProps, Button, ButtonProps, styled } from '@mui/material';

export const ActionToggle = styled(Box)<BoxProps>(() => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  '& .MuiButton-label': {
    fontSize: 'x-small',
  },
}));

// see: https://mui.com/material-ui/customization/how-to-customize/
interface StyledButtonProps extends ButtonProps {
  active?: boolean;
}
export const UndButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== 'noOnLeft',
})<StyledButtonProps>(({ active }) => ({
  ...(active && {
    textDecoration: 'underline',
  }),
}));

const BarSpan = styled('span')(() => ({
  fontSize: 'x-small',
}));

export const SmallBar = () => <BarSpan>|</BarSpan>;
