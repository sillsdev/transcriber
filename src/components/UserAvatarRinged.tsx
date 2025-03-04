import React from 'react';
import { Avatar, Box, SxProps} from '@mui/material';
import { makeAbbr } from '../utils';


const bigAvatarProps = { width: '150px', height: '150px' } as SxProps;

interface IBigAvatarProps {
  avatarUrl: string | null;
  name: string;
}
const BigAvatar = (props: IBigAvatarProps) => {
  const { avatarUrl, name } = props;

  if (!avatarUrl || avatarUrl === '') {
    return <Avatar sx={bigAvatarProps}>{makeAbbr(name)}</Avatar>;
  }
  return <Avatar sx={bigAvatarProps} src={avatarUrl}/>;
};

interface UserAvatarRingedProps {
  // avatarUrl: string | null;
  // name: string;
  // radius: number;
  // strokeWidth: number;
  // ringColor: string;
  avatarUrl: string | null;
  name: string;
  ringColor: string;
  ringWidth: number;
}

const UserAvatarRinged: React.FC<UserAvatarRingedProps> = ({
  avatarUrl,
  name,
  ringColor,
  ringWidth,
}) => {
  const outerRingSx: SxProps = {
    display: 'inline-block',
    borderRadius: '50%',
    borderStyle: 'solid',
    borderColor: ringColor,
    borderWidth: ringWidth,
    padding: '10px', // Adjust padding to control the space between the image and the ring
  };
  return (
    <Box sx={outerRingSx}>
      <BigAvatar avatarUrl={avatarUrl} name={name || ''} />
    </Box>
  );
};

export default UserAvatarRinged;