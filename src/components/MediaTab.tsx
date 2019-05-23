import React, { useState, useEffect } from 'react';
import { IMediaTabStrings } from '../model';
import { withStyles, WithStyles, Theme } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem'
import DropDownIcon from '@material-ui/icons/ArrowDropDown';
import AddIcon from '@material-ui/icons/Add';
import SnackBar from './SnackBar';
import Confirm from './AlertDialog';
import ShapingTable from './ShapingTable';

const styles = (theme: Theme) => ({
  container: {
      display: 'flex',
      marginLeft: theme.spacing.unit * 4,
      marginRight: theme.spacing.unit * 4,
      marginBottom: theme.spacing.unit * 4,
  },
  paper: {
  },
  actions: theme.mixins.gutters({
    paddingBottom: 16,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'right'
  }),
  button: {
    margin: theme.spacing.unit
  },
  icon: {
    marginLeft: theme.spacing.unit
  },
});

interface IRow {
  fileName: string;
  sectionId: string;
  sectionName: string;
  book: string;
  reference: string;
  duration: string;
  size: number;
  version: string;
};

interface IStateProps {
  t: IMediaTabStrings;
};

interface IProps extends IStateProps, WithStyles<typeof styles>{
  rowData: Array<IRow>;
  action?: (what: string, where: number[]) => boolean;
  upload?: () => void;
};
  
export function MediaTab(props: IProps) {
    const { classes, rowData, t,
        action, upload } = props;
    const [message, setMessage] = useState(<></>);
    const [data, setData] = useState(
      // Array<IRow>());
      [
        {fileName: 'GEN-001-001025.mp3', sectionId: '1', sectionName: 'Creation Story', book: 'Genesis', reference: '1:1-25a', duration: '30 seconds', size: 250, version: '1' },
        {fileName: 'GEN-001-002631.mp3', sectionId: '', sectionName: '', book: '', reference: '', duration: '45 seconds', size: 445, version: '1' },
      ]);
    const [actionMenuItem, setActionMenuItem] = useState(null);
    const [check, setCheck] = useState(Array<number>());
    const [confirmAction, setConfirmAction] = useState('');
    const columnDefs=[
      { name: 'fileName', title: t.fileName },
      { name: 'sectionId', title: t.sectionId },
      { name: 'sectionName', title: t.sectionName },
      { name: 'book', title: t.book },
      { name: 'reference', title: t.reference },
      { name: 'duration', title: t.duration },
      { name: 'size', title: t.size },
      { name: 'version', title: t.version },
    ];
    const columnWidths=[
      { columnName: "fileName", width: 200 },
      { columnName: "sectionId", width: 100 },
      { columnName: "sectionName", width: 150 },
      { columnName: "book", width: 100 },
      { columnName: "reference", width: 100 },
      { columnName: "duration", width: 100 },
      { columnName: "size", width: 100 },
      { columnName: "version", width: 100 },
    ];
    const sizeCols= ['size'];

    const handleMessageReset = () => { setMessage(<></>) }
    const handleUpload = () => {
      if (upload != null) {
        upload();
      }
    }
    const handleMenu = (e:any) => setActionMenuItem(e.currentTarget);
    const handleConfirmAction = (what: string) => (e:any) => {
      setActionMenuItem(null)
      if (check.length === 0) {
        setMessage(<span>Please select row(s) to {what}.</span>)
      } else if (!/Close/i.test(what)) {
        setConfirmAction(what);
      }
    };
    const handleActionConfirmed = () => {
      if (action != null) {
        if (action(confirmAction, check)) {
          setCheck(Array<number>());
        }
      }
      setConfirmAction('');
    };
    const handleActionRefused = () => {
      setConfirmAction('');
    };
    const handleCheck = (checks: Array<number>) => {
      setCheck(checks);
    }

    useEffect(() => {
      setData([
        {fileName: 'GEN-001-001025.mp3', sectionId: '1', sectionName: 'Creation Story', book: 'Genesis', reference: '1:1-25a', duration: '30 seconds', size: 250, version: '1' },
        {fileName: 'GEN-001-002631.mp3', sectionId: '', sectionName: '', book: '', reference: '', duration: '45 seconds', size: 445, version: '1' },
      ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rowData, check])

    return (
      <div className={classes.container}>
        <div className={classes.paper}>
          <div className={classes.actions}>
          <Button
              key="action"
              aria-owns={actionMenuItem !== ''? 'action-menu': undefined}
              aria-label={t.action}
              variant="outlined"
              color="primary"
              className={classes.button}
              onClick={handleMenu}
            >
              {t.action}
              <DropDownIcon className={classes.icon} />
            </Button>
            <Menu
              id='action-menu'
              anchorEl={actionMenuItem}
              open={Boolean(actionMenuItem)}
              onClose={handleConfirmAction('Close')}
            >
              <MenuItem onClick={handleConfirmAction('Delete')}>{t.delete}</MenuItem>
              <MenuItem onClick={handleConfirmAction('Download')}>{t.download}</MenuItem>
              <MenuItem onClick={handleConfirmAction('Change Version')}>{t.changeVersion}</MenuItem>
              <MenuItem onClick={handleConfirmAction('Assign Passage')}>{t.assignPassage}</MenuItem>
            </Menu>
            <Button
              key="upload"
              aria-label={t.uploadMedia}
              variant="outlined"
              color="primary"
              className={classes.button}
              onClick={handleUpload}
            >
              {t.uploadMedia}
              <AddIcon className={classes.icon} />
            </Button>
          </div>
          <ShapingTable
            columnDefs={columnDefs}
            columnWidths={columnWidths}
            sizeCols={sizeCols}
            rowData={data}
            select={handleCheck}
          />
        </div>
        {confirmAction !== ''
        ? <Confirm
            text={confirmAction + ' ' + check.length + ' Item(s). Are you sure?'}
            yesResponse={handleActionConfirmed}
            noResponse={handleActionRefused}
          />
        : <></>}        
        <SnackBar {...props} message={message} reset={handleMessageReset} />
      </div>
    );
}

export default withStyles(styles, { withTheme: true })(MediaTab) as any;
      