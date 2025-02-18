import {
  styled,
  TextareaAutosize,
  TextareaAutosizeProps,
  TextField,
  FilledTextFieldProps,
} from '@mui/material';
import { CSSProperties } from 'styled-components';

export interface StyledTextAreaAutosizeProps extends TextareaAutosizeProps {
  family: string;
  url: string;
  overrides?: CSSProperties;
}

export const StyledTextAreaAudosize = styled(TextareaAutosize, {
  shouldForwardProp: (prop) =>
    prop !== 'family' && prop !== 'url' && prop !== 'overrides',
})<StyledTextAreaAutosizeProps>(({ family, url, overrides }) => ({
  '@font-face': {
    fontFamily: family,
    src: `url(${url})`,
  },
  ...overrides,
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
