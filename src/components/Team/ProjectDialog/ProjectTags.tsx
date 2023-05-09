import React from 'react';
import { ITag } from '../../../model';
import { IProjectDialogState } from './ProjectDialog';
import Tags from '../../../control/Tags';

export const ProjectTags = (props: IProjectDialogState) => {
  const { state, setState } = props;
  const { tags } = state;

  const handleChange = (tags: ITag) => {
    setState((state) => ({ ...state, tags }));
  };

  return <Tags tags={tags} onChange={handleChange} sx={{ mb: 2 }} />;
};
