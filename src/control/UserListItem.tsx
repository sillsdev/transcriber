import { UserD } from '../model';
import {
  Button,
  ListItem,
  ListItemIcon,
  ListItemText,
  ButtonProps,
  styled,
  ListItemButton,
} from '@mui/material';
import UserAvatar from '../components/UserAvatar';
import { ListEnum, useOfflineList } from '../crud';

const StyledButton = styled(Button)<ButtonProps>(() => ({
  '& .MuiTypography-root': {
    textTransform: 'none',
  },
}));

interface IProps {
  u: UserD;
  onSelect?: (user: string) => void;
  show?: ListEnum;
}
export const UserListItem = (props: IProps) => {
  const { u, onSelect, show } = props;
  const list = useOfflineList();

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
        secondary={show ? list(u, show) : ''}
      />
    </StyledButton>
  );

  return onSelect ? (
    <ListItemButton
      id={`user-${u.id}`}
      key={u.id}
      onClick={handleSelect(u.id)}
    >
      <ItemContent />
    </ListItemButton>
  ) : (
    <ListItem id={`user-${u.id}`} key={u.id}>
      <ItemContent />
    </ListItem>
  );
};
