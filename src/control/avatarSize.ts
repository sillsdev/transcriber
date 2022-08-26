import { SxProps } from '@mui/material';

const smallProps = { width: 3, height: 3 } as SxProps;
const mediumProps = { width: 5, height: 5 } as SxProps;

export const avatarSize = (small?: boolean) =>
  Boolean(small) ? smallProps : mediumProps;
