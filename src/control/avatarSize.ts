import { SxProps } from '@mui/material';

const smallProps = { width: '24px', height: '24px' } as SxProps;
const mediumProps = { width: '48px', height: '48px' } as SxProps;

export const avatarSize = (small?: boolean) =>
  Boolean(small) ? smallProps : mediumProps;
