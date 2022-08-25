import {
  Menu,
  MenuProps,
  MenuItem,
  MenuItemProps,
  styled,
} from '@mui/material';

const MenuWithStyles = styled(Menu)<MenuProps>(() => ({
  '.MuiPaper-root': {
    border: '1px solid #d3d4d5',
  },
}));

export const StyledMenu = (props: MenuProps) => (
  <MenuWithStyles
    elevation={0}
    anchorEl={null}
    anchorOrigin={{
      vertical: 'bottom',
      horizontal: 'right',
    }}
    transformOrigin={{
      vertical: 'top',
      horizontal: 'right',
    }}
    {...props}
  />
);

export const StyledMenuItem = styled(MenuItem)<MenuItemProps>(({ theme }) => ({
  '&:focus': {
    backgroundColor: theme.palette.primary.main,
    '& .MuiListItemIcon-root, & .MuiListItemText-primary': {
      color: theme.palette.common.white,
    },
  },
}));
