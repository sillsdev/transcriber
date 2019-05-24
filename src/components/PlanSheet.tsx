import React, { useState, useEffect } from 'react';
import { IPlanSheetStrings } from '../model';
import { withStyles, WithStyles, Theme } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem'
import SaveIcon from '@material-ui/icons/Save';
import DropDownIcon from '@material-ui/icons/ArrowDropDown';
import AddIcon from '@material-ui/icons/Add';
import CheckBox from '@material-ui/core/Checkbox';
import SnackBar from './SnackBar';
import DataSheet from 'react-datasheet';
import Confirm from './AlertDialog';
import 'react-datasheet/lib/react-datasheet.css';
import './PlanSheet.css';
import { isNumber } from 'util';

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

interface ICell {
  value: any;
  readOnly?: boolean;
  width?: number;
  className?: string;
};

interface IChange {
  cell: any;
  row: number;
  col: number;
  value: string | null;
}

interface IStateProps {
  t: IPlanSheetStrings;
};

interface IProps extends IStateProps, WithStyles<typeof styles>{
  columns: Array<ICell>;
  rowData: Array<Array<string|number>>;
  save: (r: string[][]) => void;
  paste: (r: string[][]) => string[][];
  action: (what: string, where: number[]) => boolean;
  addPassage: () => void;
  addSection: () => void;
};
  
export function PlanSheet(props: IProps) {
    const { classes, columns, rowData, t,
        save, action, addPassage, addSection, paste } = props;
    const [message, setMessage] = useState(<></>);
    const [data, setData] = useState(Array<Array<ICell>>());
    const [actionMenuItem, setActionMenuItem] = useState(null);
    const [check, setCheck] = useState(Array<number>());
    const [confirmAction, setConfirmAction] = useState('');
    const [dirty, setDirty] = useState(false);

    const handleMessageReset = () => { setMessage(<></>) }
    const handleCheck = (row: number) => (e: any) => {
      if (e.target.checked) {
        check.push(row);
        if (/^[0-9]+$/.test(rowData[row][0].toString())) {
          do {
            row += 1;
            if (row === rowData.length ||
              /^[0-9]+$/.test(rowData[row][0].toString())) { break };
            check.push(row);
          } while (true);
        }
        setCheck([...check]);
      } else {
        setCheck(check.filter(i => i !== row));
      }
    };
    const handleAddSection = () => {
      if (dirty) {
        setMessage(<span>Save before adding section</span>)
      } else if (addSection != null) {
        addSection();
      }
    }
    const handleAddPassage = () => {
      if (dirty) {
        setMessage(<span>Save before adding passage</span>)
      } else if (addPassage != null) {
        addPassage();
      }
    }
    const handleSave = () => {
      setMessage(<span>Saving</span>);
      if (save != null) {
        const rows = data.filter((r, i) => i > 0).map(r => r.filter((r,i) => i > 0).map(c => c.value));
        save(rows)
      }
    }
    const handleValueRender = (cell: ICell) => cell.value;
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

    const handleCellsChanged = (changes: Array<IChange>) => {
      const grid = data.map((row: any) => [...row]);
      changes.forEach(({cell, row, col, value}: IChange) => {
        grid[row][col] = {...grid[row][col], value}
      });
      if (changes.length > 0) {
        setData(grid);
        setDirty(true);
      }
    };

    const handleContextMenu = (e: MouseEvent, cell: any) => cell.readOnly ? e.preventDefault() : null;

    const handlePaste = (s: string) => {
      const blankLines = /\r?\n\t*\r?\n/;
      const chunks = s.split(blankLines)
      const lines = chunks.join('\n').replace(/\r?\n$/,'').split('\n')
      if (paste) return paste(lines.map(s => s.split('\t')));
      return lines.map(s => s.split('\t'));
    }

    useEffect(() => {
      setData(
        [[{value:'', readOnly: true} as ICell].concat(
          columns.map(c => {return {...c, readOnly: true}}))].concat(
            rowData.map((r,i) => {
              const isSection = /^[0-9]+$/.test(r[0].toString());
              return (
                [{
                  value: <CheckBox data-testid={check.includes(i)? 'checked': 'check'}
                    checked={check.includes(i)} onChange={handleCheck(i)}/>,
                  className: (isSection? 'set': 'pass'),
                } as ICell].concat(
                r.map(e => {return {
                  value: e,
                  className: (isNumber(e)?'num': 'pass') + (isSection? ' set': ''),
                }})
              )
            )})
          ));
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
              <MenuItem onClick={handleConfirmAction('Move')}>{t.move}</MenuItem>
              <MenuItem onClick={handleConfirmAction('Copy')}>{t.copy}</MenuItem>
              <MenuItem onClick={handleConfirmAction('Assign Media')}>{t.assignMedia}</MenuItem>
              <MenuItem onClick={handleConfirmAction('Assign Passage')}>{t.assignPassage}</MenuItem>
            </Menu>
            <Button
              key="addSection"
              aria-label={t.addSection}
              variant="outlined"
              color="primary"
              className={classes.button}
              onClick={handleAddSection}
            >
              {t.addSection}
              <AddIcon className={classes.icon} />
            </Button>
            <Button
              key="addPassage"
              aria-label={t.addPassage}
              variant="outlined"
              color="primary"
              className={classes.button}
              onClick={handleAddPassage}
            >
              {t.addPassage}
              <AddIcon className={classes.icon} />
            </Button>
            <Button
              key="save"
              aria-label={t.save}
              variant="contained"
              color="primary"
              className={classes.button}
              onClick={handleSave}
            >
              {t.save}
              <SaveIcon className={classes.icon} />
            </Button>
          </div>

          <DataSheet
            data={data as any[][]}
            valueRenderer={handleValueRender}
            onContextMenu={handleContextMenu}
            onCellsChanged={handleCellsChanged}
            parsePaste={handlePaste}
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

export default withStyles(styles, { withTheme: true })(PlanSheet) as any;
      