import { Box, BoxProps } from '@mui/material';

export const TabBox = ({ children, ...restProps }: BoxProps) => {
  return (
    <Box
      sx={{
        flexGrow: 1,
        width: '100%',
        backgroundColor: 'background.paper',
        flexDirection: 'column',
      }}
      {...restProps}
    >
      {children}
    </Box>
  );
};
