import busyImage from '../assets/progress.gif';
import { Box, styled } from '@mui/material';

const BusyImg = styled('img')(() => ({ width: '120px', margin: 'auto' }));

export const Busy = () => {
  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <BusyImg className="busyImg" src={busyImage} alt="busy" />
    </Box>
  );
};

export default Busy;
