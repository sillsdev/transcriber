import { Button, ButtonProps } from '@mui/material';

export const AltButton = ({ children, ...rest }: ButtonProps) => (
  <Button
    variant="outlined"
    color="primary"
    sx={{
      m: 1,
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      justifyContent: 'flex-start',
    }}
    {...rest}
  >
    {children}
  </Button>
);
