import { SortableElement } from 'react-sortable-hoc';
import { ListItem, IconButton, makeStyles } from '@material-ui/core';
import HideIcon from '@mui/icons-material/VisibilityOff';
import ShowIcon from '@mui/icons-material/Visibility';
import { IStepRow, DragHandle, stepEditorSelector } from '.';
import StepName from './StepName';
import ToolChoice from './ToolChoice';
import { shallowEqual, useSelector } from 'react-redux';
import { IStepEditorStrings } from '../../model';

const useStyles = makeStyles({
  step: { minWidth: 250 },
  tool: { minWidth: 250 },
});

interface IProps {
  value: IStepRow;
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
      onNameChange(name, value.rIdx);
    };
    const handleToolChange = (tool: string) => {
      onToolChange(tool, value.rIdx);
    };
    const handleDeleteOrRestore = () => {
      if (value.seq >= 0) onDelete(value.rIdx);
      else onRestore(value.rIdx);
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
        <IconButton
          onClick={handleDeleteOrRestore}
          title={value.seq >= 0 ? se.hide : se.show}
        >
          {value.seq < 0 ? <HideIcon /> : <ShowIcon />}
        </IconButton>
      </ListItem>
    );
  }
);
