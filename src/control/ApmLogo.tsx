import apmLogo from '../assets/apm-logo.min.svg';
import { LogoImg } from '.';

export const ApmLogo = () => {
  return (
    <LogoImg
      src={apmLogo}
      sx={{ alignSelf: 'center', width: '256px', height: '256px' }}
      alt="Audio Project Manager Logo"
    />
  );
};
