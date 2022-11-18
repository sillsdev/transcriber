import React from 'react';
import { useGlobal } from 'reactn';
import { User, GroupMembership, IState, IUsertableStrings } from '../model';
import localStrings from '../selector/localize';
import { withData } from 'react-orbitjs';
import { connect } from 'react-redux';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  styled,
  DialogProps,
} from '@mui/material';
import { QueryBuilder } from '@orbit/data';
import UserList from '../control/UserList';
import { related, allUsersRec } from '../crud';

const StyledDialog = styled(Dialog)<DialogProps>(() => ({
  '& .MuiPaper-root': {
    minWidth: '300px',
  },
}));

interface IStateProps {
  t: IUsertableStrings;
}

interface IRecordProps {
  users: Array<User>;
}

interface IProps extends IStateProps, IRecordProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  select: (userId: string) => () => void;
  add: () => void;
}
export function UserAdd(props: IProps) {
  const { open, setOpen, select, add, users, t } = props;
  const [scroll] = React.useState<DialogProps['scroll']>('paper');
  const [memory] = useGlobal('memory');
  const [organization] = useGlobal('organization');

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
    const memberRecs = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('groupmembership')
    ) as GroupMembership[];
    const memberRec = memberRecs.filter(
      (gm) => related(gm, 'group') === groupId && related(gm, 'user') === userId
    );
    return memberRec.length === 0;
  };

  const hasIncluded = () => {
    for (let i = users.length; i >= 0; i -= 1)
      if (isIncluded(users[i]?.id)) return true;
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

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'usertable' }),
});

const mapRecordsToProps = {
  users: (q: QueryBuilder) => q.findRecords('user'),
};

export default withData(mapRecordsToProps)(
  connect(mapStateToProps)(UserAdd) as any
) as any;
