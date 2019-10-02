import React from 'react';
import { makeStyles, createStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Slider from '@material-ui/core/Slider';

const useStyles = makeStyles(theme =>
  createStyles({
    root: {
      width: 300,
    },
    margin: {
      height: theme.spacing(3),
    },
    sameRow: {
      display: 'flex',
    },
    letter: {
      alignSelf: 'center',
      marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
    },
  })
);

const fontSizes = [
  'xx-small',
  'x-small',
  'small',
  'medium',
  'large',
  'x-large',
  'xx-large',
];

interface IProps {
  label?: string;
  value?: string;
  font?: string;
  setSize?: (size: string) => void;
  disabled?: boolean;
}

export default function DiscreteSlider(props: IProps) {
  const { label, value, font, setSize, disabled } = props;
  const [position, setPosition] = React.useState(4);
  const [fontName, setFontNamne] = React.useState(font ? font : 'Charis SIL');
  const classes = useStyles();

  const valuetext = (pos: number) => {
    return fontSizes[pos];
  };

  const handleSlide = (e: any, v: any) => {
    setPosition(v);
    if (setSize) setSize(valuetext(v));
  };

  React.useEffect(() => {
    if (font) setFontNamne(font);
  }, [font]);

  React.useEffect(() => {
    const pos = fontSizes.indexOf(value ? value : 'large');
    if (pos !== -1) {
      setPosition(pos);
    }
  }, [value]);

  return (
    <div className={classes.root}>
      <Typography id="font-size-slider" gutterBottom>
        {label}
      </Typography>
      <div className={classes.sameRow}>
        <div
          className={classes.letter}
          style={{ fontSize: fontSizes[1], fontFamily: fontName }}
        >
          A
        </div>
        <Slider
          className={classes.letter}
          getAriaValueText={valuetext}
          valueLabelDisplay="off"
          value={position}
          step={1}
          marks
          min={0}
          max={6}
          onChange={handleSlide}
          disabled={disabled ? disabled : false}
        />
        <div
          className={classes.letter}
          style={{
            fontSize: value ? value : fontSizes[5],
            fontFamily: fontName,
          }}
        >
          A
        </div>
      </div>
    </div>
  );
}
