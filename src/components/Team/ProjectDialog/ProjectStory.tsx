import React, { ChangeEvent, useMemo, useState } from 'react';
import { Checkbox, FormControlLabel } from '@mui/material';
import { IProjectDialogState } from './ProjectDialog';
import { shallowEqual, useSelector } from 'react-redux';
import { vProjectSelector } from '../../../selector';
import { IVProjectStrings } from '../../../model';
import { Akuo } from '../../../assets/brands';

export const ProjectStory = (props: IProjectDialogState) => {
  const { state, setState } = props;
  const t: IVProjectStrings = useSelector(vProjectSelector, shallowEqual);
  const { story, type } = state;
  const [newStory, setNewStory] = useState(story);

  const isScripture = useMemo(() => type === 'scripture', [type]);

  const handleCheckboxChange = (
    _event: ChangeEvent<HTMLInputElement>,
    checked: boolean
  ) => {
    setNewStory(checked);
    setState((state) => ({ ...state, story: checked }));
  };

  //future default book for scripture tested but turned off for now
  return !isScripture ? (
    <FormControlLabel
      control={
        <Checkbox
          checked={newStory}
          onChange={handleCheckboxChange}
          value="story"
        />
      }
      label={t.generalStory.replace('{0}', Akuo)}
    />
  ) : (
    <></>
  );
};
