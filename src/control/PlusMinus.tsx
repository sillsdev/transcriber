import plusminusLogo from '../assets/icons8-upvote-downvote-96.png';
import plusminusLogoGray from '../assets/icons8-upvote-downvote-gray.png';
import { LogoImg } from '.';
//todo: add attribution if we end up using these icons  <a target="_blank" href="https://icons8.com/icon/90294/upvote-downvote">Upvote Downvote</a> icon by <a target="_blank" href="https://icons8.com">Icons8</a>

interface IProps {
  disabled?: boolean;
}
export const PlusMinusLogo = (props: IProps) => {
  const { disabled } = props;

  return (
    <LogoImg
      src={disabled ? plusminusLogoGray : plusminusLogo}
      alt="Plus-Minus Logo"
    />
  );
};
export default PlusMinusLogo;
