import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import plusminusLogo from '../assets/icons8-upvote-downvote-96.png';
import plusminusLogoGray from '../assets/icons8-upvote-downvote-gray.png';
//todo: add attribution if we end up using these icons  <a target="_blank" href="https://icons8.com/icon/90294/upvote-downvote">Upvote Downvote</a> icon by <a target="_blank" href="https://icons8.com">Icons8</a>

const useStyles = makeStyles({
  logo: {
    width: '24px',
    height: '24px',
  },
});

interface IProps {
  disabled?: boolean;
}
export const PlusMinusLogo = (props: IProps) => {
  const { disabled } = props;
  const classes = useStyles();

  return (
    <img
      src={disabled ? plusminusLogoGray : plusminusLogo}
      alt="Audacity Logo"
      className={classes.logo}
    />
  );
};
export default PlusMinusLogo;
