import React, { CSSProperties } from 'react';
import {
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { IVProjectStrings } from '../../../model';
import FontSize from '../../FontSize';
import { IProjectDialogState } from './ProjectDialog';
import { shallowEqual, useSelector } from 'react-redux';
import { vProjectSelector } from '../../../selector';

export const EditorSettings = (props: IProjectDialogState) => {
  const { state, setState } = props;
  const t: IVProjectStrings = useSelector(vProjectSelector, shallowEqual);
  const { font, fontSize, rtl } = state;

  const handleChangeRtl = () => {
    setState((state) => ({ ...state, rtl: !state.rtl }));
  };

  const handleFontSize = (fontSize: string) => {
    setState((state) => ({ ...state, fontSize: fontSize }));
  };

  const previewStyle: CSSProperties = {
    fontSize: fontSize,
    fontFamily: font,
    width: 400,
  };

  return (
    <>
      <FormLabel sx={{ color: 'secondary.main' }}>{t.editorSettings}</FormLabel>
      <FormGroup sx={{ pb: 3 }}>
        <FormControlLabel
          sx={{ mx: 1 }}
          control={
            <FontSize
              label={t.fontSize}
              value={fontSize}
              font={font}
              setSize={handleFontSize}
            />
          }
          label=""
        />
        <FormControlLabel
          sx={{ mx: 1 }}
          control={
            <Checkbox
              id="checkbox-rtl"
              checked={rtl}
              onChange={handleChangeRtl}
            />
          }
          label={t.rightToLeft}
        />
        <FormLabel>{t.preview}</FormLabel>
        <div style={previewStyle}>
          The quick, brown fox jumped over the lazy dog.
        </div>
      </FormGroup>
    </>
  );
};
