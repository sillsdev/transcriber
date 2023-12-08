import { UserD } from '../model';
import {
  Button,
  ListItem,
  ListItemIcon,
  ListItemText,
  ButtonProps,
  styled,
} from '@mui/material';
import UserAvatar from '../components/UserAvatar';
import { useOfflineTeamList } from '../crud';

const StyledButton = styled(Button)<ButtonProps>(() => ({
  '& .MuiTypography-root': {
    textTransform: 'none',
  },
}));

interface IProps {
  u: UserD;
  onSelect?: (user: string) => void;
  showTeams: boolean;
}
export const UserListItem = (props: IProps) => {
  const { u, onSelect, showTeams } = props;
  const teams = useOfflineTeamList();

  const handleSelect = (user: string) => () => {
    onSelect && onSelect(user);
  };

  const ItemContent = () => (
    <StyledButton variant="outlined">
      <ListItemIcon>
        <UserAvatar {...props} userRec={u} />
      </ListItemIcon>
      <ListItemText
        primary={u?.attributes?.name || ''}
        secondary={showTeams ? teams(u) : ''}
      />
    </StyledButton>
  );

  return onSelect ? (
    <ListItem
      id={`user-${u.id}`}
      key={u.id}
      onClick={handleSelect(u.id)}
      button
    >
      <ItemContent />
    </ListItem>
  ) : (
    <ListItem id={`user-${u.id}`} key={u.id}>
      <ItemContent />
    </ListItem>
  );
};
