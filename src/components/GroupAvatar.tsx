import { GroupD } from '../model';
import { Avatar, AvatarProps, styled } from '@mui/material';
import { makeAbbr } from '../utils';
import { useAvatarSource } from '../crud';

// see: https://mui.com/material-ui/customization/how-to-customize/
interface StyledAvatarProps extends AvatarProps {
  small?: boolean;
}
const StyledAvatar = styled(Avatar, {
  shouldForwardProp: (prop) => prop !== 'small',
})<StyledAvatarProps>(({ small, theme }) => ({
  ...(small
    ? {
        width: theme.spacing(3),
        height: theme.spacing(3),
      }
    : {
        width: theme.spacing(5),
        height: theme.spacing(5),
      }),
}));

interface IProps {
  groupRec: GroupD;
  small?: boolean;
}

export function GroupAvatar(props: IProps) {
  const { groupRec, small } = props;
  const source = useAvatarSource(groupRec.attributes.name, groupRec);

  return source ? (
    <StyledAvatar alt={groupRec.attributes.name} src={source} small={small} />
  ) : groupRec.attributes && groupRec.attributes.name !== '' ? (
    <StyledAvatar small={small}>
      {makeAbbr(groupRec.attributes.name)}
    </StyledAvatar>
  ) : (
    <></>
  );
}

export default GroupAvatar;
