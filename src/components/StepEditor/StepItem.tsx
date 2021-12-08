import { SortableElement } from 'react-sortable-hoc';
import { ListItem, IconButton, makeStyles } from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import RestoreIcon from '@material-ui/icons/DeleteForever';
import { IStepRow, DragHandle } from '.';
import StepName from './StepName';
import ToolChoice from './ToolChoice';

const useStyles = makeStyles({
  step: { minWidth: 200 },
  tool: { minWidth: 200 },
});

interface IProps {
  value: IStepRow;
  onNameChange: (id: string, name: string) => void;
  onToolChange: (id: string, tool: string) => void;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
}

export const StepItem = SortableElement(
  ({ value, onNameChange, onToolChange, onDelete, onRestore }: IProps) => {
    const classes = useStyles();

    const handleNameChange = (name: string) => {
      onNameChange(value.id, name);
    };
    const handleToolChange = (tool: string) => {
      onToolChange(value.id, tool);
    };
    const handleDeleteOrRestore = () => {
      if (value.seq >= 0) onDelete(value.id);
      else onRestore(value.id);
    };

    return (
      <ListItem>
        <DragHandle />
        <span className={classes.step}>
          <StepName name={value.name} onChange={handleNameChange} />
        </span>
        <span className={classes.tool}>
          <ToolChoice tool={value.tool} onChange={handleToolChange} />
        </span>
        <IconButton onClick={handleDeleteOrRestore}>
          {value.seq >= 0 ? <DeleteIcon /> : <RestoreIcon />}
        </IconButton>
      </ListItem>
    );
  }
);
