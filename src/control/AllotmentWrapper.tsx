import { Box, BoxProps, styled } from '@mui/material';

interface WrapperProps extends BoxProps {
  horiz?: string;
  vert?: string;
}

export const AllotmentWrapper = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'vert' && prop !== 'horiz',
})<WrapperProps>(({ vert, horiz }) => ({
  border: '1px solid rgba(128, 128, 128, 0.35)',
  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  height: vert || '100%',
  // overflowY: 'scroll',
  // resize: 'vertical',
  width: horiz || '100%',
  display: 'flex',
  '& > *': {
    width: '100%',
    height: '100%',
  },
}));
