import React from 'react';
import { Typography, Box, styled } from '@mui/material';
import success from '../assets/success.png';
import { TranscriberContext } from '../context/TranscriberContext';

const DoneImg = styled('img')(({ theme }) => ({
  width: '343px',
  alignSelf: 'center',
  padding: theme.spacing(3),
}));

export const AllDone = () => {
  const ctx = React.useContext(TranscriberContext);
  const { transcriberStr } = ctx.state;
  const t = transcriberStr;

  return (
    <Box
      sx={{ display: 'flex', flexDirection: 'column', alignContent: 'center' }}
    >
      <DoneImg src={success} alt="Success!" />
      <Typography variant="h1" align="center">
        {t.congratulation}
      </Typography>
      {'\u00A0'}
      <Typography variant="h5" align="center">
        {t.noMoreTasks}
      </Typography>
      {'\u00A0'}
    </Box>
  );
};
