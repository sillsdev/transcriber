import { Box, BoxProps, styled, Typography, SxProps } from '@mui/material';
import { ReactNode } from 'react';
import { ApmLogo } from '../control/ApmLogo';
import { API_CONFIG } from '../api-variable';
const description = require('../../package.json').description;

const Splash = styled(Box)<BoxProps>(({ theme }) => ({
  width: '30%',
  display: 'flex',
  flexDirection: 'column',
  alignContent: 'center',
  [theme.breakpoints.down('md')]: {
    width: '100%',
  },
}));

const textProps = {
  color: 'primary.main',
  fontWeight: 'bold',
  width: '90%',
  alignSelf: 'center',
} as SxProps;

interface IProps {
  message?: string;
  component: ReactNode;
}

export const ApmSplash = ({ message, component }: IProps) => (
  <Splash sx={{ py: 16, mt: 10 }}>
    <ApmLogo />
    <Typography sx={textProps} variant="h2" align="center">
      {API_CONFIG.productName}
    </Typography>
    <Typography variant="h5" sx={textProps} align="center">
      {description}
    </Typography>
    <Typography sx={{ alignSelf: 'center', textAlign: 'center' }}>
      {message}
    </Typography>
    {component}
  </Splash>
);
