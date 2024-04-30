import {
  styled,
  TextareaAutosize,
  TextareaAutosizeProps,
  TextField,
  FilledTextFieldProps,
} from '@mui/material';

export interface StyledTextAreaAutosizeProps extends TextareaAutosizeProps {
  family: string;
  url: string;
}

export const StyledTextAreaAudosize = styled(TextareaAutosize, {
  shouldForwardProp: (prop) => prop !== 'config',
})<StyledTextAreaAutosizeProps>(({ family, url }) => ({
  '@font-face': {
    fontFamily: family,
    src: `url(${url})`,
  },
}));

export interface StyledTextFieldProps extends FilledTextFieldProps {
  family: string;
  url: string;
}

export const StyledTextField = styled(TextField, {
  shouldForwardProp: (prop) => prop !== 'config',
})<StyledTextFieldProps>(({ family, url }) => ({
  '@font-face': {
    fontFamily: family,
    src: `url(${url})`,
  },
}));
