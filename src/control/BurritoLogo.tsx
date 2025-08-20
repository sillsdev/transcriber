import recordOrUpload from '../assets/burrito_logo.svg';
import { LogoImg } from '.';
import { SxProps } from '@mui/material';

interface IProps {
  sx?: SxProps;
}

export const BurritoLogo = (props: IProps) => {
  return (
    <LogoImg
      src={recordOrUpload}
      sx={{
        px: 1,
        alignSelf: 'center',
        width: '48px',
        height: '24px',
        ...props.sx,
      }}
      alt="Record or Upload Icon"
    />
  );
};
export default BurritoLogo;
