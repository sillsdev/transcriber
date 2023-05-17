/* eslint-disable react-hooks/exhaustive-deps */
import React from 'react';
import { ISharedStrings, IPlanActionsStrings } from '../../model';
import { shallowEqual, useSelector } from 'react-redux';
import {
  Button,
  Grow,
  Paper,
  Popper,
  MenuItem,
  MenuList,
  ClickAwayListener,
  Box,
} from '@mui/material';
import MoreIcon from '@mui/icons-material/MoreHoriz';
import AssignIcon from '@mui/icons-material/PeopleAltOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/LibraryAddOutlined';
import MicIcon from '@mui/icons-material/Mic';
import { elemOffset } from '../../utils';
import { isElectron } from '../../api-variable';
import { AudacityLogo } from '../../control';
import { planActionsSelector, sharedSelector } from '../../selector';

interface IProps {
  rowIndex: number;
  isSection: boolean;
  isPassage: boolean;
  readonly: boolean;
  canAssign: boolean;
  canDelete: boolean;
  active: boolean;
  onPlayStatus: (mediaId: string) => void;
  onRecord: (i: number) => void;
  onUpload: (i: number) => () => void;
  onAudacity: (i: number) => () => void;
  onAssign: (where: number[]) => () => void;
  onDelete: (i: number) => () => void;
}
export function PlanActionMenu(props: IProps) {
  const {
    rowIndex,
    isSection,
    isPassage,
    readonly,
    onPlayStatus,
    onRecord,
    onUpload,
    onAudacity,
    onAssign,
    onDelete,
    canAssign,
    canDelete,
    active,
  } = props;
  const t: IPlanActionsStrings = useSelector(planActionsSelector, shallowEqual);
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);
  const [open, setOpen] = React.useState(false);
  const [hover, setHover] = React.useState(false);
  const top = React.useRef<number>(0);
  const height = React.useRef<number>(0);
  const anchorRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const handleRecord = (index: number) => () => {
    onPlayStatus('');
    onRecord(index);
  };

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event: MouseEvent | TouchEvent) => {
    if (
      anchorRef.current &&
      anchorRef.current.contains(event.target as HTMLElement)
    ) {
      return;
    }

    setOpen(false);
  };

  function handleListKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'Tab') {
      event.preventDefault();
      setOpen(false);
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.stopPropagation();
    } else if (event.key === 'Escape') {
      setHover(false);
      setOpen(false);
    }
  }

  const handleMove = (event: MouseEvent) => {
    const y = event.pageY;
    if (y < top.current || y > top.current + height.current) {
      setHover(false);
      window.removeEventListener('mouseover', handleMove);
    }
  };

  const handleOver = () => {
    setHover(true);
    if (menuRef.current) {
      const { y } = elemOffset(menuRef.current);
      top.current = y;
      height.current = menuRef.current?.clientHeight;
      window.addEventListener('mouseover', handleMove);
    }
  };

  React.useEffect(() => {
    if (anchorRef.current) {
      anchorRef.current.addEventListener('mouseover', handleOver);
    }
    return () => {
      if (anchorRef.current) {
        anchorRef.current.removeEventListener('mouseover', handleOver);
      }
      window.removeEventListener('mouseover', handleMove);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // return focus to the button when we transitioned from !open -> open
  const prevOpen = React.useRef(open);
  React.useEffect(() => {
    if (prevOpen.current === true && open === false) {
      anchorRef.current!.focus();
    }

    prevOpen.current = open;
  }, [open]);

  React.useEffect(() => {
    if (active) setOpen(true);
  }, [active]);

  return (
    <Box ref={menuRef} sx={{ display: 'flex' }}>
      <div>
        <Button
          id="planMore"
          ref={anchorRef}
          aria-controls={open ? 'menu-list-grow' : undefined}
          aria-haspopup="true"
          onClick={handleToggle}
        >
          <MoreIcon sx={{ color: 'primary.light' }} />
        </Button>
        <Popper
          open={open || hover}
          anchorEl={anchorRef.current}
          placement="right"
          role={undefined}
          transition
          disablePortal
        >
          {({ TransitionProps, placement }) => (
            <Grow
              {...TransitionProps}
              style={{
                transformOrigin:
                  placement === 'right' ? 'middle left' : 'middle right',
              }}
            >
              <Paper>
                <ClickAwayListener onClickAway={handleClose}>
                  <MenuList
                    autoFocusItem={open}
                    id="menu-list-grow"
                    onKeyDown={handleListKeyDown}
                    sx={{ display: 'flex' }}
                  >
                    {isSection && canAssign && !readonly && (
                      <MenuItem
                        id="planActAssign"
                        title={t.assign}
                        onClick={onAssign([rowIndex])}
                      >
                        <AssignIcon sx={{ color: 'primary.light' }} />
                      </MenuItem>
                    )}
                    {isPassage && (
                      <MenuItem
                        id="planActUpload"
                        onClick={onUpload(rowIndex)}
                        title={ts.uploadMediaSingular}
                      >
                        <AddIcon sx={{ color: 'primary.light' }} />
                      </MenuItem>
                    )}
                    {isPassage && (
                      <MenuItem
                        id="planActRec"
                        onClick={handleRecord(rowIndex)}
                        title={t.recordAudio}
                      >
                        <MicIcon sx={{ color: 'primary.light' }} />
                      </MenuItem>
                    )}
                    {isElectron && isPassage && (
                      <MenuItem
                        id="planActAud"
                        title={ts.launchAudacity}
                        onClick={onAudacity(rowIndex)}
                      >
                        <AudacityLogo />
                      </MenuItem>
                    )}
                    {canDelete && !readonly && (
                      <MenuItem
                        id="planActDel"
                        title={t.delete}
                        onClick={onDelete(rowIndex)}
                      >
                        <DeleteIcon sx={{ color: 'primary.light' }} />
                      </MenuItem>
                    )}
                  </MenuList>
                </ClickAwayListener>
              </Paper>
            </Grow>
          )}
        </Popper>
      </div>
    </Box>
  );
}

export default PlanActionMenu;
