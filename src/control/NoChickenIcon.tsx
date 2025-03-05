import noChickenIcon from '../assets/no-chicken.png';
import noChickenGrayIcon from '../assets/no-chicken-gray.png';
import { LogoImg } from '.';
import { SxProps } from '@mui/material';

interface IProps {
  disabled?: boolean;
  sx?: SxProps;
}
export const NoChickenIcon = ({ disabled, sx }: IProps) => {
  return (
    <LogoImg
      sx={sx}
      src={disabled ? noChickenGrayIcon : noChickenIcon}
      alt="No Chicken Icon"
    />
  );
};
export default NoChickenIcon;
