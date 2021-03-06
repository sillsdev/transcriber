import React from 'react';
import {
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
} from '@material-ui/core';
import { makeStyles, createStyles, Theme } from '@material-ui/core';
import { CSSProperties } from '@material-ui/core/styles/withStyles';
import { TeamContext } from '../../../context/TeamContext';
import FontSize from '../../FontSize';
import { IProjectDialogState } from './ProjectDialog';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    label: {
      color: theme.palette.secondary.main,
    },
    group: {
      paddingBottom: theme.spacing(3),
    },
    sameLine: {
      display: 'flex',
    },
    languageField: {
      marginLeft: 0,
    },
    textField: {
      marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
    },
    sameCol: {
      flexDirection: 'column',
    },
    previewCol: {
      marginTop: theme.spacing(2),
    },
  })
);

export const EditorSettings = (props: IProjectDialogState) => {
  const { state, setState } = props;
  const classes = useStyles();
  const ctx = React.useContext(TeamContext);
  const t = ctx.state.vProjectStrings;
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
      <FormLabel className={classes.label}>{t.editorSettings}</FormLabel>
      <FormGroup className={classes.group}>
        <FormControlLabel
          className={classes.textField}
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
          className={classes.textField}
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
