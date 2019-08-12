import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Slider from '@material-ui/core/Slider';

const useStyles = makeStyles(theme => ({
  root: {
    width: 300,
  },
  margin: {
    height: theme.spacing(3),
  },
}));

interface IProps {
  label?: string;
  setSize?: (size: string) => void;
}

export default function DiscreteSlider(props: IProps) {
  const { label, setSize } = props;
  const classes = useStyles();

  const fontSizes = [
    'xx-small',
    'x-small',
    'small',
    'medium',
    'large',
    'x-large',
    'xx-large',
  ];

  const valuetext = (value: number) => {
    return fontSizes[value];
  };

  const handleSlide = (e: any) => {
    if (setSize) setSize(fontSizes[parseInt(e.target.value)]);
  };

  return (
    <div className={classes.root}>
      <Typography id="font-size-slider" gutterBottom>
        {label}
      </Typography>
      <Slider
        defaultValue={4}
        getAriaValueText={valuetext}
        valueLabelFormat={valuetext}
        aria-labelledby="discrete-slider"
        valueLabelDisplay="auto"
        step={1}
        marks
        min={0}
        max={6}
        onChange={handleSlide}
      />
    </div>
  );
}
