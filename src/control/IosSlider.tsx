import { Slider, SliderProps, styled } from '@mui/material';

const iOSBoxShadow =
  '0 3px 1px rgba(0,0,0,0.1),0 4px 8px rgba(0,0,0,0.13),0 0 0 1px rgba(0,0,0,0.02)';

export const IosSlider = styled(Slider)<SliderProps>(() => ({
  width: '50px',
  color: '#3880ff',
  height: 2,
  padding: '15px 0',
  '& .MuiSlider-thumb': {
    height: 10,
    width: 10,
    top: 20,
    boxShadow: iOSBoxShadow,
    '&:focus, &:hover, &$active': {
      boxShadow: iOSBoxShadow,
      // Reset on touch devices, it doesn't add specificity
      '@media (hover: none)': {
        boxShadow: iOSBoxShadow,
      },
    },
  },
  '& .MuiSlider-valueLabel': {
    top: 5,
    background: 'transparent',
    color: '#000',
  },
  '& .MuiSlider-track': {
    height: 2,
  },
  '& .MuiSlider-rail': {
    height: 2,
    opacity: 0.5,
    backgroundColor: '#bfbfbf',
  },
  '& .MuiSlider-mark': {
    backgroundColor: '#bfbfbf',
    height: 3,
    width: 1,
    marginTop: -1,
  },
  '& .MuiSlider-markActive': {
    opacity: 1,
    backgroundColor: 'currentColor',
  },
}));
