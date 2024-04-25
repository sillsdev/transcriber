import {
  styled,
  TextareaAutosize,
  TextareaAutosizeProps,
  TextField,
  FilledTextFieldProps,
} from '@mui/material';
import { IFontConfig } from '../crud';

export interface StyledTextAreaAutosizeProps extends TextareaAutosizeProps {
  config?: IFontConfig;
}

export const StyledTextAreaAudosize = styled(TextareaAutosize, {
  shouldForwardProp: (prop) => prop !== 'config',
})<StyledTextAreaAutosizeProps>(({ config }) => ({
  '@font-face': {
    fontFamily: `${config?.custom?.families[0]}`,
    src: `url(${config?.custom?.urls[0]})`,
  },
}));

export interface StyledTextFieldProps extends FilledTextFieldProps {
  config?: IFontConfig;
}

export const StyledTextField = styled(TextField, {
  shouldForwardProp: (prop) => prop !== 'config',
})<StyledTextFieldProps>(({ config }) => ({
  '@font-face': {
    fontFamily: `${config?.custom?.families[0]}`,
    src: `url(${config?.custom?.urls[0]})`,
  },
}));
