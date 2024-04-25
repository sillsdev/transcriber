/* eslint-disable react-hooks/exhaustive-deps */
import React from 'react';
import {
  ISharedStrings,
  IPlanActionsStrings,
  IPlanSheetStrings,
  IPassageTypeStrings,
} from '../../model';
import { shallowEqual, useSelector } from 'react-redux';
import {
  Box,
  Button,
  Popper,
  Grow,
  Paper,
  ClickAwayListener,
} from '@mui/material';
import MoreIcon from '@mui/icons-material/MoreHoriz';
import { elemOffset } from '../../utils';
import {
  passageTypeSelector,
  planActionsSelector,
  planSheetSelector,
  sharedSelector,
} from '../../selector';
import { PlanMoreMenuItems } from './PlanMoreMenuItems';
import { ExtraIcon } from '.';

interface IProps {
  rowIndex: number;
  isSection: boolean;
  isPassage: boolean;
  psgType: string;
  readonly: boolean;
  canAssign: boolean;
  canDelete: boolean;
  active: boolean;
  organizedBy: string;
  sectionSequenceNumber: string;
  passageSequenceNumber: string;
  firstMovement: number;
  onPlayStatus: (mediaId: string) => void;
  onRecord: (i: number) => void;
  onUpload: (i: number) => () => void;
  onAudacity: (i: number) => () => void;
  onAssign: (where: number[]) => () => void;
  onDelete: (i: number) => () => void;
  onFirstMovement: (i: number, fm: number) => void;
  onDisableFilter?: () => void;
  showIcon: (icon: ExtraIcon) => boolean;
  onAction: (i: number, what: ExtraIcon) => void;
}
export function PlanActionMenu(props: IProps) {
  const { active } = props;
  const t: IPlanActionsStrings = useSelector(planActionsSelector, shallowEqual);
  const p: IPlanSheetStrings = useSelector(planSheetSelector, shallowEqual);
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);
  const ty: IPassageTypeStrings = useSelector(
    passageTypeSelector,
    shallowEqual
  );
  const [open, setOpen] = React.useState(false);
  const [hover, setHover] = React.useState(false);
  const top = React.useRef<number>(0);
  const height = React.useRef<number>(0);
  const anchorRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

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

  function onKey(event: React.KeyboardEvent) {
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
                  <PlanMoreMenuItems
                    {...props}
                    open={open}
                    onKey={onKey}
                    t={t}
                    p={p}
                    ts={ts}
                    ty={ty}
                  />
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
