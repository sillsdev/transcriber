import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import audacityLogo from '../assets/audacity.png';
import audacityGrayLogo from '../assets/audacity-gray.png';

const useStyles = makeStyles({
  logo: {
    width: '24px',
    height: '24px',
  },
});

interface IProps {
  disabled?: boolean;
}
export const AudacityLogo = (props: IProps) => {
  const { disabled } = props;
  const classes = useStyles();

  return (
    <img
      src={disabled ? audacityGrayLogo : audacityLogo}
      alt="Audacity Logo"
      className={classes.logo}
    />
  );
};
export default AudacityLogo;
