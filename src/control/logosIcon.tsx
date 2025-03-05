import logosIcon from '../assets/logos-icon.png';
import { LogoImg } from '.';
import { SxProps } from '@mui/material';
import { Akuo } from '../assets/brands';

interface IProps {
  sx?: SxProps;
}
export const LogosIcon = ({ sx }: IProps) => {
  return <LogoImg sx={sx} src={logosIcon} alt={`${Akuo} Logo`} />;
};
export default LogosIcon;
