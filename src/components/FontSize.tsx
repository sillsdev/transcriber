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
}

export default function DiscreteSlider(props: IProps) {
  const { label, value, font, setSize } = props;
  const [position, setPosition] = React.useState(
    value ? fontSizes.indexOf(value) : 4
  );
  const [fontName, setFontNamne] = React.useState(font ? font : 'Charis SIL');
  const classes = useStyles();

  const valuetext = (value: number) => {
    return fontSizes[value];
  };

  const handleSlide = (e: any, v: any) => {
    setPosition(v);
    if (setSize) setSize(valuetext(v));
  };

  React.useEffect(() => {
    if (font) setFontNamne(font);
  }, [font]);

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
          defaultValue={position}
          getAriaValueText={valuetext}
          aria-labelledby="discrete-slider"
          valueLabelDisplay="off"
          step={1}
          marks
          min={0}
          max={6}
          onChange={handleSlide}
        />
        <div
          className={classes.letter}
          style={{ fontSize: fontSizes[5], fontFamily: fontName }}
        >
          A
        </div>
      </div>
      {/* <br />
      <span style={{ fontSize: valuetext(position), fontFamily: fontName }}>
        A
      </span> */}
    </div>
  );
}
