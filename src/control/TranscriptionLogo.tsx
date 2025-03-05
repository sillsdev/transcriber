import transcriptionLogo from '../assets/transcription.png';
import transcriptionGrayLogo from '../assets/transcription-gray.png';
import { LogoImg } from '.';
import { SxProps } from '@mui/material';

interface IProps {
  disabled?: boolean;
  sx?: SxProps;
}
export const TranscriptionLogo = ({ disabled, sx }: IProps) => {
  return (
    <LogoImg
      sx={sx}
      src={disabled ? transcriptionGrayLogo : transcriptionLogo}
      alt="Transcription Logo"
    />
  );
};
export default TranscriptionLogo;
