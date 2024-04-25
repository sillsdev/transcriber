import { SxProps } from '@mui/material';

function stringToColor(string: string) {
  let hash = 0;
  let i;

  /* eslint-disable no-bitwise */
  for (i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = '#';

  for (i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }
  /* eslint-enable no-bitwise */

  return color;
}

const initials = (name: string) => {
  const [firstName, lastName] = name.split(' ');
  if (firstName && lastName) return `${firstName[0]}${lastName[0]}`;
  if (firstName) return `${firstName[0]}`;
  return '';
};

export function stringAvatar(name: string, sxProps?: SxProps) {
  return {
    sx: { ...sxProps, bgcolor: stringToColor(name) },
    children: `${initials(name)}`,
  };
}
