import audacityLogo from '../assets/audacity.png';
import audacityGrayLogo from '../assets/audacity-gray.png';
import { LogoImg } from '.';
import { SxProps } from '@mui/material';

interface IProps {
  disabled?: boolean;
  sx?: SxProps;
}
export const AudacityLogo = ({ disabled, sx }: IProps) => {
  return (
    <LogoImg
      sx={sx}
      src={disabled ? audacityGrayLogo : audacityLogo}
      alt="Audacity Logo"
    />
  );
};
export default AudacityLogo;
