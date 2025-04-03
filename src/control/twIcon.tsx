import twIcon from '../assets/tw_logo_icon.png';
import { LogoImg } from '.';
import { SxProps } from '@mui/material';
import { TranslatorsWorkplace } from '../assets/brands';

interface IProps {
  sx?: SxProps;
}
export const TwIcon = ({ sx }: IProps) => {
  return (
    <LogoImg
      sx={{ backgroundColor: 'lightgray', ...sx }}
      src={twIcon}
      alt={`${TranslatorsWorkplace} Logo`}
    />
  );
};
export default TwIcon;
