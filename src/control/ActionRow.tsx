import { Box, BoxProps } from '@mui/material';

export const ActionRow = ({ children, ...rest }: BoxProps) => (
  <Box
    sx={{
      pb: 16,
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'flex-end',
    }}
    {...rest}
  >
    {children}
  </Box>
);
