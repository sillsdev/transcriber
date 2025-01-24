import voiceConversionLogo from '../assets/plasmid.png';
import voiceConversionGrayLogo from '../assets/plasmid-gray.png';
import { LogoImg } from '.';
import { SxProps } from '@mui/material';

interface IProps {
  disabled?: boolean;
  sx?: SxProps;
}
export const VoiceConversionLogo = ({ disabled, sx }: IProps) => {
  return (
    <LogoImg
      sx={sx}
      src={disabled ? voiceConversionGrayLogo : voiceConversionLogo}
      alt="Transcription Logo"
    />
  );
};
export default VoiceConversionLogo;
