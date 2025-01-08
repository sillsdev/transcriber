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
  shouldForwardProp: (prop) => prop !== 'family' && prop !== 'url',
})<StyledTextAreaAutosizeProps>(({ family, url }) => ({
  '@font-face': {
    fontFamily: family,
    src: `url(${url})`,
  },
  overflow: 'auto !important',
}));

export interface StyledTextFieldProps extends FilledTextFieldProps {
  family: string;
  url: string;
}

export const StyledTextField = styled(TextField, {
  shouldForwardProp: (prop) => prop !== 'family' && prop !== 'url',
})<StyledTextFieldProps>(({ family, url }) => ({
  '@font-face': {
    fontFamily: family,
    src: `url(${url})`,
  },
}));
