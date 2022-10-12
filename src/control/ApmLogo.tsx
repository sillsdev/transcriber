import apmLogo from '../assets/apm-logo.min.svg';
import { LogoImg } from '.';
import { SxProps } from '@mui/material';

interface IProps {
  sx?: SxProps;
}

export const ApmLogo = (props: IProps) => {
  return (
    <LogoImg
      src={apmLogo}
      sx={{ alignSelf: 'center', width: '256px', height: '256px', ...props.sx }}
      alt="Audio Project Manager Logo"
    />
  );
};
