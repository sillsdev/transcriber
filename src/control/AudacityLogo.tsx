import audacityLogo from '../assets/audacity.png';
import audacityGrayLogo from '../assets/audacity-gray.png';
import { LogoImg } from '.';

interface IProps {
  disabled?: boolean;
}
export const AudacityLogo = (props: IProps) => {
  const { disabled } = props;

  return (
    <LogoImg
      src={disabled ? audacityGrayLogo : audacityLogo}
      alt="Audacity Logo"
    />
  );
};
export default AudacityLogo;
