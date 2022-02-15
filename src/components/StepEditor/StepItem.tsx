import { SortableElement } from 'react-sortable-hoc';
import { ListItem, IconButton, makeStyles } from '@material-ui/core';
import HideIcon from '@material-ui/icons/VisibilityOff';
import ShowIcon from '@material-ui/icons/Visibility';
import { IStepRow, DragHandle, stepEditorSelector } from '.';
import StepName from './StepName';
import ToolChoice from './ToolChoice';
import { shallowEqual, useSelector } from 'react-redux';
import { IStepEditorStrings } from '../../model';

const useStyles = makeStyles({
  step: { minWidth: 200 },
  tool: { minWidth: 200 },
});

interface IProps {
  value: { r: IStepRow; i: number };
  index: number;
  onNameChange: (name: string, index: number) => void;
  onToolChange: (tool: string, index: number) => void;
  onDelete: (index: number) => void;
  onRestore: (index: number) => void;
}

export const StepItem = SortableElement(
  ({ value, onNameChange, onToolChange, onDelete, onRestore }: IProps) => {
    const classes = useStyles();
    const se: IStepEditorStrings = useSelector(
      stepEditorSelector,
      shallowEqual
    );

    const handleNameChange = (name: string) => {
      onNameChange(name, value.i);
    };
    const handleToolChange = (tool: string) => {
      onToolChange(tool, value.i);
    };
    const handleDeleteOrRestore = () => {
      if (value.r.seq >= 0) onDelete(value.i);
      else onRestore(value.i);
    };

    return (
      <ListItem>
        <DragHandle />
        <span className={classes.step}>
          <StepName name={value.r.name} onChange={handleNameChange} />
        </span>
        <span className={classes.tool}>
          <ToolChoice tool={value.r.tool} onChange={handleToolChange} />
        </span>
        <IconButton
          onClick={handleDeleteOrRestore}
          title={value.r.seq >= 0 ? se.hide : se.show}
        >
          {value.r.seq < 0 ? <HideIcon /> : <ShowIcon />}
        </IconButton>
      </ListItem>
    );
  }
);
