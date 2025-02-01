import akuoLogo from '../assets/akuo-logo-40.png';
import { LogoImg } from '.';
import { SxProps } from '@mui/material';
import { Akuo } from '../assets/brands';

interface IProps {
  sx?: SxProps;
}
export const AkuoLogo = ({ sx }: IProps) => {
  return <LogoImg sx={sx} src={akuoLogo} alt={Akuo + ' Logo'} />;
};
export default AkuoLogo;
