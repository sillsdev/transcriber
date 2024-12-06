import { useState, useEffect } from 'react';
import { Typography, Slider, SliderProps, Box, styled } from '@mui/material';
import { fontFamilyName } from '../utils/fontFamilyName';

const Letter = styled('div')(({ theme }) => ({
  alignSelf: 'center',
  marginLeft: theme.spacing(1),
  marginRight: theme.spacing(1),
}));

const StyledSlider = styled(Slider)<SliderProps>(({ theme }) => ({
  alignSelf: 'center',
  marginLeft: theme.spacing(1),
  marginRight: theme.spacing(1),
}));

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

export default function FontSize(props: IProps) {
  const { label, value, font, setSize, disabled } = props;
  const [position, setPosition] = useState(4);
  const [fontName, setFontNamne] = useState(
    font ? fontFamilyName(font) : 'Charis SIL'
  );

  const valuetext = (pos: number) => {
    return fontSizes[pos];
  };

  const handleSlide = (e: any, v: any) => {
    setPosition(v);
    if (setSize) setSize(valuetext(v));
  };

  useEffect(() => {
    if (font) setFontNamne(fontFamilyName(font));
  }, [font]);

  useEffect(() => {
    const pos = fontSizes.indexOf(value ? value : 'large');
    if (pos !== -1) {
      setPosition(pos);
    }
  }, [value]);

  return (
    <Box sx={{ width: '300px' }}>
      <Typography id="font-size-slider" gutterBottom>
        {label}
      </Typography>
      <Box sx={{ display: 'flex' }}>
        <Letter style={{ fontSize: fontSizes[1], fontFamily: fontName }}>
          A
        </Letter>
        <StyledSlider
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
        <Letter
          style={{
            fontSize: value ? value : fontSizes[5],
            fontFamily: fontName,
          }}
        >
          A
        </Letter>
      </Box>
    </Box>
  );
}
