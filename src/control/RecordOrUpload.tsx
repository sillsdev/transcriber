import recordOrUpload from '../assets/recordOrUpload.svg';
import { LogoImg } from '.';
import { SxProps } from '@mui/material';

interface IProps {
  sx?: SxProps;
}

export const RecordOrUploadIcon = (props: IProps) => {
  return (
    <LogoImg
      src={recordOrUpload}
      sx={{ alignSelf: 'center', width: '20px', height: '20px', ...props.sx }}
      alt="Record or Upload Icon"
    />
  );
};
export default RecordOrUploadIcon;
