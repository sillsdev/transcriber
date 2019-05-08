import React, { useState, useEffect } from 'react';
import { IProjectSettingsStrings } from '../model';
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

interface ICheck {
  [key: number]: any;
}

interface IChange {
  cell: any;
  row: number;
  col: number;
  value: string | null;
}

interface IStateProps {
  t: IProjectSettingsStrings;
};

interface IProps extends IStateProps, WithStyles<typeof styles>{
  columns: Array<ICell>;
  rowData: Array<Array<string>>;
};
  
export function PlanSheet(props: IProps) {
    const { classes, columns, rowData, t } = props;
    const [message, setMessage] = useState(<></>);
    const [data, setData] = useState(Array<Array<ICell>>());
    const [actionItem, setActionItem] = useState(null);
    const [check, setCheck] = useState(Array<boolean>());

    useEffect(() => {
      let headers: Array<ICell> = [{value:'', readOnly: true}];
      columns.map(c => headers.push({...c, readOnly: true}));
      let rows: Array<Array<ICell>> = [headers];
      rowData.map((r, i) => {
        const isSection = /^[0-9]+$/.test(r[0]);
        let oneRow: Array<ICell> = [{
          value: <CheckBox checked={check[i+1]} onChange={handleCheck(i+1)}/>,
          className: (isSection? 'set': 'pass'),
        }]
        r.map(r1 => oneRow.push({
          value: r1,
          className: (isNumber(r1)?'num': 'pass') + (isSection? ' set': '')
        }));
        rows.push(oneRow);
      });
      setData(rows);
      for (let i=0; i < rows.length; i += 1) {
        check[i] = false;
      }
      setCheck(check);
    }, [])

    const handleMessageReset = () => { setMessage(<></>) }
    const handleCheck = (row: number) => (e: any) => {
      check[row] = e.target.checked;
      setCheck(check);
    };
    const handleAddSection = () => setMessage(<span>Add Section</span>);
    const handleAddPassage = () => setMessage(<span>Add Passage</span>);
    const handleSave = () => setMessage(<span>Save</span>);
    const handleValueRender = (cell: ICell) => cell.value;
    const handleMenu = (e:any) => setActionItem(e.currentTarget);
    const handleMenuClose = (value: string) => (e: any) => {
      alert(JSON.stringify(check))
      setMessage(<span>{value}</span>);
      setActionItem(null)
    };

    const handleCellsChanged = (changes: Array<IChange>) => {
      const grid = data.map((row: any) => [...row]);
      changes.forEach(({cell, row, col, value}: IChange) => {
        grid[row][col] = {...grid[row][col], value}
      });
      setData(grid);
    };

    const handleContextMenu = (e: MouseEvent, cell: any) => cell.readOnly ? e.preventDefault() : null;

    const handlePaste = (s: string) => {
      const blankLines = /\r?\n\t*\r?\n/;
      const chunks = s.split(blankLines)
      const lines = chunks.join('\n').replace(/\r?\n$/,'').split('\n')
      return lines.map(s => s.split('\t'));
    }

    return (
      <div className={classes.container}>
        <div className={classes.paper}>
          <div className={classes.actions}>
          <Button
              key="action"
              aria-owns={actionItem != ''? 'action-menu': undefined}
              aria-label={'Action'}
              variant="outlined"
              color="primary"
              className={classes.button}
              onClick={handleMenu}
            >
              {'Action'}
              <DropDownIcon className={classes.icon} />
            </Button>
            <Menu
              id='action-menu'
              anchorEl={actionItem}
              open={Boolean(actionItem)}
              onClose={handleMenuClose('Close')}
            >
              <MenuItem onClick={handleMenuClose('Delete')}>{'Delete'}</MenuItem>
              <MenuItem onClick={handleMenuClose('Move')}>{'Move'}</MenuItem>
              <MenuItem onClick={handleMenuClose('Copy')}>{'Copy'}</MenuItem>
              <MenuItem onClick={handleMenuClose('Assign Media')}>{'Assign Media'}</MenuItem>
              <MenuItem onClick={handleMenuClose('Assign Passage')}>{'Assign Passage'}</MenuItem>
            </Menu>
            <Button
              key="addSection"
              aria-label={'Add Section'}
              variant="outlined"
              color="primary"
              className={classes.button}
              onClick={handleAddSection}
            >
              {'Add Section'}
              <AddIcon className={classes.icon} />
            </Button>
            <Button
              key="addPassage"
              aria-label={'Add Passage'}
              variant="outlined"
              color="primary"
              className={classes.button}
              onClick={handleAddPassage}
            >
              {'Add Passage'}
              <AddIcon className={classes.icon} />
            </Button>
            <Button
              key="save"
              aria-label={'Save'}
              variant="contained"
              color="primary"
              className={classes.button}
              onClick={handleSave}
            >
              {'Save'}
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
        <SnackBar {...props} message={message} reset={handleMessageReset} />
      </div>
    );
}

export default withStyles(styles, { withTheme: true })(PlanSheet) as any;
      