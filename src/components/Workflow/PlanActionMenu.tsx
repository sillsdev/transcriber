/* eslint-disable react-hooks/exhaustive-deps */
import React from 'react';
import { useGlobal } from 'reactn';
import {
  ISharedStrings,
  IPlanActionsStrings,
  IState,
  IMediaShare,
} from '../../model';
import localStrings from '../../selector/localize';
import { connect } from 'react-redux';
import Button from '@material-ui/core/Button';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import Grow from '@material-ui/core/Grow';
import Paper from '@material-ui/core/Paper';
import Popper from '@material-ui/core/Popper';
import MenuItem from '@material-ui/core/MenuItem';
import MenuList from '@material-ui/core/MenuList';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import MoreIcon from '@mui/icons-material/MoreHoriz';
import AssignIcon from '@mui/icons-material/PeopleAltOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/LibraryAddOutlined';
import MicIcon from '@mui/icons-material/Mic';
import { elemOffset } from '../../utils';
import { isElectron } from '../../api-variable';
import { AudacityLogo } from '../../control';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
    },
    paper: {
      marginRight: theme.spacing(2),
    },
    list: {
      display: 'flex',
    },
    action: {
      color: theme.palette.primary.light,
    },
  })
);

interface IStateProps {
  t: IPlanActionsStrings;
  ts: ISharedStrings;
}
interface IProps extends IStateProps {
  rowIndex: number;
  isSection: boolean;
  isPassage: boolean;
  mediaShared: IMediaShare;
  online: boolean;
  readonly: boolean;
  isPlaying: boolean;
  canAssign: boolean;
  canDelete: boolean;
  active: boolean;
  onPlayStatus: (mediaId: string) => void;
  onRecord: (i: number) => () => void;
  onUpload: (i: number) => () => void;
  onAudacity: (i: number) => () => void;
  onAssign: (where: number[]) => () => void;
  onDelete: (i: number) => () => void;
}
export function PlanActionMenu(props: IProps) {
  const {
    t,
    ts,
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
  const classes = useStyles();
  const [offlineOnly] = useGlobal('offlineOnly');
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

  const handleClose = (event: React.MouseEvent<EventTarget>) => {
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
    <div ref={menuRef} className={classes.root}>
      <div>
        <Button
          id="planMore"
          ref={anchorRef}
          aria-controls={open ? 'menu-list-grow' : undefined}
          aria-haspopup="true"
          onClick={handleToggle}
        >
          <MoreIcon className={classes.action} />
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
                    className={classes.list}
                  >
                    {isSection && canAssign && !readonly && (
                      <MenuItem
                        id="planActAssign"
                        title={t.assign}
                        onClick={onAssign([rowIndex])}
                      >
                        <AssignIcon className={classes.action} />
                      </MenuItem>
                    )}
                    {isPassage && (
                      <MenuItem
                        id="planActUpload"
                        onClick={onUpload(rowIndex)}
                        title={
                          !offlineOnly
                            ? ts.uploadMediaSingular
                            : ts.importMediaSingular
                        }
                      >
                        <AddIcon className={classes.action} />
                      </MenuItem>
                    )}
                    {isPassage && (
                      <MenuItem
                        id="planActRec"
                        onClick={handleRecord(rowIndex)}
                        title={t.recordAudio}
                      >
                        <MicIcon className={classes.action} />
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
                        <DeleteIcon className={classes.action} />
                      </MenuItem>
                    )}
                  </MenuList>
                </ClickAwayListener>
              </Paper>
            </Grow>
          )}
        </Popper>
      </div>
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'planActions' }),
  ts: localStrings(state, { layout: 'shared' }),
});
export default connect(mapStateToProps)(PlanActionMenu) as any as any;
