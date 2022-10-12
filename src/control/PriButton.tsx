import { Button, ButtonProps } from '@mui/material';

export const PriButton = ({ children, ...rest }: ButtonProps) => (
  <Button variant="contained" color="primary" sx={{ m: 1 }} {...rest}>
    {children}
  </Button>
);
