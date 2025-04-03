import React from 'react';
import { IDiscussionMenuStrings } from '../../model';
import { IconButton, ListItemIcon, ListItemText } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ResolveIcon from '@mui/icons-material/Check';
import ReopenIcon from '@mui/icons-material/Unarchive';
import LinkIcon from '@mui/icons-material/Link';
import { StyledMenu, StyledMenuItem } from '../../control';
import { useGlobal } from '../../context/GlobalContext';
import { discussionMenuSelector } from '../../selector';
import { shallowEqual, useSelector } from 'react-redux';

interface IProps {
  id?: string;
  action?: (what: string) => void;
  resolved?: boolean;
  canSet?: boolean;
  canResolve: boolean;
  canEdit: boolean;
  stopPlayer?: () => void;
}

export function DiscussionMenu(props: IProps) {
  const { id, action, resolved, canSet, canResolve, canEdit, stopPlayer } =
    props;
  const [offlineOnly] = useGlobal('offlineOnly'); //will be constant here
  const [offline] = useGlobal('offline'); //verified this is not used in a function 2/18/25
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const t: IDiscussionMenuStrings = useSelector(
    discussionMenuSelector,
    shallowEqual
  );

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    if (stopPlayer) stopPlayer();
  };

  const handle = (what: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setAnchorEl(null);
    if (action) {
      action(what);
    }
  };

  return (
    <div>
      <IconButton
        id={id || 'commentMenu'}
        aria-controls="customized-menu"
        aria-haspopup="true"
        sx={{ color: 'background.paper' }}
        onClick={handleClick}
      >
        <MoreVertIcon />
      </IconButton>
      <StyledMenu
        id="customized-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handle('Close')}
      >
        {!resolved && canEdit && (
          <StyledMenuItem
            id="commentEdit"
            aria-hidden={!Boolean(anchorEl)}
            onClick={handle('edit')}
          >
            <ListItemIcon>
              <EditIcon />
            </ListItemIcon>
            <ListItemText primary={t.edit} />
          </StyledMenuItem>
        )}
        {(!offline || offlineOnly) && canResolve && (
          <StyledMenuItem
            id="commentMenudelete"
            aria-hidden={!Boolean(anchorEl)}
            onClick={handle('delete')}
          >
            <ListItemIcon>
              <DeleteIcon />
            </ListItemIcon>
            <ListItemText primary={t.delete} />
          </StyledMenuItem>
        )}
        {resolved === false && canResolve && (
          <StyledMenuItem
            id="resolve"
            aria-hidden={!Boolean(anchorEl)}
            onClick={handle('resolve')}
          >
            <ListItemIcon>
              <ResolveIcon />
            </ListItemIcon>
            <ListItemText primary={t.resolve} />
          </StyledMenuItem>
        )}
        {resolved && (
          <StyledMenuItem
            id="reopen"
            aria-hidden={!Boolean(anchorEl)}
            onClick={handle('reopen')}
          >
            <ListItemIcon>
              <ReopenIcon />
            </ListItemIcon>
            <ListItemText primary={t.reopen} />
          </StyledMenuItem>
        )}
        {canSet && (
          <StyledMenuItem
            id="set"
            aria-hidden={!Boolean(anchorEl)}
            onClick={handle('set')}
          >
            <ListItemIcon>
              <LinkIcon />
            </ListItemIcon>
            <ListItemText primary={t.setSegment} />
          </StyledMenuItem>
        )}
        {resolved !== undefined && (
          <StyledMenuItem
            id="move"
            aria-hidden={!Boolean(anchorEl)}
            onClick={handle('move')}
          >
            <ListItemIcon></ListItemIcon>
            <ListItemText primary={t.move} />
          </StyledMenuItem>
        )}
      </StyledMenu>
    </div>
  );
}

export default DiscussionMenu;
