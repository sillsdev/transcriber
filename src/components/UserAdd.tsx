import React from 'react';
import { useGlobal } from '../context/GlobalContext';
import { User, GroupMembership, IUsertableStrings } from '../model';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  styled,
  DialogProps,
} from '@mui/material';
import UserList from '../control/UserList';
import { related, allUsersRec } from '../crud';
import { useOrbitData } from '../hoc/useOrbitData';
import { shallowEqual, useSelector } from 'react-redux';
import { userTableSelector } from '../selector';

const StyledDialog = styled(Dialog)<DialogProps>(() => ({
  '& .MuiPaper-root': {
    minWidth: '300px',
  },
}));

interface IProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  select: (userId: string) => () => void;
  add: () => void;
}
export function UserAdd(props: IProps) {
  const { open, setOpen, select, add } = props;
  const users = useOrbitData<User[]>('user');
  const [scroll] = React.useState<DialogProps['scroll']>('paper');
  const [memory] = useGlobal('memory');
  const [organization] = useGlobal('organization');
  const t: IUsertableStrings = useSelector(userTableSelector, shallowEqual);

  // const handleClickOpen = (scrollType: DialogProps['scroll']) => () => {
  //   setOpen(true);
  //   setScroll(scrollType);
  // };

  const handleClose = () => {
    setOpen(false);
  };

  const handleAdd = () => {
    setOpen(false);
    add();
  };

  const isIncluded = (userId: string): boolean => {
    const userRec = users.filter((u) => u?.id === userId);
    if (userRec.length === 0) return false;
    const groupId = allUsersRec(memory, organization)?.id;
    const memberRecs = memory?.cache.query((q) =>
      q.findRecords('groupmembership')
    ) as GroupMembership[];
    const memberRec = memberRecs.filter(
      (gm) => related(gm, 'group') === groupId && related(gm, 'user') === userId
    );
    return memberRec.length === 0;
  };

  const hasIncluded = () => {
    for (let i = users.length; i >= 0; i -= 1)
      if (isIncluded(users[i]?.id as string)) return true;
    return false;
  };

  const descriptionElementRef = React.useRef<HTMLElement>(null);
  React.useEffect(() => {
    if (open) {
      const { current: descriptionElement } = descriptionElementRef;
      if (descriptionElement !== null) {
        descriptionElement.focus();
      }
    }
  }, [open]);

  return (
    <div>
      <StyledDialog
        open={open}
        onClose={handleClose}
        scroll={scroll}
        aria-labelledby="userAddDlg"
      >
        <DialogTitle id="userAddDlg">{t.selectUser}</DialogTitle>
        <DialogContent dividers={scroll === 'paper'}>
          {hasIncluded() && (
            <UserList isSelected={isIncluded} select={select} />
          )}
        </DialogContent>
        <DialogActions
          sx={{ display: 'flex', justifyContent: 'space-between' }}
        >
          <Button id="userAdd" variant="contained" onClick={handleAdd}>
            {t.addNewUser}
          </Button>
          <Button id="userAddCancel" variant="contained" onClick={handleClose}>
            {t.cancel}
          </Button>
        </DialogActions>
      </StyledDialog>
    </div>
  );
}

export default UserAdd;
