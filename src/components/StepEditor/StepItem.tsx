import { SortableElement } from 'react-sortable-hoc';
import { ListItem, IconButton, makeStyles } from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
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
}

export const StepItem = SortableElement(
  ({ value, onNameChange, onToolChange, onDelete }: IProps) => {
    const classes = useStyles();

    const handleNameChange = (name: string) => {
      onNameChange(value.id, name);
    };
    const handleToolChange = (tool: string) => {
      onToolChange(value.id, tool);
    };
    const handleDelete = () => {
      onDelete(value.id);
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
        <IconButton onClick={handleDelete}>
          <DeleteIcon />
        </IconButton>
      </ListItem>
    );
  }
);
