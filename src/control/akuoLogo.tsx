import akuoLogo from '../assets/akuologo.png';
import { LogoImg } from '.';
import { SxProps } from '@mui/material';

interface IProps {
  sx?: SxProps;
}
export const AkuoLogo = ({ sx }: IProps) => {
  return <LogoImg sx={sx} src={akuoLogo} alt="Akuo Logo" />;
};
export default AkuoLogo;
